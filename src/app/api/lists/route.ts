/**
 * GET /api/lists
 * GET /api/segments  (handled in same folder via /lists endpoint aggregation)
 * POST /api/lists
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const [lists, segments] = await Promise.all([
    db.list.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' }, include: { segments: true } }),
    db.segment.findMany({ where: { workspaceId: ctx.workspace.id } }),
  ])
  return ok({ lists, segments })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body.name) return fail('INVALID_INPUT', 'Nom requis.', 400)
  if (body.kind === 'segment') {
    const s = await db.segment.create({ data: { workspaceId: ctx.workspace.id, name: body.name, ruleType: body.ruleType ?? null, ruleValue: body.ruleValue ?? null, listId: body.listId ?? null } })
    return ok({ segment: s })
  }
  const l = await db.list.create({ data: { workspaceId: ctx.workspace.id, name: body.name, description: body.description ?? null, color: body.color ?? '#0ea5e9' } })
  return ok({ list: l })
}
