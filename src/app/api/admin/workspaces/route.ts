/**
 * GET /api/admin/workspaces — list all workspaces (paginated) with their stats.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error

  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get('pageSize') ?? '20')))
  const search = url.searchParams.get('q') ?? ''

  const where: any = {}
  if (search) {
    where.OR = [{ name: { contains: search } }, { id: { contains: search } }]
  }

  const [items, total] = await Promise.all([
    db.workspace.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { contacts: true, campaigns: true, members: true } },
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        domain: { select: { domain: true, status: true } },
      },
    }),
    db.workspace.count({ where }),
  ])

  return ok({
    workspaces: items.map((w) => ({
      id: w.id,
      name: w.name,
      status: w.status,
      timezone: w.timezone,
      createdAt: w.createdAt.toISOString(),
      contactsCount: w._count.contacts,
      campaignsCount: w._count.campaigns,
      membersCount: w._count.members,
      plan: w.subscriptions[0]?.plan?.code ?? null,
      planName: w.subscriptions[0]?.plan?.name ?? null,
      subscriptionStatus: w.subscriptions[0]?.status ?? null,
      subscriptionEnd: w.subscriptions[0]?.endDate?.toISOString() ?? null,
      domain: w.domain?.domain ?? null,
      domainStatus: w.domain?.status ?? null,
    })),
    total,
    page,
    pageSize,
  })
}
