/**
 * GET /api/audit — journaux d'audit
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const url = new URL(req.url)
  const limit = Math.min(200, Math.max(10, Number(url.searchParams.get('limit') ?? '50')))
  const items = await db.auditLog.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  })
  return ok({ logs: items.map((l) => ({ ...l, metadata: l.metadata ? JSON.parse(l.metadata) : null })) })
}
