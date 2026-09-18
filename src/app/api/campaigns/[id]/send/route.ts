/**
 * POST /api/campaigns/[id]/send — envoie (ou programme) la campagne
 * Vérifie: abonnement actif, quota, domaine vérifié, contacts valides
 * En V1 démo: marque EN_COURS -> ENVOYEE, génère les SENT/DELIVERED/OPENED/CLICKED,
 * incrémente le quota, journalise.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { bumpQuota, getQuotaUsageToday, planLimit } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const { id } = await params
  const c = await db.campaign.findFirst({ where: { id, workspaceId: ctx.workspace.id }, include: { workspace: { include: { domain: true, subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 } } } } })
  if (!c) return fail('NOT_FOUND', 'Campagne introuvable', 404)
  if (c.status === 'EN_COURS' || c.status === 'ENVOYEE') {
    return fail('INVALID_STATE', 'Campagne déjà envoyée ou en cours.', 400)
  }
  // Vérifications
  if (ctx.subscription?.status !== 'ACTIF') {
    return fail('SUBSCRIPTION_INACTIVE', 'Abonnement non actif.', 403)
  }
  const domain = c.workspace.domain
  if (!domain || domain.status !== 'VERIFIE') {
    return fail('DOMAIN_NOT_VERIFIED', 'Le domaine d\'envoi doit être vérifié avant d\'envoyer.', 400)
  }
  if (!c.fromEmail || !c.subject || !c.content) {
    return fail('INCOMPLETE_CAMPAIGN', 'Campagne incomplète (sujet, expéditeur, contenu requis).', 400)
  }
  // Quota
  const plan = ctx.plan!
  const { emailsSent } = await getQuotaUsageToday(ctx.workspace.id)
  const contacts = await db.contact.findMany({ where: { workspaceId: ctx.workspace.id, status: 'ACTIF' } })
  if (emailsSent + contacts.length > plan.dailyEmailLimit) {
    return fail('QUOTA_EXCEEDED', `Quota quotidien insuffisant. Restant: ${Math.max(0, plan.dailyEmailLimit - emailsSent)} / requis: ${contacts.length}`, 400)
  }
  // Envoi (simulé): passe EN_COURS, génère SENT/DELIVERED, puis OPENED/CLICKED/UNSUBSCRIBE
  await db.campaign.update({ where: { id }, data: { status: 'EN_COURS', recipientCount: contacts.length } })
  const now = new Date()
  const events: any[] = []
  for (const contact of contacts) {
    events.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-SENT`, eventType: 'SENT', occurredAt: now,
      messageId: `msg-${contact.id}@mailoqui.com`,
    })
    events.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-DELIVERED`, eventType: 'DELIVERED', occurredAt: new Date(now.getTime() + 30000 + Math.random() * 60000),
      messageId: `msg-${contact.id}@mailoqui.com`,
    })
  }
  // OPENED for ~60%
  for (const contact of contacts) {
    if (Math.random() < 0.6) events.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-OPENED`, eventType: 'OPENED', occurredAt: new Date(now.getTime() + 3600000 + Math.random() * 86400000),
      messageId: `msg-${contact.id}@mailoqui.com`,
    })
    if (Math.random() < 0.25) events.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-CLICKED`, eventType: 'CLICKED', occurredAt: new Date(now.getTime() + 7200000 + Math.random() * 86400000),
      messageId: `msg-${contact.id}@mailoqui.com`,
    })
    if (Math.random() < 0.04) events.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-UNSUB`, eventType: 'UNSUBSCRIBE', occurredAt: new Date(now.getTime() + 10800000 + Math.random() * 86400000),
      messageId: `msg-${contact.id}@mailoqui.com`,
    })
    if (Math.random() < 0.03) events.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-BOUNCE`, eventType: 'BOUNCE', occurredAt: new Date(now.getTime() + 60000),
      messageId: `msg-${contact.id}@mailoqui.com`,
    })
  }
  // Insert (chunked)
  for (let i = 0; i < events.length; i += 200) {
    for (const e of events.slice(i, i + 200)) {
      try { await db.emailEvent.create({ data: e }) } catch {}
    }
  }
  await db.campaign.update({ where: { id }, data: { status: 'ENVOYEE', sentAt: now } })
  await bumpQuota(ctx.workspace.id, contacts.length, 0)
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'CAMPAIGN_SENT', entityType: 'Campaign', entityId: c.id, metadata: JSON.stringify({ recipients: contacts.length }) },
  })
  return ok({ sentTo: contacts.length, status: 'ENVOYEE' })
}
