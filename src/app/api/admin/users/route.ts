/**
 * GET /api/admin/users — list all users (paginated).
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
    where.OR = [{ email: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }]
  }

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { memberships: true, auditLogs: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return ok({
    users: items.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      workspacesCount: u._count.memberships,
      auditLogsCount: u._count.auditLogs,
    })),
    total,
    page,
    pageSize,
  })
}
