/**
 * POST /api/admin/payments/[id]/verify-code — admin confirms the bank validation code.
 *
 * This is the FINAL step: the subscription is activated, a new period is created
 * (extending from current end date or now), and the payment is marked CONFIRME.
 *
 * Status transition: EN_VERIFICATION → CONFIRME + Subscription activated
 *
 * Body: { note? }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok, fail } from '@/lib/api'
import { addMonthsCal } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : null

  const payment = await db.payment.findUnique({
    where: { id },
    include: { subscription: { include: { plan: true } } },
  })
  if (!payment) return fail('NOT_FOUND', 'Paiement introuvable.', 404)

  if (payment.status !== 'EN_VERIFICATION') {
    return fail('INVALID_STATE', `Le code ne peut être vérifié qu'en statut EN_VERIFICATION. Actuel: ${payment.status}.`, 400)
  }

  const plan = payment.subscription?.plan
  if (!plan) return fail('NO_PLAN', 'Plan introuvable pour ce paiement.', 400)

  const now = new Date()
  // Period starts from current end date if still active, else now
  const sub = payment.subscription
  const startDate = sub.endDate && new Date(sub.endDate) > now ? new Date(sub.endDate) : now
  const endDate = addMonthsCal(startDate, plan.durationMonths)

  // 1. Mark payment CONFIRME
  await db.payment.update({
    where: { id },
    data: {
      status: 'CONFIRME',
      codeVerifiedAt: now,
      codeVerifiedBy: ctx.user.id,
      confirmedAt: now,
      confirmedBy: ctx.user.id,
      adminNote: note ?? payment.adminNote,
    },
  })

  // 2. Activate subscription + extend period
  await db.subscription.update({
    where: { id: sub.id },
    data: {
      status: 'ACTIF',
      startDate,
      endDate,
      planId: plan.id,
    },
  })

  await db.auditLog.create({
    data: {
      workspaceId: payment.workspaceId,
      userId: ctx.user.id,
      action: 'ADMIN_CODE_VERIFIED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: JSON.stringify({ note, amount: payment.amount, currency: payment.currency, planCode: plan.code, endDate: endDate.toISOString() }),
    },
  })

  return ok({
    paymentId: payment.id,
    status: 'CONFIRME',
    subscriptionStatus: 'ACTIF',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    plan: { code: plan.code, name: plan.name, price: plan.price, currency: plan.currency, durationMonths: plan.durationMonths },
  })
}
