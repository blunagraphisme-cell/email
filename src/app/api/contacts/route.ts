/**
 * GET    /api/contacts — liste paginée
 * POST   /api/contacts — crée un contact
 * DELETE /api/contacts?id=... — supprime
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(10, Number(url.searchParams.get('pageSize') ?? '20')))
  const search = url.searchParams.get('q') ?? ''
  const status = url.searchParams.get('status') ?? ''
  const where: any = { workspaceId: ctx.workspace.id }
  if (search) where.OR = [{ email: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }, { company: { contains: search } }]
  if (status) where.status = status
  const [items, total] = await Promise.all([
    db.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    db.contact.count({ where }),
  ])
  const byStatus = await db.contact.groupBy({ by: ['status'], where: { workspaceId: ctx.workspace.id }, _count: { _all: true } })
  return ok({ contacts: items, total, page, pageSize, byStatus: byStatus.reduce((acc, s) => { acc[s.status] = s._count._all; return acc }, {} as Record<string, number>) })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body.email || typeof body.email !== 'string') return fail('INVALID_INPUT', 'E-mail requis.', 400)
  const existing = await db.contact.findUnique({ where: { workspaceId_email: { workspaceId: ctx.workspace.id, email: body.email.toLowerCase() } } })
  if (existing) return fail('EMAIL_EXISTS', 'Ce contact existe déjà.', 409)
  const c = await db.contact.create({
    data: {
      workspaceId: ctx.workspace.id,
      email: body.email.toLowerCase(),
      firstName: body.firstName ?? null,
      lastName: body.lastName ?? null,
      phone: body.phone ?? null,
      company: body.company ?? null,
      tags: body.tags ?? null,
      status: 'ACTIF',
    },
  })
  return ok({ contact: c })
}

export async function DELETE(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return fail('INVALID_INPUT', 'id requis.', 400)
  await db.contact.deleteMany({ where: { id, workspaceId: ctx.workspace.id } })
  return ok({})
}
