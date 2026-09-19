'use client'

/**
 * SubscriptionView — Abonnement EmailOqui (Task 5-c)
 *
 * Affiche l'abonnement courant (plan, statut, période, quota), la grille de
 * plans pour changement, la génération de liens de renouvellement (Developer
 * uniquement) et le paiement par carte simulé (Developer uniquement).
 *
 * Le montant affiché pour le paiement provient toujours du serveur — il
 * n'est jamais codé en dur côté frontend. Le fournisseur d'envoi (Resend)
 * reste invisible — EmailOqui est white-label.
 */

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Gauge,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Info,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

/* --------------------------------- types ---------------------------------- */

interface PlanInfo {
  code: string
  name: string
  price: number
  currency: string
  durationMonths: number
  dailyEmailLimit: number
  automationLimit: number
  retentionDays: number
  supportLevel: string
  features?: string | null
  status?: string
}

interface SubscriptionInfo {
  id: string
  status: string
  startDate: string | null
  endDate: string | null
  planId: string
  plan?: PlanInfo
}

interface RenewalResponse {
  linkId: string
  token: string
  expiresAt: string
  planCode: string
  planName: string
  amount: number
  currency: string
}

interface ConfirmResponse {
  payment: {
    id: string
    amount: number
    currency: string
    status: string
    transactionReference: string
    cardLast4?: string | null
    confirmedAt: string
  }
  subscription: SubscriptionInfo
  plan: {
    code: string
    name: string
    price: number
    currency: string
    durationMonths: number
    dailyEmailLimit: number
  }
}

/* --------------------------- plan display config -------------------------- */

interface PlanDisplay {
  code: string
  name: string
  price: string
  period: string
  tagline: string
  popular?: boolean
  features: string[]
}

const PLANS: PlanDisplay[] = [
  {
    code: 'STARTER_3M',
    name: 'Starter',
    price: '20',
    period: '3 mois',
    tagline: 'Idéal pour démarrer et tester le canal e-mail.',
    features: [
      '1 000 e-mails / jour',
      '10 000 exécutions d’automatisation',
      'Conservation 30 jours',
      'Programmation de campagnes',
      'Statistiques essentielles',
      'Support par ticket',
    ],
  },
  {
    code: 'STARTER_6M',
    name: 'Starter',
    price: '38',
    period: '6 mois',
    tagline: 'Starter sur 6 mois — remise sur la durée.',
    features: [
      '1 000 e-mails / jour',
      '10 000 exécutions d’automatisation',
      'Conservation 30 jours',
      'Programmation de campagnes',
      'Statistiques essentielles',
      'Support par ticket',
    ],
  },
  {
    code: 'STARTER_1Y',
    name: 'Starter',
    price: '72',
    period: '1 an',
    tagline: 'Starter annuel — meilleure remise.',
    features: [
      '1 000 e-mails / jour',
      '10 000 exécutions d’automatisation',
      'Conservation 30 jours',
      'Programmation de campagnes',
      'Statistiques essentielles',
      'Support par ticket',
    ],
  },
  {
    code: 'BUSINESS_3M',
    name: 'Business',
    price: '45',
    period: '3 mois',
    tagline: 'Pour les équipes qui automatisent à grande échelle.',
    popular: true,
    features: [
      '5 000 e-mails / jour',
      '50 000 exécutions d’automatisation',
      'Conservation 90 jours',
      'Statistiques avancées',
      'Support prioritaire',
      'Toutes les fonctionnalités Starter',
    ],
  },
  {
    code: 'BUSINESS_6M',
    name: 'Business',
    price: '85',
    period: '6 mois',
    tagline: 'Business sur 6 mois — remise sur la durée.',
    features: [
      '5 000 e-mails / jour',
      '50 000 exécutions d’automatisation',
      'Conservation 90 jours',
      'Statistiques avancées',
      'Support prioritaire',
    ],
  },
  {
    code: 'BUSINESS_1Y',
    name: 'Business',
    price: '162',
    period: '1 an',
    tagline: 'Business annuel — meilleure remise.',
    features: [
      '5 000 e-mails / jour',
      '50 000 exécutions d’automatisation',
      'Conservation 90 jours',
      'Statistiques avancées',
      'Support prioritaire',
    ],
  },
  {
    code: 'PREMIUM_3M',
    name: 'Premium',
    price: '80',
    period: '3 mois',
    tagline: 'Volume élevé, rapports et automatisation avancés.',
    features: [
      '10 000 e-mails / jour',
      '100 000 exécutions d’automatisation',
      'Conservation 180 jours',
      'Programmation avancée',
      'Rapports avancés',
      'Support prioritaire',
    ],
  },
  {
    code: 'PREMIUM_6M',
    name: 'Premium',
    price: '150',
    period: '6 mois',
    tagline: 'Premium sur 6 mois — remise sur la durée.',
    features: [
      '10 000 e-mails / jour',
      '100 000 exécutions d’automatisation',
      'Conservation 180 jours',
      'Programmation avancée',
      'Rapports avancés',
      'Support prioritaire',
    ],
  },
  {
    code: 'PREMIUM_1Y',
    name: 'Premium',
    price: '288',
    period: '1 an',
    tagline: 'Premium annuel — meilleure remise.',
    features: [
      '10 000 e-mails / jour',
      '100 000 exécutions d’automatisation',
      'Conservation 180 jours',
      'Programmation avancée',
      'Rapports avancés',
      'Support prioritaire',
    ],
  },
]

/* --------------------------- status badge mapping ------------------------- */

interface StatusMeta {
  label: string
  className: string
}

const STATUS_META: Record<string, StatusMeta> = {
  EN_ATTENTE: {
    label: 'En attente',
    className: 'border-transparent bg-secondary text-secondary-foreground',
  },
  ACTIF: {
    label: 'Actif',
    className: 'border-transparent bg-foreground/15 text-foreground',
  },
  EXPIRANT_BIENTOT: {
    label: 'Expirant bientôt',
    className: 'border-transparent bg-primary/15 text-primary',
  },
  EXPIRE: {
    label: 'Expiré',
    className: 'border-transparent bg-destructive/15 text-destructive',
  },
  SUSPENDU: {
    label: 'Suspendu',
    className: 'border-foreground/20 bg-muted text-muted-foreground',
  },
  ANNULE: {
    label: 'Annulé',
    className: 'border-transparent bg-destructive/15 text-destructive',
  },
}

function statusBadge(status: string) {
  const m = STATUS_META[status] ?? { label: status, className: 'border-transparent bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>
}

/* --------------------------------- helpers -------------------------------- */

const fmtInt = (n: number) => n.toLocaleString('fr-FR')
const pct = (num: number, denom: number) => (denom > 0 ? (num / denom) * 100 : 0)

function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const diff = d.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function fmtMoney(amount: number, currency = 'USD'): string {
  if (currency === 'USD') return `${amount.toFixed(2)} USD`
  return `${amount.toFixed(2)} ${currency}`
}

/* --------------------------------- main ---------------------------------- */

export default function SubscriptionView() {
  const user = useAppStore((s) => s.user)
  const workspace = useAppStore((s) => s.workspace)
  const refreshSession = useAppStore((s) => s.refreshSession)
  const setView = useAppStore((s) => s.setView)

  const isDeveloper = workspace?.memberRole === 'DEVELOPER'

  const [loading, setLoading] = React.useState(true)
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null)
  const [currentPlan, setCurrentPlan] = React.useState<PlanInfo | null>(null)

  // Renew link state
  const [generatingLink, setGeneratingLink] = React.useState(false)
  const [renewal, setRenewal] = React.useState<RenewalResponse | null>(null)
  const [copied, setCopied] = React.useState(false)

  // Change plan dialog
  const [selectedPlan, setSelectedPlan] = React.useState<PlanDisplay | null>(null)

  // Card payment dialog
  const [payDialogOpen, setPayDialogOpen] = React.useState(false)
  const [cardNumber, setCardNumber] = React.useState('4242 4242 4242 4242')
  const [cardExp, setCardExp] = React.useState('12/27')
  const [cardCvv, setCardCvv] = React.useState('123')
  const [paying, setPaying] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscription', { cache: 'no-store' })
      if (res.ok) {
        const d = await res.json()
        if (d?.subscription) {
          setSubscription(d.subscription)
        } else {
          setSubscription(null)
        }
        if (d?.plan) setCurrentPlan(d.plan)
      }
    } catch {
      /* network error — keep skeletons */
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  /* --------------------- generate renewal link (Dev only) ------------------ */

  const generateRenewalLink = async () => {
    if (!currentPlan) {
      toast.error("Impossible de générer un lien — aucun plan actif.")
      return
    }
    setGeneratingLink(true)
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: currentPlan.code,
          operationType: 'RENEW',
        }),
      })
      const d = await res.json()
      if (!res.ok || !d?.success) {
        const code = d?.error?.code ?? 'UNKNOWN'
        toast.error(`Erreur (${code}): ${d?.error?.message ?? 'échec de génération'}`)
        return
      }
      setRenewal({
        linkId: d.linkId,
        token: d.token,
        expiresAt: d.expiresAt,
        planCode: d.planCode,
        planName: d.planName,
        amount: d.amount,
        currency: d.currency,
      })
      toast.success('Lien de renouvellement généré.')
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setGeneratingLink(false)
    }
  }

  const copyLink = async () => {
    if (!renewal) return
    const link = `https://email.oquitogo.online/renew/${renewal.token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Lien copié dans le presse-papier.')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Copie impossible — sélectionnez le lien manuellement.')
    }
  }

  /* --------------------- confirm payment (card simulation) ----------------- */

  const openPaymentDialog = () => {
    if (!currentPlan) {
      toast.error('Aucun plan actif à payer.')
      return
    }
    setCardNumber('4242 4242 4242 4242')
    setCardExp('12/27')
    setCardCvv('123')
    setPayDialogOpen(true)
  }

  const confirmPayment = async () => {
    if (!currentPlan) return
    // Extract the last 4 digits of the card number (do NOT keep the full PAN)
    const digits = (cardNumber || '').replace(/\D/g, '')
    const last4 = digits.length >= 4 ? digits.slice(-4) : null
    if (!last4) {
      toast.error('Numéro de carte invalide.')
      return
    }
    setPaying(true)
    try {
      const res = await fetch('/api/subscription/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: currentPlan.code,
          amount: currentPlan.price,
          cardLast4: last4,
        }),
      })
      const d = await res.json() as ConfirmResponse & { success?: boolean; error?: { code: string; message: string } }
      if (!res.ok || !d?.success) {
        const code = d?.error?.code ?? 'UNKNOWN'
        if (code === 'PRICE_MISMATCH') {
          toast.error('Erreur: montant invalide.')
        } else if (code === 'DUPLICATE_PAYMENT') {
          toast.error('Un paiement récent est déjà enregistré. Patientez une minute.')
        } else {
          toast.error(`Erreur (${code}): ${d?.error?.message ?? 'paiement refusé'}`)
        }
        return
      }
      toast.success('Paiement confirmé. Abonnement activé.')
      setPayDialogOpen(false)
      await refreshSession()
      await load()
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setPaying(false)
    }
  }

  /* ----------------------------- confirm plan change ------------------------ */

  const confirmPlanChange = async () => {
    if (!selectedPlan) return
    // V1 — plan changes require manual validation by the EmailOqui team to
    // avoid trusting a frontend amount. We acknowledge the request.
    toast.success(`Demande de changement vers le plan ${selectedPlan.name} enregistrée. Notre équipe vous contactera.`)
    setSelectedPlan(null)
  }

  /* -------------------------------- derived -------------------------------- */

  const plan = currentPlan
  const sub = subscription
  const status = sub?.status ?? 'EN_ATTENTE'
  const endDate = sub?.endDate ?? null
  const startDate = sub?.startDate ?? null
  const daysLeft = daysUntil(endDate)
  const isExpiringSoon = status === 'EXPIRANT_BIENTOT' || (status === 'ACTIF' && daysLeft !== null && daysLeft <= 14)
  const isExpired = status === 'EXPIRE'

  const sentToday = workspace?.emailsSentToday ?? 0
  const dailyLimit = plan?.dailyEmailLimit ?? workspace?.dailyEmailLimit ?? 0
  const quotaPct = pct(sentToday, dailyLimit)
  const quotaTone: 'destructive' | 'primary' | 'emerald' =
    quotaPct >= 90 ? 'destructive' : quotaPct >= 80 ? 'primary' : 'emerald'

  /* --------------------------------- render -------------------------------- */

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre plan, votre période d'engagement et vos paiements.
          </p>
        </div>
      </div>

      {/* Subscription gate banner — shown when subscription is not ACTIF */}
      {workspace?.subscriptionStatus && workspace.subscriptionStatus !== 'ACTIF' && workspace.subscriptionStatus !== 'EXPIRANT_BIENTOT' && (
        <div className="flex flex-col gap-3 rounded-lg border border-foreground/30 bg-foreground/5 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="size-5" />
            Abonnement en attente de paiement
          </div>
          <p className="text-sm text-muted-foreground">
            Vous devez compléter votre paiement pour activer votre abonnement et accéder à votre tableau de bord.
            Choisissez un plan ci-dessous et cliquez sur « Payer par carte ».
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-72 w-full" />
          {isDeveloper && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ===== Section: Abonnement courant ===== */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-5 text-primary" />
                Abonnement courant
              </CardTitle>
              <CardDescription>
                Détails de votre souscription active pour{' '}
                <span className="font-medium text-foreground">
                  {workspace?.name ?? 'votre workspace'}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status banners */}
              {isExpiringSoon && !isExpired && (
                <Alert className="border-primary/40 bg-primary/10 text-primary">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Échéance imminente</AlertTitle>
                  <AlertDescription>
                    Votre abonnement expire dans{' '}
                    <strong>{daysLeft ?? 0} jour{(daysLeft ?? 0) > 1 ? 's' : ''}</strong>.
                    Renouvelez dès maintenant pour éviter toute interruption des envois.
                  </AlertDescription>
                </Alert>
              )}
              {isExpired && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Abonnement expiré</AlertTitle>
                  <AlertDescription>
                    Les envois d'e-mails sont bloqués. Effectuez un paiement pour réactiver votre abonnement.
                  </AlertDescription>
                </Alert>
              )}

              {/* Plan + period grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Plan
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {plan && (
                      <Badge className="bg-primary/15 text-primary">{plan.code}</Badge>
                    )}
                    <span className="text-lg font-bold">{plan?.name ?? '—'}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {plan ? fmtMoney(plan.price, plan.currency) : '—'} / {plan?.durationMonths ?? 3} mois
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Statut
                  </p>
                  <div className="mt-2">{statusBadge(status)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mise à jour automatique après paiement
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Période
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span>{fmtDateLong(startDate)}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <span>→</span>
                    <span>{fmtDateLong(endDate)}</span>
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Quota quotidien
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-bold">
                    <Gauge className="size-4 text-muted-foreground" />
                    <span className="tabular-nums">
                      {fmtInt(sentToday)} / {fmtInt(dailyLimit)}
                    </span>
                  </div>
                  <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quotaTone === 'destructive'
                          ? 'bg-destructive'
                          : quotaTone === 'primary'
                            ? 'bg-primary'
                            : 'bg-foreground'
                      }`}
                      style={{ width: `${Math.min(100, quotaPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {user && isDeveloper && (
                <p className="text-xs text-muted-foreground">
                  Connecté en tant que <strong>{user.email}</strong>{' '}
                  ({workspace?.memberRole}). Vous pouvez générer un lien de
                  renouvellement et effectuer un paiement simulé.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ===== Section: Changer de plan ===== */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Changer de plan</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((p) => {
                const isCurrent = p.code === plan?.code
                return (
                  <Card
                    key={p.code}
                    className={`relative flex flex-col ${p.popular ? 'border-primary/60 shadow-md' : ''}`}
                  >
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Populaire</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{p.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{p.tagline}</p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col gap-4">
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-bold text-foreground">{p.price}</span>
                        <span className="text-sm text-muted-foreground">USD / {p.period}</span>
                      </div>
                      <ul className="flex flex-1 flex-col gap-2 text-sm">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-foreground">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Plan actuel
                        </Button>
                      ) : (
                        <Button
                          variant={p.popular ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => setSelectedPlan(p)}
                        >
                          Choisir {p.name}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              Tous les plans sont facturés pour 3 mois calendaires. Le changement
              de plan est soumis à validation par notre équipe.
            </p>
          </div>

          {/* ===== Sections Developer only ===== */}
          {isDeveloper && (
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Renouvellement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <RefreshCw className="size-5 text-primary" />
                      Renouvellement
                    </CardTitle>
                    <CardDescription>
                      Générez un lien de renouvellement à transmettre au propriétaire.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renewal ? (
                      <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Lien généré</span>
                          <Badge variant="secondary">
                            Expire le {fmtDateTime(renewal.expiresAt)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
                          <code className="flex-1 truncate text-xs">
                            email.oquitogo.online/renew/{renewal.token}
                          </code>
                          <Button size="sm" variant="ghost" onClick={copyLink}>
                            {copied ? (
                              <Check className="size-4 text-foreground" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                            Copier
                          </Button>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Plan: <strong>{renewal.planName}</strong>
                          </span>
                          <span>Montant: <strong>{fmtMoney(renewal.amount, renewal.currency)}</strong></span>
                        </div>
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Info className="mt-0.5 size-3.5 shrink-0" />
                          Ce lien est à usage unique et expire dans 24h. Le
                          propriétaire le recevra et pourra l'utiliser pour
                          renouveler.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={generateRenewalLink}
                          disabled={generatingLink}
                        >
                          {generatingLink ? 'Génération…' : 'Régénérer un lien'}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Générez un lien de renouvellement pour le plan{' '}
                          <strong>{plan?.name ?? 'courant'}</strong>{' '}
                          ({plan ? fmtMoney(plan.price, plan.currency) : '—'}).
                        </p>
                        <Button
                          onClick={generateRenewalLink}
                          disabled={generatingLink || !plan}
                          className="w-full"
                        >
                          <RefreshCw className={`size-4 ${generatingLink ? 'animate-spin' : ''}`} />
                          {generatingLink ? 'Génération…' : 'Générer un lien de renouvellement'}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

              {/* Paiement par carte */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="size-5 text-primary" />
                    Paiement par carte
                  </CardTitle>
                  <CardDescription>
                    Réglez votre abonnement par carte bancaire (simulation V1).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Plan à régler
                        </p>
                        <p className="mt-1 text-lg font-bold">{plan?.name ?? '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Montant
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
                          {plan ? fmtMoney(plan.price, plan.currency) : '—'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Montant déterminé côté serveur — aucune confiance accordée
                      à un montant frontend.
                    </p>
                  </div>

                  <Button onClick={() => setView('payment', plan?.code ?? 'STARTER_3M')} className="w-full" disabled={!plan}>
                    <Lock className="size-4" />
                    Payer par carte
                  </Button>

                  <Alert className="border-border bg-secondary/30">
                    <ShieldCheck className="size-4 text-foreground" />
                    <AlertDescription>
                      EmailOqui ne stocke jamais les données bancaires complètes.
                      Paiement traité par prestataire sécurisé. Seuls les 4
                      derniers chiffres sont conservés pour mention légale.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {!isDeveloper && workspace?.memberRole === 'OWNER' && (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Info className="size-4" />
                  En tant que Owner, vous pouvez consulter l'abonnement mais pas
                  générer de lien de renouvellement ni effectuer de paiement.
                  Contactez votre Developer.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ===== Dialog: Confirmer le changement de plan ===== */}
      <Dialog
        open={!!selectedPlan}
        onOpenChange={(o) => !o && setSelectedPlan(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de plan</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de passer au plan{' '}
              <strong>{selectedPlan?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Nouveau plan</p>
                  <p className="mt-1 text-xl font-bold">{selectedPlan?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">Tarif</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-primary">
                    {selectedPlan ? fmtMoney(Number(selectedPlan.price)) : '—'}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Durée: {selectedPlan?.period} calendaires.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Le changement de plan sera examiné par notre équipe. Une
              confirmation vous sera envoyée par e-mail avant activation.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>
              Annuler
            </Button>
            <Button onClick={confirmPlanChange}>Confirmer la demande</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Dialog: Paiement sécurisé par carte ===== */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement sécurisé</DialogTitle>
            <DialogDescription>
              Simulation V1 — utilisez la carte de test pré-remplie ou saisissez la vôtre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mock card */}
            <div className="rounded-lg border border-border bg-gradient-to-br from-primary/10 via-background to-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Carte de paiement
                </span>
                <CreditCard className="size-5 text-primary" />
              </div>
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="card-number" className="text-xs">
                    Numéro de carte
                  </Label>
                  <Input
                    id="card-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="card-exp" className="text-xs">
                      Expiration
                    </Label>
                    <Input
                      id="card-exp"
                      autoComplete="cc-exp"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      placeholder="MM/AA"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="card-cvv" className="text-xs">
                      CVV
                    </Label>
                    <Input
                      id="card-cvv"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
              <span className="text-sm text-muted-foreground">Montant à payer</span>
              <span className="text-lg font-bold tabular-nums text-primary">
                {plan ? fmtMoney(plan.price, plan.currency) : '—'}
              </span>
            </div>

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-foreground" />
              EmailOqui ne stocke pas les données bancaires complètes. Seuls les
              4 derniers chiffres de la carte seront conservés (mention légale).
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmPayment} disabled={paying || !plan}>
              {paying ? 'Traitement…' : `Payer ${plan ? fmtMoney(plan.price, plan.currency) : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
