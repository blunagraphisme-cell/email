/**
 * POST /api/payment/initiate — client starts a manual payment flow.
 *
 * Body: { planCode, cardNumber, cardHolderName, cardExpiryMonth, cardExpiryYear, cardCvv }
 *
 * Security rules (per cahier des charges section 14):
 * - Never store the full card number — only last 4 + detected type
 * - Never store the CVV
 * - Store holder name + expiry (needed for admin manual verification)
 *
 * Card type detection:
 * - Visa: starts with 4
 * - Mastercard: starts with 5[1-5] or 2221-2720
 * - Amex: starts with 34 or 37
 *
 * Creates a Payment record with status PAIEMENT_EN_COURS.
 * The admin will then verify the card info manually before the client
 * can enter the bank validation code (3-8 digits).
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireDeveloper, ok, fail } from '@/lib/api'
import { addMonthsCal } from '@/lib/auth'
import { randomBytes } from 'crypto'

function detectCardType(num: string): 'VISA' | 'MASTERCARD' | 'AMEX' | 'OTHER' {
  const n = num.replace(/\s+/g, '')
  if (/^4\d{12}(\d{3})?$/.test(n) || /^4\d{15}$/.test(n)) return 'VISA'
  if (/^5[1-5]\d{14}$/.test(n)) return 'MASTERCARD'
  if (/^2(2[2-9][0-9]{2}|[3-6][0-9]{3}|7[0-1][0-9]{2}|720)[0-9]{12}$/.test(n)) return 'MASTERCARD'
  if (/^3[47]\d{13}$/.test(n)) return 'AMEX'
  return 'OTHER'
}

function isValidCardNumber(num: string): boolean {
  const n = num.replace(/\s+/g, '')
  if (!/^\d{13,19}$/.test(n)) return false
  // Luhn check
  let sum = 0
  let dbl = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10)
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireDeveloper()
  if (error) return error
  const body = await req.json().catch(() => ({}))

  // Validate inputs
  const { planCode, cardNumber, cardHolderName, cardExpiryMonth, cardExpiryYear, cardCvv } = body
  if (!planCode || !cardNumber || !cardHolderName || !cardExpiryMonth || !cardExpiryYear) {
    return fail('INVALID_INPUT', 'Tous les champs de la carte sont requis.', 400)
  }
  if (!isValidCardNumber(cardNumber)) {
    return fail('INVALID_CARD', 'Numéro de carte invalide (échec Luhn).', 400)
  }
  const mm = String(cardExpiryMonth).padStart(2, '0')
  const yy = String(cardExpiryYear).slice(-2)
  if (!/^\d{2}$/.test(mm) || Number(mm) < 1 || Number(mm) > 12) {
    return fail('INVALID_EXPIRY', 'Mois d\'expiration invalide (01-12).', 400)
  }
  if (!/^\d{2}$/.test(yy)) {
    return fail('INVALID_EXPIRY', 'Année d\'expiration invalide.', 400)
  }
  // CVV format (3 digits standard, 4 for Amex) — validated but NEVER stored
  if (typeof cardCvv !== 'string' || !/^\d{3,4}$/.test(cardCvv)) {
    return fail('INVALID_CVV', 'CVV invalide.', 400)
  }

  // Look up plan + price (server-side — never trust client amount)
  const plan = await db.plan.findUnique({ where: { code: planCode } })
  if (!plan) return fail('PLAN_NOT_FOUND', 'Plan introuvable.', 400)

  // Get or create subscription for the workspace
  let sub = await db.subscription.findFirst({
    where: { workspaceId: ctx.workspace.id },
    orderBy: { createdAt: 'desc' },
  })
  if (!sub) {
    return fail('NO_SUBSCRIPTION', 'Aucun abonnement à payer. Inscrivez-vous d\'abord.', 400)
  }

  // Idempotency: refuse if there's already a payment in progress (not CONFIRME/REFUSE/ANNULE)
  const existingActive = await db.payment.findFirst({
    where: {
      subscriptionId: sub.id,
      status: { in: ['PAIEMENT_EN_COURS', 'CARTE_VERIFIEE', 'EN_VERIFICATION'] },
    },
  })
  if (existingActive) {
    return fail('PAYMENT_IN_PROGRESS', 'Un paiement est déjà en cours pour cet abonnement. Attendez la validation admin.', 409)
  }

  const cardType = detectCardType(cardNumber)
  const last4 = cardNumber.replace(/\s+/g, '').slice(-4)
  const txRef = `MOQ-${Date.now()}-${randomBytes(3).toString('hex')}`

  const payment = await db.payment.create({
    data: {
      subscriptionId: sub.id,
      workspaceId: ctx.workspace.id,
      amount: Number(plan.price),
      currency: plan.currency,
      status: 'PAIEMENT_EN_COURS',
      transactionReference: txRef,
      providerReference: txRef,
      paymentMethod: 'CARD',
      cardType,
      cardHolderName: String(cardHolderName).slice(0, 100),
      cardLast4: last4,
      cardExpiryMonth: mm,
      cardExpiryYear: yy,
      // CVV is NEVER stored — discarded here
    },
  })

  await db.auditLog.create({
    data: {
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      action: 'PAYMENT_INITIATED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: JSON.stringify({ planCode, amount: plan.price, cardType, last4 }),
    },
  })

  return ok({
    paymentId: payment.id,
    status: payment.status,
    cardType,
    last4,
    amount: payment.amount,
    currency: payment.currency,
    transactionReference: payment.transactionReference,
  })
}
