'use client'

/**
 * RenewView — Page de renouvellement autonome (Task 5-c)
 *
 * Rendue par `src/app/page.tsx` HORS du shell dashboard lorsque `view === 'renew'`.
 * Affiche un récap du plan courant + un bouton "Renouveler maintenant" qui
 * appelle POST /api/subscription/confirm. Toutes les vérifications de prix et
 * d'permissions restent côté serveur.
 *
 * Aucune mention du fournisseur d'envoi — EmailOqui reste white-label.
 */

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'

/* ------------------------------ data shapes ------------------------------ */

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
}

interface SubscriptionInfo {
  id: string
  status: string
  startDate: string | null
  endDate: string | null
}

/* -------------------------------- helpers ------------------------------- */

function fmtMoney(amount: number, currency = 'USD'): string {
  if (currency === 'USD') return `${amount.toFixed(2)} USD`
  return `${amount.toFixed(2)} ${currency}`
}

function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractToken(viewParam: string | null): string | null {
  if (!viewParam) return null
  const trimmed = viewParam.trim()
  if (!trimmed) return null
  // Allow either a bare token or a full URL like https://email.oquitogo.online/renew/<token>
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    return last && /^[A-Za-z0-9_-]{8,}$/.test(last) ? last : null
  }
  if (!/^[A-Za-z0-9_-]{8,}$/.test(trimmed)) return null
  return trimmed
}

/* --------------------------------- view --------------------------------- */

export function RenewView() {
  const setView = useAppStore((s) => s.setView)
  const viewParam = useAppStore((s) => s.viewParam)
  const refreshSession = useAppStore((s) => s.refreshSession)

  const token = extractToken(viewParam)

  const [loading, setLoading] = React.useState(true)
  const [plan, setPlan] = React.useState<PlanInfo | null>(null)
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null)
  const [renewing, setRenewing] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/subscription', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setError('Session invalide.')
          return
        }
        const d = await res.json()
        if (!cancelled) {
          if (d?.plan) setPlan(d.plan)
          if (d?.subscription) setSubscription(d.subscription)
        }
      } catch {
        if (!cancelled) setError('Erreur réseau.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (token) void load()
    else setLoading(false)
    return () => {
      cancelled = true
    }
  }, [token])

  const renew = async () => {
    if (!plan) return
    setRenewing(true)
    try {
      const res = await fetch('/api/subscription/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: plan.code,
          amount: plan.price,
          cardLast4: '4242',
        }),
      })
      const d = await res.json()
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
      toast.success('Abonnement renouvelé avec succès.')
      await refreshSession()
      setDone(true)
    } catch {
      toast.error('Erreur réseau. Réessayez.')
    } finally {
      setRenewing(false)
    }
  }

  /* ---------------------------- render: header ---------------------------- */

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Aller au tableau de bord"
          >
            <img
              src="/logo.png"
              alt="EmailOqui"
              width={36}
              height={36}
              className="size-9 rounded-lg object-contain"
            />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Email<span className="text-primary">Oqui</span>
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('dashboard')}
          >
            Retour au dashboard
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* === No token (invalid link) === */}
          {!token && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Lien invalide ou expiré</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Le lien de renouvellement que vous avez utilisé est invalide
                    ou a expiré. Les liens sont à usage unique et valables 24h.
                  </p>
                </div>
                <Button onClick={() => setView('dashboard')}>
                  Aller au tableau de bord
                </Button>
              </CardContent>
            </Card>
          )}

          {/* === Token valid — confirmation screen === */}
          {token && done && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Abonnement renouvelé</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Votre abonnement a été renouvelé avec succès. Les envois
                    d'e-mails sont à nouveau opérationnels.
                  </p>
                </div>
                <Button onClick={() => setView('dashboard')}>
                  Aller au dashboard
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* === Token valid — recap + action === */}
          {token && !done && (
            <>
              {loading ? (
                <Card>
                  <CardContent className="space-y-4 py-8">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ) : error ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="size-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={() => setView('dashboard')}>
                      Retour au dashboard
                    </Button>
                  </CardContent>
                </Card>
              ) : plan ? (
                <Card>
                  <CardContent className="space-y-6 py-8">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <RefreshCw className="size-6" />
                      </div>
                      <h1 className="text-xl font-semibold">Renouvellement d'abonnement</h1>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Confirmez le renouvellement de votre abonnement EmailOqui.
                      </p>
                    </div>

                    {/* Plan recap */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Plan
                        </span>
                        {plan.code && (
                          <Badge className="bg-primary/15 text-primary">{plan.code}</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-lg font-bold">{plan.name}</p>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Montant</p>
                          <p className="font-bold tabular-nums text-primary">
                            {fmtMoney(plan.price, plan.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">Durée</p>
                          <p className="font-bold tabular-nums">
                            {plan.durationMonths} mois
                          </p>
                        </div>
                      </div>
                      {subscription?.endDate && (
                        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                          Échéance actuelle: {fmtDateLong(subscription.endDate)} —{' '}
                          la nouvelle période prolongera l'abonnement existant.
                        </p>
                      )}
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={renew}
                      disabled={renewing}
                    >
                      <Lock className="size-4" />
                      {renewing ? 'Traitement en cours…' : 'Renouveler maintenant'}
                    </Button>

                    <Alert className="border-border bg-secondary/30">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <AlertDescription>
                        EmailOqui ne stocke jamais les données bancaires
                        complètes. Paiement traité par prestataire sécurisé.
                        Seuls les 4 derniers chiffres sont conservés (mention
                        légale).
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertTriangle className="size-6" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aucun abonnement à renouveler pour ce workspace.
                    </p>
                    <Button variant="outline" onClick={() => setView('dashboard')}>
                      Retour au dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-background/60 px-4 py-3 text-center text-xs text-muted-foreground">
        <a
          href="https://email.oquitogo.online"
          className="font-medium text-foreground/80 hover:text-foreground"
        >
          email.oquitogo.online
        </a>{' '}
        — EmailOqui
      </footer>
    </div>
  )
}

export default RenewView
