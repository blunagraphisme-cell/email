/**
 * GET /api/stats/campaign?id=... — stats détaillées d'une campagne
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, fail } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return ok({ campaign: null })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return fail('INVALID_INPUT', 'id requis', 400)
  const c = await db.campaign.findFirst({ where: { id, workspaceId: ctx.workspace.id } })
  if (!c) return fail('NOT_FOUND', 'Campagne introuvable', 404)
  const [byType, recent] = await Promise.all([
    db.emailEvent.groupBy({ by: ['eventType'], where: { campaignId: c.id }, _count: { _all: true } }),
    db.emailEvent.findMany({ where: { campaignId: c.id }, orderBy: { occurredAt: 'desc' }, take: 30, select: { eventType: true, contactEmail: true, occurredAt: true } }),
  ])
  const counts: Record<string, number> = {}
  for (const e of byType) counts[e.eventType] = e._count._all
  return ok({
    campaign: c,
    stats: {
      sent: counts.SENT ?? 0,
      delivered: counts.DELIVERED ?? 0,
      opened: counts.OPENED ?? 0,
      clicked: counts.CLICKED ?? 0,
      bounced: counts.BOUNCE ?? 0,
      failed: counts.FAILED ?? 0,
      unsubscribed: counts.UNSUBSCRIBE ?? 0,
    },
    recent,
  })
}
