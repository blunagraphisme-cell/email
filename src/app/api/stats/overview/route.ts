/**
 * GET /api/stats/overview?days=30 — agrège les KPI principaux + by-event-type
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return ok({ stats: null })
  const url = new URL(req.url)
  const days = Math.min(180, Math.max(1, Number(url.searchParams.get('days') ?? '30')))
  const since = new Date(Date.now() - days * 86400000)

  const [byType, recent, campaigns] = await Promise.all([
    db.emailEvent.groupBy({ by: ['eventType'], where: { workspaceId: ctx.workspace.id, occurredAt: { gte: since } }, _count: { _all: true } }),
    db.emailEvent.findMany({ where: { workspaceId: ctx.workspace.id, occurredAt: { gte: since } }, orderBy: { occurredAt: 'asc' }, select: { eventType: true, occurredAt: true } }),
    db.campaign.count({ where: { workspaceId: ctx.workspace.id, status: { in: ['PROGRAMMEE', 'EN_COURS'] } } }),
  ])
  const counts: Record<string, number> = {}
  for (const e of byType) counts[e.eventType] = e._count._all
  // Group by day for trend
  const trend: Record<string, Record<string, number>> = {}
  for (const e of recent) {
    const day = e.occurredAt.toISOString().slice(0, 10)
    if (!trend[day]) trend[day] = { SENT: 0, DELIVERED: 0, OPENED: 0, CLICKED: 0, BOUNCE: 0, FAILED: 0, UNSUBSCRIBE: 0 }
    if (trend[day][e.eventType] !== undefined) trend[day][e.eventType]++
  }
  const trendArr = Object.entries(trend).map(([date, vals]) => ({ date, ...vals })).sort((a, b) => a.date.localeCompare(b.date))
  // quota today
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
      complaint: counts.COMPLAINT ?? 0,
      activeCampaigns: campaigns,
      emailsSentToday: quota?.emailsSent ?? 0,
      dailyLimit: ctx.plan ? Number(ctx.plan.dailyEmailLimit) : 0,
      planCode: ctx.plan?.code,
      planName: ctx.plan?.name,
      subscriptionStatus: ctx.subscription?.status,
      subscriptionEnd: ctx.subscription?.endDate,
    },
    trend: trendArr,
  })
}
