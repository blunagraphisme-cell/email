/**
 * GET  /api/support — liste les tickets
 * POST /api/support — crée un ticket
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return ok({ tickets: [] })
  const items = await db.supportTicket.findMany({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
  })
  return ok({ tickets: items })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return fail('NO_WORKSPACE', 'Aucun workspace.', 403)
  const body = await req.json().catch(() => ({}))
  if (!body.subject || !body.message) return fail('INVALID_INPUT', 'Sujet et message requis.', 400)
  const t = await db.supportTicket.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      subject: body.subject,
      category: body.category ?? 'AUTRE',
      priority: body.priority ?? 'NORMALE',
      status: 'OUVERT',
      message: body.message,
    },
  })
  return ok({ ticket: t })
}
