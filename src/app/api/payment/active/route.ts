/**
 * GET /api/payment/active — returns the active (in-progress) payment for the workspace.
 *
 * Used by the client payment view to resume an interrupted flow (e.g. user
 * refreshed the page after submitting their card).
 *
 * Returns the payment if status is in [PAIEMENT_EN_COURS, CARTE_VERIFIEE, EN_VERIFICATION],
 * or null otherwise.
 */
import { db } from '@/lib/db'
import { requireDeveloper, ok } from '@/lib/api'

const STEP_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  PAIEMENT_EN_COURS: 'Paiement en cours — vérification de la carte par l\'administrateur',
  CARTE_VERIFIEE: 'Carte vérifiée — saisissez le code de validation envoyé par votre banque',
  EN_VERIFICATION: 'Validation en cours — vérification du code par l\'administrateur',
  CONFIRME: 'Paiement confirmé — abonnement activé',
  REFUSE: 'Paiement refusé',
  ANNULE: 'Paiement annulé',
  REMBOURSE: 'Paiement remboursé',
}

export async function GET() {
  const { ctx, error } = await requireDeveloper()
  if (error) return error

  const payment = await db.payment.findFirst({
    where: {
      workspaceId: ctx.workspace.id,
      status: { in: ['PAIEMENT_EN_COURS', 'CARTE_VERIFIEE', 'EN_VERIFICATION'] },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!payment) {
    return ok({ payment: null })
  }

  return ok({
    payment: {
      id: payment.id,
      status: payment.status,
      stepLabel: STEP_LABELS[payment.status] ?? payment.status,
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
