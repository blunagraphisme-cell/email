/**
 * GET /api/owner/stats — dashboard Owner (read-only, agrégé)
 */
import { db } from '@/lib/db'
import { requireAuth, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return fail('NO_WORKSPACE', 'Aucun workspace', 403)
  // Owner ne voit que les KPI principaux, sans données techniques
  const since30 = new Date(Date.now() - 30 * 86400000)
  const [byType, recent, campaigns, sub] = await Promise.all([
    db.emailEvent.groupBy({ by: ['eventType'], where: { workspaceId: ctx.workspace.id, occurredAt: { gte: since30 } }, _count: { _all: true } }),
    db.emailEvent.findMany({ where: { workspaceId: ctx.workspace.id, occurredAt: { gte: since30 } }, orderBy: { occurredAt: 'asc' }, select: { eventType: true, occurredAt: true } }),
    db.campaign.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, status: true, sentAt: true, recipientCount: true } }),
    db.subscription.findFirst({ where: { workspaceId: ctx.workspace.id }, include: { plan: true }, orderBy: { createdAt: 'desc' } }),
  ])
  const counts: Record<string, number> = {}
  for (const e of byType) counts[e.eventType] = e._count._all
  const trend: Record<string, Record<string, number>> = {}
  for (const e of recent) {
    const day = e.occurredAt.toISOString().slice(0, 10)
    if (!trend[day]) trend[day] = { SENT: 0, DELIVERED: 0, OPENED: 0, CLICKED: 0 }
    if (trend[day][e.eventType] !== undefined) trend[day][e.eventType]++
  }
  const trendArr = Object.entries(trend).map(([date, vals]) => ({ date, ...vals })).sort((a, b) => a.date.localeCompare(b.date))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const quota = await db.quotaUsage.findUnique({ where: { workspaceId_date: { workspaceId: ctx.workspace.id, date: today } } })
  return ok({
    stats: {
      sent: counts.SENT ?? 0,
      delivered: counts.DELIVERED ?? 0,
      opened: counts.OPENED ?? 0,
      clicked: counts.CLICKED ?? 0,
      bounced: counts.BOUNCE ?? 0,
      failed: counts.FAILED ?? 0,
      unsubscribed: counts.UNSUBSCRIBE ?? 0,
      emailsSentToday: quota?.emailsSent ?? 0,
      dailyLimit: ctx.plan ? Number(ctx.plan.dailyEmailLimit) : 0,
    },
    trend: trendArr,
    campaigns,
    subscription: sub ? { status: sub.status, endDate: sub.endDate?.toISOString() ?? null, planName: sub.plan.name, planCode: sub.plan.code } : null,
  })
}
