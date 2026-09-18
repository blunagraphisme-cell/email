/**
 * GET  /api/domain — configuration domaine du workspace
 * POST /api/domain — configure le domaine (et lance une "vérification" simulée)
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const domain = await db.domain.findUnique({ where: { workspaceId: ctx.workspace.id } })
  return ok({ domain })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  if (!body.domain) return fail('INVALID_INPUT', 'Domaine requis.', 400)
  // Vérification simulée: si le domaine contient "oquitogo.com" ou "mailoqui.com" -> VÉRIFIÉ
  // (en prod: résolution DNS réelle SPF/DKIM/DMARC)
  const verified = /oquitogo\.com$|mailoqui\.com$/.test(body.domain)
  const data = {
    domain: body.domain,
    status: verified ? 'VERIFIE' : 'ERREUR',
    spfStatus: verified ? 'VERIFIE' : 'NON_CONFIGURE',
    dkimStatus: verified ? 'VERIFIE' : 'NON_CONFIGURE',
    dmarcStatus: verified ? 'VERIFIE' : 'NON_CONFIGURE',
    lastCheckedAt: new Date(),
    errors: verified ? null : 'DNS introuvable. Ajoutez les enregistrements SPF/DKIM/DMARC.',
  }
  const existing = await db.domain.findUnique({ where: { workspaceId: ctx.workspace.id } })
  let domain
  if (existing) {
    domain = await db.domain.update({ where: { workspaceId: ctx.workspace.id }, data })
  } else {
    domain = await db.domain.create({ data: { workspaceId: ctx.workspace.id, ...data } })
  }
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'DOMAIN_UPDATED', entityType: 'Domain', entityId: domain.id, metadata: JSON.stringify({ domain: body.domain, status: domain.status }) },
  })
  return ok({ domain })
}

// NOTE: requireDeveloper is in @/lib/auth, re-exported for convenience
