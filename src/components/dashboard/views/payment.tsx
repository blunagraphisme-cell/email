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
  PAIEMENT_EN_COURS: { label: 'Paiement en cours — vérification carte', color: 'border-foreground/30 bg-foreground/10 text-foreground', icon: Clock },
  CARTE_VERIFIEE: { label: 'Carte vérifiée — saisissez le code', color: 'border-foreground/30 bg-foreground/10 text-foreground', icon: CheckCircle2 },
  EN_VERIFICATION: { label: 'Validation en cours — vérification code', color: 'border-foreground/30 bg-foreground/10 text-foreground', icon: Clock },
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

export function PaymentView() {
  const workspace = useAppStore((s) => s.workspace)
  const viewParam = useAppStore((s) => s.viewParam)
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)

  // Card form
  const [cardNumber, setCardNumber] = React.useState('')
  const [cardHolderName, setCardHolderName] = React.useState('')
  const [cardExpiryMonth, setCardExpiryMonth] = React.useState('')
  const [cardExpiryYear, setCardExpiryYear] = React.useState('')
  const [cardCvv, setCardCvv] = React.useState('')
  const [submittingCard, setSubmittingCard] = React.useState(false)

  // Payment state (after card submitted)
  const [payment, setPayment] = React.useState<PaymentData | null>(null)
  const [polling, setPolling] = React.useState(false)

  // Code form
  const [code, setCode] = React.useState('')
  const [submittingCode, setSubmittingCode] = React.useState(false)

  const detectedType = detectCardType(cardNumber)
  const planCode = viewParam ?? 'STARTER_3M'

  // Format card number on input
  const handleCardNumberChange = (v: string) => {
    setCardNumber(formatCardNumber(v))
  }

  // Submit card info
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
    if (!cardExpiryMonth || !cardExpiryYear || Number(cardExpiryMonth) < 1 || Number(cardExpiryMonth) > 12) {
      toast.error('Mois d\'expiration invalide (01-12).')
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
          cardExpiryMonth,
          cardExpiryYear,
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

  // Poll payment status
  const fetchPayment = React.useCallback(async (id: string) => {
    setPolling(true)
    try {
      const res = await fetch(`/api/payment/status?id=${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setPayment(data.payment)
      }
    } catch {} finally {
      setPolling(false)
    }
  }, [])

  // Auto-poll while payment is in active verification states
  React.useEffect(() => {
    if (!payment) return
    const activeStates = ['PAIEMENT_EN_COURS', 'CARTE_VERIFIEE', 'EN_VERIFICATION']
    if (!activeStates.includes(payment.status)) return
    const interval = setInterval(() => { fetchPayment(payment.id) }, 5000)
    return () => clearInterval(interval)
  }, [payment, fetchPayment])

  // On mount: check if there's an active payment for this workspace (resume flow)
  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/payment/active', { cache: 'no-store' })
        const data = await res.json()
        if (data.success && data.payment) {
          setPayment(data.payment)
        }
      } catch {}
    })()
  }, [])

  // Submit validation code
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
        toast.error(data?.error?.message ?? 'Erreur lors de la validation.')
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

  // When confirmed, refresh session + redirect to dashboard
  React.useEffect(() => {
    if (payment?.status === 'CONFIRME') {
      toast.success('Abonnement activé. Redirection…')
      refreshSession()
      setTimeout(() => setView('dashboard'), 1500)
    }
  }, [payment?.status, refreshSession, setView])

  const fmtMoney = (n: number, c: string) => new Intl.NumberFormat('en-US', { style: 'currency', currency: c }).format(n)

  return (
    <main className="flex-1">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setView('subscription')}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Retour à l'abonnement
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Paiement de l'abonnement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspace: <span className="font-medium text-foreground">{workspace?.name}</span> · Plan: <span className="font-medium text-foreground">{planCode}</span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* No active payment → show card form */}
        {!payment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="size-5" />
                Informations de carte
              </CardTitle>
              <CardDescription>
                Saisissez les informations de votre carte. La vérification est manuelle côté administrateur.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={onSubmitCard}>
                {/* Card number with type detection */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="card-number">Numéro de carte</Label>
                  <div className="relative">
                    <Input
                      id="card-number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="pr-24 font-mono"
                      maxLength={19}
                      required
                    />
                    {detectedType !== 'UNKNOWN' && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {detectedType === 'VISA' && 'VISA'}
                          {detectedType === 'MASTERCARD' && 'MASTERCARD'}
                          {detectedType === 'AMEX' && 'AMEX'}
                        </Badge>
                      </span>
                    )}
                  </div>
                </div>

                {/* Holder name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="card-name">Titulaire de la carte</Label>
                  <Input
                    id="card-name"
                    autoComplete="cc-name"
                    placeholder="AWA AGBODE"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    required
                  />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="card-mm">Mois (MM)</Label>
                    <Input
                      id="card-mm"
                      inputMode="numeric"
                      autoComplete="cc-exp-month"
                      placeholder="12"
                      value={cardExpiryMonth}
                      onChange={(e) => setCardExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="card-yy">Année (AA)</Label>
                    <Input
                      id="card-yy"
                      inputMode="numeric"
                      autoComplete="cc-exp-year"
                      placeholder="27"
                      value={cardExpiryYear}
                      onChange={(e) => setCardExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="card-cvv">CVV</Label>
                    <Input
                      id="card-cvv"
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                {/* Security note */}
                <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>
                    EmailOqui ne stocke jamais le numéro complet ni le CVV. Seuls les 4 derniers chiffres,
                    le type, le titulaire et l'expiration sont conservés pour vérification admin.
                  </span>
                </div>

                <Button type="submit" disabled={submittingCard} className="h-11">
                  {submittingCard ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Soumission…
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Payer
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Active payment → show status */}
        {payment && (
          <div className="flex flex-col gap-4">
            {/* Status card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {(() => {
                    const StatusIcon = STATUS_LABELS[payment.status]?.icon ?? Clock
                    return <StatusIcon className="size-5" />
                  })()}
                  Statut du paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={STATUS_LABELS[payment.status]?.color}>
                    {STATUS_LABELS[payment.status]?.label ?? payment.status}
                  </Badge>
                  {polling && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Mise à jour…
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{payment.stepLabel}</p>

                {/* Payment details */}
                <dl className="grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <dt className="text-xs uppercase text-muted-foreground">Montant</dt>
                  <dd className="font-medium text-right">{fmtMoney(payment.amount, payment.currency)}</dd>
                  <dt className="text-xs uppercase text-muted-foreground">Carte</dt>
                  <dd className="font-mono text-right">{payment.cardType} •••• {payment.cardLast4}</dd>
                  <dt className="text-xs uppercase text-muted-foreground">Titulaire</dt>
                  <dd className="text-right">{payment.cardHolderName}</dd>
                  <dt className="text-xs uppercase text-muted-foreground">Expiration</dt>
                  <dd className="font-mono text-right">{payment.cardExpiryMonth}/{payment.cardExpiryYear}</dd>
                  <dt className="text-xs uppercase text-muted-foreground">Référence</dt>
                  <dd className="font-mono text-xs text-right">{payment.transactionReference}</dd>
                </dl>

                {/* Admin note (if refused) */}
                {payment.status === 'REFUSE' && payment.adminNote && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <span className="font-medium">Raison du refus: </span>{payment.adminNote}
                  </div>
                )}

                {/* Timeline */}
                <ol className="flex flex-col gap-2 text-xs">
                  <TimelineStep
                    done={!!payment.cardVerifiedAt}
                    label="Carte soumise"
                    date={payment.createdAt}
                  />
                  <TimelineStep
                    done={!!payment.cardVerifiedAt}
                    label="Carte vérifiée par l'admin"
                    date={payment.cardVerifiedAt}
                  />
                  <TimelineStep
                    done={payment.status === 'EN_VERIFICATION' || payment.status === 'CONFIRME'}
                    label="Code de validation saisi"
                    date={payment.status === 'EN_VERIFICATION' || payment.status === 'CONFIRME' ? payment.cardVerifiedAt : null}
                  />
                  <TimelineStep
                    done={payment.status === 'CONFIRME'}
                    label="Code vérifié — abonnement activé"
                    date={payment.confirmedAt}
                  />
                </ol>
              </CardContent>
            </Card>

            {/* Code entry (when card verified) */}
            {(payment.status === 'CARTE_VERIFIEE' || payment.status === 'EN_VERIFICATION') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="size-5" />
                    Code de validation
                  </CardTitle>
                  <CardDescription>
                    Saisissez le code (3 à 8 chiffres) envoyé par votre banque.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payment.status === 'CARTE_VERIFIEE' ? (
                    <form className="flex flex-col gap-4" onSubmit={onSubmitCode}>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={8}
                          value={code}
                          onChange={(v) => setCode(v)}
                        >
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
                      <p className="text-center text-xs text-muted-foreground">
                        3 à 8 chiffres. L'admin vérifiera le code saisi avant activation.
                      </p>
                      <Button type="submit" disabled={submittingCode || code.length < 3} className="h-11">
                        {submittingCode ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Validation…
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-4" />
                            Valider
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3 rounded-md border border-foreground/30 bg-foreground/5 p-4 text-sm">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Code soumis. En attente de vérification par l'administrateur.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Refused → retry */}
            {payment.status === 'REFUSE' && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <XCircle className="size-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Votre paiement a été refusé. Vous pouvez réessayer avec une autre carte.
                  </p>
                  <Button onClick={() => { setPayment(null); setCardNumber(''); setCardHolderName(''); setCardCvv(''); setCardExpiryMonth(''); setCardExpiryYear('') }}>
                    Réessayer
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function TimelineStep({ done, label, date }: { done: boolean; label: string; date: string | null }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-3.5 text-foreground" />
      ) : (
        <span className="size-3.5 rounded-full border border-border" />
      )}
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>
        {label}
        {done && date && (
          <span className="ml-2 text-xs text-muted-foreground">
            {new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </span>
    </li>
  )
}

export default PaymentView
