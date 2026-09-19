/**
 * GET  /api/templates
 * POST /api/templates
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const items = await db.template.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { updatedAt: 'desc' } })
  return ok({ templates: items.map((t) => ({ ...t, content: t.content ? JSON.parse(t.content) : null })) })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body.name) return fail('INVALID_INPUT', 'Nom requis.', 400)
  const t = await db.template.create({
    data: {
      workspaceId: ctx.workspace.id,
      name: body.name,
      category: body.category ?? 'Newsletter',
      content: body.content ? JSON.stringify(body.content) : null,
      thumbnail: body.thumbnail ?? null,
    },
  })
  return ok({ template: t })
}
