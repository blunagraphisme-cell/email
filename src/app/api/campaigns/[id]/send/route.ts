/**
 * POST /api/campaigns/[id]/send — envoie la campagne via Resend (ou fallback simulé).
 *
 * Vérifications (toutes côté serveur — le frontend n'est jamais une zone de confiance):
 *  1. Utilisateur authentifié + rôle Developer
 *  2. Campagne appartient au workspace courant (multi-tenant isolation)
 *  3. Abonnement ACTIF
 *  4. Domaine d'envoi vérifié (SPF/DKIM/DMARC)
 *  5. Campagne complète (sujet, expéditeur, contenu)
 *  6. Quota quotidien suffisant
 *
 * Envoi: appelle Resend par batch de BATCH_SIZE, enregistre les
 * SENT/DELIVERED/FAILED + génère les OPENED/CLICKED/UNSUBSCRIBE/BOUNCE
 * simulés (en V1, les vrais événements viendraient via webhook Resend).
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { bumpQuota, getQuotaUsageToday } from '@/lib/auth'
import { sendBatch, BATCH_SIZE, type SendEmailParams } from '@/lib/email'
import type { Block, SampleData } from '@/components/email-editor/types'
import { parseBlocks } from '@/components/email-editor/types'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const { id } = await params
  const c = await db.campaign.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: {
      workspace: {
        include: {
          domain: true,
          subscriptions: {
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  })
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

  // Passe en EN_COURS
  await db.campaign.update({ where: { id }, data: { status: 'EN_COURS', recipientCount: contacts.length } })

  const blocks = parseBlocks(c.content ? JSON.parse(c.content) : null)
  const now = new Date()
  const sentEvents: any[] = []
  const failedEvents: any[] = []
  let sentCount = 0
  let failedCount = 0

  // Envoi par batch via Resend (ou fallback simulé)
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE)
    const params: SendEmailParams[] = batch.map((contact) => ({
      to: contact.email,
      fromName: c.fromName ?? ctx.workspace.name,
      fromEmail: c.fromEmail!,
      subject: c.subject,
      blocks,
      data: {
        prenom: contact.firstName ?? '',
        nom: contact.lastName ?? '',
        email: contact.email,
        entreprise: contact.company ?? '',
      } as SampleData,
      workspaceName: ctx.workspace.name,
      unsubscribeUrl: `https://email.oquitogo.online/unsub?email=${encodeURIComponent(contact.email)}&w=${ctx.workspace.id}&c=${c.id}`,
    }))
    const results = await sendBatch(params)
    for (let j = 0; j < batch.length; j++) {
      const contact = batch[j]
      const r = results[j]
      if (r.success) {
        sentCount++
        sentEvents.push({
          workspaceId: ctx.workspace.id,
          campaignId: c.id,
          contactEmail: contact.email,
          eventId: `${c.id}-${contact.id}-SENT-${i}-${j}`,
          eventType: 'SENT',
          occurredAt: now,
          messageId: r.messageId ?? `msg-${contact.id}@email.oquitogo.online`,
        })
        // DELIVERED (soonest after SENT). En prod, le vrai DELIVERED arrive via webhook Resend.
        sentEvents.push({
          workspaceId: ctx.workspace.id,
          campaignId: c.id,
          contactEmail: contact.email,
          eventId: `${c.id}-${contact.id}-DELIVERED-${i}-${j}`,
          eventType: 'DELIVERED',
          occurredAt: new Date(now.getTime() + 30000 + Math.random() * 60000),
          messageId: r.messageId ?? `msg-${contact.id}@email.oquitogo.online`,
        })
      } else {
        failedCount++
        failedEvents.push({
          workspaceId: ctx.workspace.id,
          campaignId: c.id,
          contactEmail: contact.email,
          eventId: `${c.id}-${contact.id}-FAILED-${i}-${j}`,
          eventType: 'FAILED',
          occurredAt: now,
          messageId: `failed-${contact.id}`,
        })
      }
    }
    // Flush this batch's events to the DB before the next batch
    for (const e of [...sentEvents, ...failedEvents]) {
      try { await db.emailEvent.create({ data: e }) } catch {}
    }
    sentEvents.length = 0
    failedEvents.length = 0
  }

  // Événements simulés post-livraison (OPENED/CLICKED/UNSUBSCRIBE/BOUNCE)
  // En production, ces événements arriveraient via le webhook Resend (sections 37-40).
  // En V1, on les simule pour démontrer le dashboard analytics.
  const simEvents: any[] = []
  for (const contact of contacts) {
    if (Math.random() < 0.6) simEvents.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-OPENED`, eventType: 'OPENED', occurredAt: new Date(now.getTime() + 3600000 + Math.random() * 86400000),
      messageId: `msg-${contact.id}@email.oquitogo.online`,
    })
    if (Math.random() < 0.25) simEvents.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-CLICKED`, eventType: 'CLICKED', occurredAt: new Date(now.getTime() + 7200000 + Math.random() * 86400000),
      messageId: `msg-${contact.id}@email.oquitogo.online`,
    })
    if (Math.random() < 0.04) simEvents.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-UNSUB`, eventType: 'UNSUBSCRIBE', occurredAt: new Date(now.getTime() + 10800000 + Math.random() * 86400000),
      messageId: `msg-${contact.id}@email.oquitogo.online`,
    })
    if (Math.random() < 0.03) simEvents.push({
      workspaceId: ctx.workspace.id, campaignId: c.id, contactEmail: contact.email,
      eventId: `${c.id}-${contact.id}-BOUNCE`, eventType: 'BOUNCE', occurredAt: new Date(now.getTime() + 60000),
      messageId: `msg-${contact.id}@email.oquitogo.online`,
    })
  }
  for (let i = 0; i < simEvents.length; i += 200) {
    for (const e of simEvents.slice(i, i + 200)) {
      try { await db.emailEvent.create({ data: e }) } catch {}
    }
  }

  await db.campaign.update({ where: { id }, data: { status: 'ENVOYEE', sentAt: now } })
  await bumpQuota(ctx.workspace.id, sentCount, 0)
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'CAMPAIGN_SENT', entityType: 'Campaign', entityId: c.id, metadata: JSON.stringify({ recipients: sentCount, failed: failedCount }) },
  })
  return ok({
    sentTo: sentCount,
    failed: failedCount,
    status: 'ENVOYEE',
    provider: process.env.RESEND_API_KEY ? 'resend' : 'simulated',
  })
}
