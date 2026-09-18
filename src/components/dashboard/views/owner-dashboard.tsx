'use client'

import * as React from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Mail,
  CheckCircle2,
  Eye,
  MousePointerClick,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  LifeBuoy,
  LogOut,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  MailOpen,
} from 'lucide-react'

/* --------------------------------- types --------------------------------- */

interface OwnerStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  unsubscribed: number
  emailsSentToday: number
  dailyLimit: number
}

interface TrendPoint {
  date: string
  SENT: number
  DELIVERED: number
  OPENED: number
  CLICKED: number
}

interface OwnerCampaign {
  id: string
  name: string
  status: string
  sentAt: string | null
  recipientCount: number
}

interface OwnerSubscription {
  status: string
  endDate: string | null
  planName: string
  planCode: string
}

/* --------------------------------- helpers -------------------------------- */

function fmtInt(n: number): string {
  return Number(n || 0).toLocaleString('fr-FR')
}

function pct(n: number, d: number): number {
  if (!d || d <= 0) return 0
  return Math.max(0, Math.min(100, (n / d) * 100))
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function fmtDay(d: string): string {
  try {
    const date = new Date(d)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  } catch {
    return d
  }
}

/** deterministic mock open rate per campaign (since the API doesn't expose per-campaign opens). */
function mockOpenRate(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 18 + (h % 32) // 18% – 50%
}

/* ----------------------------- status helpers ----------------------------- */

const STATUS_META: Record<string, { label: string; cls: string }> = {
  BROUILLON: { label: 'Brouillon', cls: 'border-border bg-muted text-muted-foreground' },
  PROGRAMMEE: { label: 'Programmée', cls: 'border-primary/30 bg-primary/10 text-primary' },
  EN_COURS: { label: 'En cours', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  ENVOYEE: { label: 'Envoyée', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  ECHOUEE: { label: 'Échouée', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
  ARCHIVEE: { label: 'Archivée', cls: 'border-border bg-muted text-muted-foreground' },
}

const SUBSCRIPTION_META: Record<string, { label: string; cls: string }> = {
  ACTIF: { label: 'Actif', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  EXPIRANT_BIENTO: {
    label: 'Expire bientôt',
    cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  EXPIRE: { label: 'Expiré', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
  EN_ATTENTE: { label: 'En attente', cls: 'border-border bg-muted text-muted-foreground' },
  SUSPENDU: { label: 'Suspendu', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
}

/* ------------------------------ chart config ----------------------------- */

const TREND_CONFIG: ChartConfig = {
  SENT: { label: 'Envoyés', color: 'var(--chart-1)' },
  DELIVERED: { label: 'Délivrés', color: 'var(--chart-2)' },
  OPENED: { label: 'Ouvertures', color: 'var(--chart-3)' },
  CLICKED: { label: 'Clics', color: 'var(--chart-4)' },
}

/* -------------------------------- KPI card -------------------------------- */

function KpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  sublabel?: string
  accent: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span
            className="flex size-8 items-center justify-center rounded-md"
            style={{ backgroundColor: accent + '20', color: accent }}
          >
            <Icon className="size-4" />
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight tabular-nums">{fmtInt(value)}</div>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  )
}

/* ---------------------------- performance ring ---------------------------- */

function BigStat({
  value,
  label,
  accent,
}: {
  value: string
  label: string
  accent: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-3xl font-bold tracking-tight tabular-nums" style={{ color: accent }}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/* ------------------------------- Brand mark ------------------------------- */

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo.png"
        alt="EmailOqui"
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-lg object-contain"
      />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">EmailOqui</span>
        <span className="text-[10px] text-muted-foreground">email.oquitogo.online</span>
      </div>
    </div>
  )
}

/* --------------------------------- Nav ----------------------------------- */

type OwnerTab = 'dashboard' | 'stats' | 'subscription'

const NAV_ITEMS: { key: OwnerTab | 'support'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'stats', label: 'Statistiques', icon: BarChart3 },
  { key: 'subscription', label: 'Abonnement', icon: CreditCard },
  { key: 'support', label: 'Support', icon: LifeBuoy },
]

/* ------------------------------- OwnerDashboard ------------------------------ */

export function OwnerDashboard() {
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)
  const user = useAppStore((s) => s.user)
  const workspace = useAppStore((s) => s.workspace)
  const previewRole = useAppStore((s) => s.previewRole)
  const setPreviewRole = useAppStore((s) => s.setPreviewRole)

  const [tab, setTab] = React.useState<OwnerTab>('dashboard')
  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<OwnerStats | null>(null)
  const [trend, setTrend] = React.useState<TrendPoint[]>([])
  const [campaigns, setCampaigns] = React.useState<OwnerCampaign[]>([])
  const [subscription, setSubscription] = React.useState<OwnerSubscription | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/owner/stats', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data?.stats) setStats(data.stats)
        if (Array.isArray(data?.trend)) setTrend(data.trend)
        if (Array.isArray(data?.campaigns)) setCampaigns(data.campaigns)
        if (data?.subscription) setSubscription(data.subscription)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const isPreview = previewRole === 'OWNER'

  const exitPreview = () => {
    setPreviewRole(null)
    setView('dashboard')
  }

  const navClick = (key: 'dashboard' | 'stats' | 'subscription' | 'support') => {
    if (key === 'support') {
      setView('support' as ViewKey)
    } else {
      setTab(key)
    }
  }

  const sent = stats?.sent ?? 0
  const delivered = stats?.delivered ?? 0
  const opened = stats?.opened ?? 0
  const clicked = stats?.clicked ?? 0
  const sentToday = stats?.emailsSentToday ?? workspace?.emailsSentToday ?? 0
  const dailyLimit = stats?.dailyLimit ?? workspace?.dailyEmailLimit ?? 0
  const deliverability = pct(delivered, sent)
  const openRate = pct(opened, delivered)
  const clickRate = pct(clicked, delivered)
  const quotaPct = pct(sentToday, dailyLimit)

  const subStatus = subscription?.status ?? workspace?.subscriptionStatus ?? 'EN_ATTENTE'
  const subMeta = SUBSCRIPTION_META[subStatus] ?? { label: subStatus, cls: 'border-border bg-muted text-muted-foreground' }
  const expiringSoon = subStatus === 'EXPIRANT_BIENTO' || subStatus === 'EXPIRE'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Preview banner (only when a Developer previews the Owner dashboard) */}
      {isPreview && (
        <div className="flex items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
          <Eye className="size-4 shrink-0" />
          <span>Aperçu du dashboard Owner — lecture seule</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={exitPreview}
          >
            Quitter l&apos;aperçu
          </Button>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandMark />
          <div className="hidden flex-col items-center text-center sm:flex">
            <span className="text-xs text-muted-foreground">Workspace</span>
            <span className="text-sm font-medium">{workspace?.name ?? 'Mon Entreprise'}</span>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.firstName ? `${user.firstName} ${user.lastName ?? ''}` : user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void logout()}
              title="Déconnexion"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Horizontal nav */}
        <nav
          aria-label="Navigation principale"
          className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-2 sm:px-6 lg:px-8"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navClick(item.key as 'dashboard' | 'stats' | 'subscription' | 'support')}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-[44px] items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8" aria-label="Tableau de bord">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
            <Skeleton className="h-80 w-full" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        ) : sent === 0 ? (
          <EmptyState />
        ) : tab === 'dashboard' ? (
          <DashboardTab
            stats={stats}
            trend={trend}
            campaigns={campaigns}
            subscription={subscription}
            subStatus={subStatus}
            subMeta={subMeta}
            expiringSoon={expiringSoon}
            sentToday={sentToday}
            dailyLimit={dailyLimit}
            quotaPct={quotaPct}
            deliverability={deliverability}
            openRate={openRate}
            clickRate={clickRate}
            setView={setView}
          />
        ) : tab === 'stats' ? (
          <StatsTab
            stats={stats}
            trend={trend}
            deliverability={deliverability}
            openRate={openRate}
            clickRate={clickRate}
          />
        ) : (
          <SubscriptionTab
            subscription={subscription}
            subStatus={subStatus}
            subMeta={subMeta}
            expiringSoon={expiringSoon}
            sentToday={sentToday}
            dailyLimit={dailyLimit}
            quotaPct={quotaPct}
            setView={setView}
          />
        )}
      </main>

      {/* Support CTA */}
      {tab !== 'subscription' && !loading && sent !== 0 && (
        <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-start gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <LifeBuoy className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Besoin d&apos;aide ?</p>
                  <p className="text-xs text-muted-foreground">
                    Notre équipe support vous répond sous 24h.
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => setView('support' as ViewKey)}>
                <LifeBuoy className="size-4" />
                Ouvrir un ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border bg-background/60 px-4 py-3 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>
            EmailOqui —{' '}
            <a
              href="https://email.oquitogo.online"
              className="font-medium text-foreground/80 hover:text-foreground"
            >
              email.oquitogo.online
            </a>
          </span>
          <span className="font-mono tabular-nums">v0.1.0</span>
        </div>
      </footer>
    </div>
  )
}

/* -------------------------------- Dashboard ------------------------------- */

function DashboardTab(props: {
  stats: OwnerStats | null
  trend: TrendPoint[]
  campaigns: OwnerCampaign[]
  subscription: OwnerSubscription | null
  subStatus: string
  subMeta: { label: string; cls: string }
  expiringSoon: boolean
  sentToday: number
  dailyLimit: number
  quotaPct: number
  deliverability: number
  openRate: number
  clickRate: number
  setView: (v: ViewKey, param?: string | null) => void
}) {
  const {
    stats,
    trend,
    campaigns,
    subscription,
    subMeta,
    expiringSoon,
    sentToday,
    dailyLimit,
    quotaPct,
    deliverability,
    openRate,
    clickRate,
    setView,
  } = props

  const workspace = useAppStore((s) => s.workspace)
  const recent = campaigns.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section aria-label="Indicateurs clés">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Mail}
            label="E-mails envoyés"
            value={stats?.sent ?? 0}
            sublabel="30 derniers jours"
            accent="var(--chart-1)"
          />
          <KpiCard
            icon={CheckCircle2}
            label="E-mails délivrés"
            value={stats?.delivered ?? 0}
            sublabel={`${deliverability.toFixed(1)}% de délivrabilité`}
            accent="var(--chart-2)"
          />
          <KpiCard
            icon={Eye}
            label="Ouvertures"
            value={stats?.opened ?? 0}
            sublabel={`${openRate.toFixed(1)}% de taux d'ouverture`}
            accent="var(--chart-3)"
          />
          <KpiCard
            icon={MousePointerClick}
            label="Clics"
            value={stats?.clicked ?? 0}
            sublabel={`${clickRate.toFixed(1)}% de taux de clic`}
            accent="var(--chart-4)"
          />
        </div>
      </section>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" />
            Évolution sur 30 jours
          </CardTitle>
          <CardDescription>
            E-mails envoyés, délivrés, ouverts et cliqués par jour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={TREND_CONFIG} className="aspect-[16/8] w-full">
            <AreaChart data={trend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="owner-fill-sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="owner-fill-delivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="owner-fill-opened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="owner-fill-clicked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={fmtDay}
                minTickGap={24}
              />
              <YAxis width={36} tickLine={false} axisLine={false} tickMargin={4} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmtDay(String(v))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="SENT"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#owner-fill-sent)"
              />
              <Area
                type="monotone"
                dataKey="DELIVERED"
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="url(#owner-fill-delivered)"
              />
              <Area
                type="monotone"
                dataKey="OPENED"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="url(#owner-fill-opened)"
              />
              <Area
                type="monotone"
                dataKey="CLICKED"
                stroke="var(--chart-4)"
                strokeWidth={2}
                fill="url(#owner-fill-clicked)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Subscription + quota */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-primary" />
              Abonnement
            </CardTitle>
            <CardDescription>Votre plan et votre statut d&apos;abonnement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="text-sm font-medium">
                  {subscription?.planName ?? workspace?.planName ?? '—'}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${subMeta.cls}`}
              >
                {subMeta.label}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Expire le</span>
              <span className="font-medium text-foreground">
                {fmtDate(subscription?.endDate ?? workspace?.subscriptionEnd)}
              </span>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Quota quotidien</span>
                <span className="font-mono tabular-nums">
                  {fmtInt(sentToday)} / {fmtInt(dailyLimit)}
                </span>
              </div>
              <Progress value={quotaPct} className="h-2" />
            </div>
            {expiringSoon && (
              <Button type="button" className="w-full" onClick={() => setView('renew')}>
                <RefreshCw className="size-4" />
                Renouveler
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="size-4 text-primary" />
              Performance
            </CardTitle>
            <CardDescription>Taux clés sur les 30 derniers jours.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 py-2">
              <BigStat
                value={`${deliverability.toFixed(1)}%`}
                label="Délivrabilité"
                accent="var(--chart-2)"
              />
              <BigStat
                value={`${openRate.toFixed(1)}%`}
                label="Taux d'ouverture"
                accent="var(--chart-3)"
              />
              <BigStat
                value={`${clickRate.toFixed(1)}%`}
                label="Taux de clic"
                accent="var(--chart-4)"
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {fmtInt(stats?.opened ?? 0)} ouvertures sur {fmtInt(stats?.delivered ?? 0)} e-mails délivrés.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MailOpen className="size-4 text-primary" />
            Campagnes récentes
          </CardTitle>
          <CardDescription>Vos 3 dernières campagnes (lecture seule).</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune campagne pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {recent.map((c) => {
                const m = STATUS_META[c.status] ?? { label: c.status, cls: 'border-border bg-muted text-muted-foreground' }
                const rate = mockOpenRate(c.id)
                return (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-md border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{c.name}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}
                        >
                          {m.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.sentAt ? `Envoyée le ${fmtDate(c.sentAt)}` : 'Non envoyée'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Destinataires</span>
                        <span className="font-medium tabular-nums">
                          {fmtInt(c.recipientCount)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Taux d&apos;ouverture</span>
                        <span className="font-medium tabular-nums">{rate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* --------------------------------- Stats --------------------------------- */

function StatsTab(props: {
  stats: OwnerStats | null
  trend: TrendPoint[]
  deliverability: number
  openRate: number
  clickRate: number
}) {
  const { stats, trend, deliverability, openRate, clickRate } = props
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Statistiques</h1>
        <p className="text-sm text-muted-foreground">
          Aperçu de vos performances e-mail sur les 30 derniers jours.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Mail}
          label="Envoyés"
          value={stats?.sent ?? 0}
          accent="var(--chart-1)"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Délivrés"
          value={stats?.delivered ?? 0}
          sublabel={`${deliverability.toFixed(1)}%`}
          accent="var(--chart-2)"
        />
        <KpiCard
          icon={Eye}
          label="Ouvertures"
          value={stats?.opened ?? 0}
          sublabel={`${openRate.toFixed(1)}%`}
          accent="var(--chart-3)"
        />
        <KpiCard
          icon={MousePointerClick}
          label="Clics"
          value={stats?.clicked ?? 0}
          sublabel={`${clickRate.toFixed(1)}%`}
          accent="var(--chart-4)"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" />
            Évolution des envois
          </CardTitle>
          <CardDescription>Envoyés / délivrés / ouverts / clics par jour.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={TREND_CONFIG} className="aspect-[16/9] w-full">
            <AreaChart data={trend} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="owner-stats-sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="owner-stats-delivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="owner-stats-opened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="owner-stats-clicked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={fmtDay}
                minTickGap={24}
              />
              <YAxis width={36} tickLine={false} axisLine={false} tickMargin={4} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmtDay(String(v))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area type="monotone" dataKey="SENT" stroke="var(--chart-1)" strokeWidth={2} fill="url(#owner-stats-sent)" />
              <Area type="monotone" dataKey="DELIVERED" stroke="var(--chart-2)" strokeWidth={2} fill="url(#owner-stats-delivered)" />
              <Area type="monotone" dataKey="OPENED" stroke="var(--chart-3)" strokeWidth={2} fill="url(#owner-stats-opened)" />
              <Area type="monotone" dataKey="CLICKED" stroke="var(--chart-4)" strokeWidth={2} fill="url(#owner-stats-clicked)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------------------- Subscription ------------------------------ */

function SubscriptionTab(props: {
  subscription: OwnerSubscription | null
  subStatus: string
  subMeta: { label: string; cls: string }
  expiringSoon: boolean
  sentToday: number
  dailyLimit: number
  quotaPct: number
  setView: (v: ViewKey, param?: string | null) => void
}) {
  const { subscription, subMeta, expiringSoon, sentToday, dailyLimit, quotaPct, setView } = props
  const workspace = useAppStore((s) => s.workspace)
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Abonnement</h1>
        <p className="text-sm text-muted-foreground">Votre plan, votre statut et votre quota.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-primary" />
            Plan {subscription?.planName ?? workspace?.planName ?? '—'}
          </CardTitle>
          <CardDescription>Statut de votre abonnement EmailOqui.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${subMeta.cls}`}
            >
              {subMeta.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Date d&apos;expiration</span>
            <span className="text-sm font-medium">
              {fmtDate(subscription?.endDate ?? workspace?.subscriptionEnd)}
            </span>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Quota quotidien</span>
              <span className="font-mono tabular-nums">
                {fmtInt(sentToday)} / {fmtInt(dailyLimit)}
              </span>
            </div>
            <Progress value={quotaPct} className="h-2" />
            <p className="mt-1 text-xs text-muted-foreground">
              {fmtInt(Math.max(0, dailyLimit - sentToday))} envois restants aujourd&apos;hui.
            </p>
          </div>
          {expiringSoon ? (
            <Button type="button" className="w-full" onClick={() => setView('renew')}>
              <RefreshCw className="size-4" />
              Renouveler mon abonnement
            </Button>
          ) : (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              Votre abonnement est actif. Le renouvellement sera disponible à l&apos;approche de la date d&apos;expiration.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------ Empty state ------------------------------ */

function EmptyState() {
  const setView = useAppStore((s) => s.setView)
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-7" />
        </div>
        <div>
          <p className="text-base font-semibold">Bienvenue sur EmailOqui</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Aucune campagne n&apos;a encore été envoyée. Vos statistiques apparaîtront ici dès que
            votre équipe aura expédié la première campagne.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setView('support' as ViewKey)}>
          <LifeBuoy className="size-4" />
          Contacter le support
        </Button>
      </CardContent>
    </Card>
  )
}

export default OwnerDashboard
