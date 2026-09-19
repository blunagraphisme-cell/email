/**
 * POST /api/admin/payments/[id]/refuse — admin refuses the payment at any step.
 *
 * Body: { reason } — required reason for the refusal
 *
 * Status transition: any active status → REFUSE
 * Subscription is NOT activated (stays in previous state).
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok, fail } from '@/lib/api'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 500) : null
  if (!reason) return fail('INVALID_INPUT', 'Une raison de refus est requise.', 400)

  const payment = await db.payment.findUnique({ where: { id } })
  if (!payment) return fail('NOT_FOUND', 'Paiement introuvable.', 404)

  if (['CONFIRME', 'REFUSE', 'ANNULE', 'REMBOURSE'].includes(payment.status)) {
    return fail('INVALID_STATE', `Le paiement ne peut être refusé qu'en cours de vérification. Actuel: ${payment.status}.`, 400)
  }

  await db.payment.update({
    where: { id },
    data: {
      status: 'REFUSE',
      adminNote: reason,
    },
  })

  await db.auditLog.create({
    data: {
      workspaceId: payment.workspaceId,
      userId: ctx.user.id,
      action: 'ADMIN_PAYMENT_REFUSED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: JSON.stringify({ reason }),
    },
  })

  return ok({ paymentId: payment.id, status: 'REFUSE', reason })
}
