/**
 * GET  /api/automations
 * POST /api/automations
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const items = await db.automation.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { updatedAt: 'desc' } })
  return ok({ automations: items.map((a) => ({ ...a, configuration: a.configuration ? JSON.parse(a.configuration) : [] })) })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body.name) return fail('INVALID_INPUT', 'Nom requis.', 400)
  const a = await db.automation.create({
    data: {
      workspaceId: ctx.workspace.id,
      name: body.name,
      status: body.status ?? 'BROUILLON',
      configuration: body.configuration ? JSON.stringify(body.configuration) : null,
    },
  })
  return ok({ automation: a })
}
