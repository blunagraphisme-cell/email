/**
 * GET  /api/notifications — liste
 * POST /api/notifications/read — marque toutes comme lues
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return ok({ notifications: [] })
  const items = await db.notification.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return ok({ notifications: items })
}

export async function POST(_req: NextRequest) {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return ok({})
  await db.notification.updateMany({ where: { workspaceId: ctx.workspace.id, read: false }, data: { read: true } })
  return ok({})
}
