/**
 * POST /api/subscription/confirm — simule la confirmation d'un paiement
 * Body: { planCode, amount, cardLast4? }
 *
 * Vérifie le prix côté serveur (jamais confiance au montant frontend),
 * crée le paiement, confirme, active/renouvelle l'abonnement, génère période.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { addMonthsCal } from '@/lib/auth'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  const plan = await db.plan.findUnique({ where: { code: body.planCode } })
  if (!plan) return fail('PLAN_NOT_FOUND', 'Plan introuvable.', 400)
  // Vérification du prix côté serveur (anti-falsification)
  if (Number(body.amount) !== Number(plan.price)) {
    return fail('PRICE_MISMATCH', 'Le montant transmis ne correspond pas au plan. Paiement refusé.', 400)
  }
  const txRef = `MOQ-${Date.now()}-${randomBytes(4).toString('hex')}`
  let sub = await db.subscription.findFirst({ where: { workspaceId: ctx.workspace.id }, orderBy: { createdAt: 'desc' } })
  if (!sub) {
    return fail('NO_SUBSCRIPTION', 'Aucun abonnement à confirmer.', 400)
  }
  // idempotence: pas de paiement confirmé récent pour la même période
  const existing = await db.payment.findFirst({
    where: { subscriptionId: sub.id, status: 'CONFIRME', createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
  })
  if (existing) {
    return fail('DUPLICATE_PAYMENT', 'Un paiement récent est déjà confirmé pour cet abonnement.', 400)
  }
  const payment = await db.payment.create({
    data: {
      subscriptionId: sub.id,
      workspaceId: ctx.workspace.id,
      amount: Number(plan.price),
      currency: plan.currency,
      status: 'CONFIRME',
      transactionReference: txRef,
      providerReference: txRef,
      paymentMethod: 'CARD',
      cardLast4: body.cardLast4 ?? null,
      confirmedAt: new Date(),
      confirmedBy: ctx.user.id,
    },
  })
  // Active / renouvelle l'abonnement
  const startDate = sub.endDate && new Date(sub.endDate) > new Date() ? new Date(sub.endDate) : new Date()
  const endDate = addMonthsCal(startDate, plan.durationMonths)
  sub = await db.subscription.update({
    where: { id: sub.id },
    data: {
      status: 'ACTIF',
      startDate,
      endDate,
      planId: plan.id,
    },
  })
  await db.auditLog.create({
    data: { workspaceId: ctx.workspace.id, userId: ctx.user.id, action: 'PAYMENT_CONFIRMED', entityType: 'Payment', entityId: payment.id, metadata: JSON.stringify({ amount: plan.price, currency: plan.currency, txRef }) },
  })
  return ok({
    payment: { ...payment, confirmedAt: payment.confirmedAt?.toISOString() },
    subscription: { ...sub, startDate: sub.startDate?.toISOString() ?? null, endDate: sub.endDate?.toISOString() ?? null },
    plan: { code: plan.code, name: plan.name, price: plan.price, currency: plan.currency, durationMonths: plan.durationMonths, dailyEmailLimit: plan.dailyEmailLimit },
  })
}
