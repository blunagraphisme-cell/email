/**
 * GET  /api/apikeys — liste
 * POST /api/apikeys — crée une clé (renvoie la clé en clair une seule fois)
 * DELETE /api/apikeys?id=... — révoque
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { randomBytes, createHash } from 'crypto'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const items = await db.apiKey.findMany({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' } })
  return ok({ keys: items })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body.name) return fail('INVALID_INPUT', 'Nom requis.', 400)
  const raw = `moq_live_${randomBytes(24).toString('hex')}`
  const keyHash = createHash('sha256').update(raw).digest('hex')
  const keyPrefix = raw.slice(0, 12)
  const k = await db.apiKey.create({
    data: {
      workspaceId: ctx.workspace.id,
      name: body.name,
      keyPrefix,
      keyHash,
      status: 'ACTIF',
      createdById: ctx.user.id,
    },
  })
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'API_KEY_GENERATED', entityType: 'ApiKey', entityId: k.id, metadata: JSON.stringify({ name: body.name }) },
  })
  // Return the raw key ONCE
  return ok({ key: { ...k, raw } })
}

export async function DELETE(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return fail('INVALID_INPUT', 'id requis.', 400)
  await db.apiKey.updateMany({ where: { id, workspaceId: ctx.workspace.id }, data: { status: 'REVOQUE', revokedAt: new Date() } })
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'API_KEY_REVOKED', entityType: 'ApiKey', entityId: id, metadata: '{}' },
  })
  return ok({})
}
