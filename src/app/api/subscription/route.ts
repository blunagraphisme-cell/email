/**
 * GET /api/subscription — renvoie abonnement courant + plans disponibles
 * POST /api/subscription/renew — génère un lien de renouvellement
 * POST /api/subscription/confirm — confirme un paiement (simulé) et active l'abonnement
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireDeveloper, ok, fail } from '@/lib/api'
import { addMonthsCal, randomToken, hashToken } from '@/lib/auth'

export async function GET() {
  const { ctx, error } = await requireAuth()
  if (error) return error
  if (!ctx?.workspace) return ok({ subscription: null, plans: [] })
  const plans = await db.plan.findMany({ where: { status: 'ACTIF' }, orderBy: { price: 'asc' } })
  const sub = await db.subscription.findFirst({
    where: { workspaceId: ctx.workspace.id },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  })
  return ok({
    subscription: sub ? { ...sub, endDate: sub.endDate?.toISOString() ?? null, startDate: sub.startDate?.toISOString() ?? null } : null,
    plan: ctx.plan,
  })
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  const sub = await db.subscription.findFirst({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' } })
  if (!sub) return fail('NO_SUBSCRIPTION', 'Aucun abonnement.', 400)
  const plan = await db.plan.findUnique({ where: { code: body.planCode ?? ctx.plan?.code ?? 'STARTER_3M' } })
  if (!plan) return fail('PLAN_NOT_FOUND', 'Plan introuvable.', 400)
  const token = randomToken(24)
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000)
  const link = await db.renewalLink.create({
    data: {
      subscriptionId: sub.id,
      workspaceId: ctx.workspace.id,
      createdById: ctx.user.id,
      operationType: body.operationType ?? 'RENEW',
      tokenHash,
      expiresAt,
      status: 'ACTIF',
    },
  })
  // simulation: en V1 on génère un lien visible côté Developer
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'RENEWAL_LINK_GENERATED', entityType: 'RenewalLink', entityId: link.id, metadata: JSON.stringify({ operationType: link.operationType }) },
  })
  return ok({ linkId: link.id, token, expiresAt: expiresAt.toISOString(), planCode: plan.code, planName: plan.name, amount: plan.price, currency: plan.currency })
}
