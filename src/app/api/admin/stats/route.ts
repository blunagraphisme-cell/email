/**
 * GET /api/admin/stats — global platform KPIs for the Platform Admin dashboard.
 * Returns counts + revenue + email volume across all workspaces.
 */
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error

  const [
    workspaces,
    activeSubscriptions,
    expiringSoon,
    expired,
    suspended,
    users,
    emailVolume,
    pendingPayments,
    confirmedPayments,
    tickets,
    openTickets,
  ] = await Promise.all([
    db.workspace.count(),
    db.subscription.count({ where: { status: 'ACTIF' } }),
    db.subscription.count({ where: { status: 'EXPIRANT_BIENTOT' } }),
    db.subscription.count({ where: { status: 'EXPIRE' } }),
    db.subscription.count({ where: { status: 'SUSPENDU' } }),
    db.user.count(),
    db.emailEvent.count({ where: { eventType: 'SENT' } }),
    db.payment.count({ where: { status: 'EN_ATTENTE' } }),
    db.payment.count({ where: { status: 'CONFIRME' } }),
    db.supportTicket.count(),
    db.supportTicket.count({ where: { status: { in: ['OUVERT', 'EN_COURS'] } } }),
  ])

  // Total revenue (sum of confirmed payments)
  const revenueAgg = await db.payment.aggregate({
    where: { status: 'CONFIRME' },
    _sum: { amount: true },
  })
  const revenue = revenueAgg._sum.amount ?? 0

  // Recent workspaces (last 5)
  const recentWorkspaces = await db.workspace.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      _count: { select: { contacts: true, campaigns: true } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  // Last 7 days trend: new workspaces + emails sent
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const recentTrend = await db.workspace.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: sevenDaysAgo } },
    _count: { _all: true },
  })

  return ok({
    stats: {
      workspaces,
      activeSubscriptions,
      expiringSoon,
      expired,
      suspended,
      users,
      emailVolume,
      pendingPayments,
      confirmedPayments,
      tickets,
      openTickets,
      revenue,
    },
    recentWorkspaces: recentWorkspaces.map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
      contactsCount: w._count.contacts,
      campaignsCount: w._count.campaigns,
      plan: w.subscriptions[0]?.plan?.code ?? null,
      subscriptionStatus: w.subscriptions[0]?.status ?? null,
    })),
  })
}
