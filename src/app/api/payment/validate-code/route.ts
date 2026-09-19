/**
 * POST /api/payment/validate-code — client enters the bank validation code (3-8 digits).
 *
 * Only allowed when the payment status is CARTE_VERIFIEE (admin already verified the card).
 * Stores the code (plain — admin needs to read it to verify) and sets status to
 * EN_VERIFICATION. Admin then confirms/refuses to activate the subscription.
 *
 * Body: { paymentId, code }
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))
  const { paymentId, code } = body

  if (!paymentId || typeof code !== 'string') {
    return fail('INVALID_INPUT', 'paymentId et code sont requis.', 400)
  }
  // 3-8 digits exactly
  if (!/^\d{3,8}$/.test(code)) {
    return fail('INVALID_CODE', 'Le code de validation doit contenir entre 3 et 8 chiffres.', 400)
  }

  const payment = await db.payment.findFirst({
    where: { id: paymentId, workspaceId: ctx.workspace.id },
  })
  if (!payment) return fail('NOT_FOUND', 'Paiement introuvable.', 404)

  if (payment.status !== 'CARTE_VERIFIEE') {
    return fail('INVALID_STATE', `Le code ne peut être saisi qu'après vérification de la carte par l'admin. Statut actuel: ${payment.status}.`, 400)
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      validationCode: code,
      status: 'EN_VERIFICATION',
    },
  })

  await db.auditLog.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      action: 'PAYMENT_CODE_SUBMITTED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: JSON.stringify({ code }),
    },
  })

  return ok({ paymentId: payment.id, status: 'EN_VERIFICATION' })
}
