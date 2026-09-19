/**
 * POST /api/admin/payments/[id]/verify-card — admin confirms the card info is valid.
 *
 * After this, the client will be prompted to enter the bank validation code (3-8 digits).
 * Body: { note? } — optional admin note about the verification.
 *
 * Status transition: PAIEMENT_EN_COURS → CARTE_VERIFIEE
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePlatformAdmin, ok, fail } from '@/lib/api'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await requirePlatformAdmin()
  if (error) return error
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const note = typeof body.note === 'string' ? body.note.slice(0, 500) : null

  const payment = await db.payment.findUnique({
    where: { id },
    include: { workspace: { include: { subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 } } } },
  })
  if (!payment) return fail('NOT_FOUND', 'Paiement introuvable.', 404)

  if (payment.status !== 'PAIEMENT_EN_COURS') {
    return fail('INVALID_STATE', `La carte ne peut être vérifiée qu'en statut PAIEMENT_EN_COURS. Actuel: ${payment.status}.`, 400)
  }

  await db.payment.update({
    where: { id },
    data: {
      status: 'CARTE_VERIFIEE',
      cardVerifiedAt: new Date(),
      cardVerifiedBy: ctx.user.id,
      adminNote: note ?? payment.adminNote,
    },
  })

  await db.auditLog.create({
    data: {
      workspaceId: payment.workspaceId,
      userId: ctx.user.id,
      action: 'ADMIN_CARD_VERIFIED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: JSON.stringify({ note }),
    },
  })

  return ok({ paymentId: payment.id, status: 'CARTE_VERIFIEE' })
}
