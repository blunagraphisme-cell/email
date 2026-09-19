/**
 * GET /api/payment/status?id=... — client polls the current payment status.
 *
 * Returns the payment record (with card info visible to the client — they
 * entered it) + current step in the manual verification flow.
 */
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return fail('INVALID_INPUT', 'id requis.', 400)

  const payment = await db.payment.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
  })
  if (!payment) return fail('NOT_FOUND', 'Paiement introuvable.', 404)

  // Map status to a human-readable step
  const stepLabel: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    PAIEMENT_EN_COURS: 'Paiement en cours — vérification de la carte par l\'administrateur',
    CARTE_VERIFIEE: 'Carte vérifiée — saisissez le code de validation envoyé par votre banque',
    EN_VERIFICATION: 'Validation en cours — vérification du code par l\'administrateur',
    CONFIRME: 'Paiement confirmé — abonnement activé',
    REFUSE: 'Paiement refusé',
    ANNULE: 'Paiement annulé',
    REMBOURSE: 'Paiement remboursé',
  }

  return ok({
    payment: {
      id: payment.id,
      status: payment.status,
      stepLabel: stepLabel[payment.status] ?? payment.status,
      amount: payment.amount,
      currency: payment.currency,
      cardType: payment.cardType,
      cardLast4: payment.cardLast4,
      cardHolderName: payment.cardHolderName,
      cardExpiryMonth: payment.cardExpiryMonth,
      cardExpiryYear: payment.cardExpiryYear,
      transactionReference: payment.transactionReference,
      createdAt: payment.createdAt.toISOString(),
      cardVerifiedAt: payment.cardVerifiedAt?.toISOString() ?? null,
      codeVerifiedAt: payment.codeVerifiedAt?.toISOString() ?? null,
      confirmedAt: payment.confirmedAt?.toISOString() ?? null,
      adminNote: payment.adminNote,
    },
  })
}
