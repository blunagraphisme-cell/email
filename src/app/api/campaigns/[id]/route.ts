/**
 * GET    /api/campaigns/[id] — détail d'une campagne + stats
 * PATCH  /api/campaigns/[id] — met à jour (brouillon / programmée)
 * DELETE /api/campaigns/[id] — supprime
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const { id } = await params
  const c = await db.campaign.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
  if (!c) return fail('NOT_FOUND', 'Campagne introuvable', 404)
  const events = await db.emailEvent.groupBy({ by: ['eventType'], where: { campaignId: c.id }, _count: { _all: true } })
  const counts: Record<string, number> = {}
  for (const e of events) counts[e.eventType] = e._count._all
  // recent events list
  const recent = await db.emailEvent.findMany({ where: { campaignId: c.id }, orderBy: { occurredAt: 'desc' }, take: 20 })
  return ok({
    campaign: {
      ...c,
      content: c.content ? JSON.parse(c.content) : null,
    },
    stats: {
      sent: counts.SENT ?? 0,
      delivered: counts.DELIVERED ?? 0,
      opened: counts.OPENED ?? 0,
      clicked: counts.CLICKED ?? 0,
      bounced: counts.BOUNCE ?? 0,
      failed: counts.FAILED ?? 0,
      unsubscribed: counts.UNSUBSCRIBE ?? 0,
      complaint: counts.COMPLAINT ?? 0,
    },
    recentEvents: recent,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const { id } = await params
  const c = await db.campaign.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
  if (!c) return fail('NOT_FOUND', 'Campagne introuvable', 404)
  if (c.status === 'EN_COURS' || c.status === 'ENVOYEE') {
    return fail('INVALID_STATE', 'Campagne verrouillée (envoi en cours ou envoyée).', 400)
  }
  const body = await req.json().catch(() => ({}))
  const data: any = {}
  if (typeof body.name === 'string') data.name = body.name
  if (typeof body.subject === 'string') data.subject = body.subject
  if (typeof body.fromName === 'string') data.fromName = body.fromName
  if (typeof body.fromEmail === 'string') data.fromEmail = body.fromEmail
  if (body.content !== undefined) data.content = JSON.stringify(body.content)
  if (body.htmlContent !== undefined) data.htmlContent = body.htmlContent
  if (body.status && ['BROUILLON', 'PROGRAMMEE', 'ANNULEE'].includes(body.status)) data.status = body.status
  if (body.scheduledAt) data.scheduledAt = new Date(body.scheduledAt)
  const updated = await db.campaign.update({ where: { id }, data })
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'CAMPAIGN_UPDATED', entityType: 'Campaign', entityId: c.id, metadata: JSON.stringify({ status: data.status ?? c.status }) },
  })
  return ok({ campaign: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const { id } = await params
  const c = await db.campaign.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
  if (!c) return fail('NOT_FOUND', 'Campagne introuvable', 404)
  await db.emailEvent.deleteMany({ where: { campaignId: c.id } })
  await db.campaign.delete({ where: { id } })
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'CAMPAIGN_DELETED', entityType: 'Campaign', entityId: c.id, metadata: '{}' },
  })
  return ok({})
}
