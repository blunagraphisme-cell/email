/**
 * GET /api/admin/tickets — list all support tickets across all workspaces.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error

  const url = new URL(req.url)
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get('limit') ?? '50')))
  const status = url.searchParams.get('status') ?? ''

  const where: any = {}
  if (status) where.status = status

  const items = await db.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      workspace: { select: { name: true } },
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })

  return ok({
    tickets: items.map((t) => ({
      id: t.id,
      workspaceName: t.workspace.name,
      userEmail: t.user.email,
      userName: [t.user.firstName, t.user.lastName].filter(Boolean).join(' '),
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      message: t.message,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  })
}
