'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { type ChartConfig } from '@/components/ui/chart'
import {
  Mail,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertCircle,
  Gauge,
  ArrowUpRight,
  Plus,
  Upload,
  Globe,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

/* ----------------------------- types & helpers ---------------------------- */

interface OverviewStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  unsubscribed: number
  complaint: number
  activeCampaigns: number
  emailsSentToday: number
  dailyLimit: number
  planCode?: string | null
  planName?: string | null
  subscriptionStatus?: string | null
  subscriptionEnd?: string | null
}

interface TrendPoint {
  date: string
  SENT: number
  DELIVERED: number
  OPENED: number
  CLICKED: number
  BOUNCE: number
  FAILED: number
  UNSUBSCRIBE: number
}

interface CampaignWithStats {
  id: string
  name: string
  status: string
  subject?: string | null
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  unsubscribed: number
  createdAt?: string | null
}

const fmtInt = (n: number) => n.toLocaleString('fr-FR')
const pct = (num: number, denom: number) =>
  denom > 0 ? (num / denom) * 100 : 0

function fmtDay(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtDayMonth(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Deterministic mock delta so the same metric always shows the same %.
 *  (avoids the number flickering on every render). */
function mockDelta(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return 3 + (h % 22)
}

/* --------------------------------- config --------------------------------- */

const TREND_CONFIG: ChartConfig = {
  SENT: { label: 'Envoyés', color: 'var(--chart-1)' },
  DELIVERED: { label: 'Délivrés', color: 'var(--chart-2)' },
  OPENED: { label: 'Ouverts', color: 'var(--chart-3)' },
  CLICKED: { label: 'Clics', color: 'var(--chart-4)' },
}

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  BROUILLON: { label: 'Brouillon', variant: 'secondary' },
  PROGRAMMEE: { label: 'Programmée', variant: 'default' },
  EN_COURS: { label: 'En cours', variant: 'default' },
  ENVOYEE: { label: 'Envoyée', variant: 'outline' },
  ECHOUEE: { label: 'Échouée', variant: 'destructive' },
  ARCHIVEE: { label: 'Archivée', variant: 'secondary' },
}

function statusBadge(status: string) {
  const m = STATUS_META[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

/* --------------------------------- KPI card -------------------------------- */

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  delta?: number
  sublabel?: string
  accent?: string
}

function KpiCard({ icon: Icon, label, value, delta, sublabel, accent }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <span
            className="flex size-8 items-center justify-center rounded-md"
            style={{ backgroundColor: accent ?? 'var(--primary)' + '20', color: accent ?? 'var(--primary)' }}
          >
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight tabular-nums">
            {typeof value === 'number' ? fmtInt(value) : value}
          </span>
          {delta !== undefined && delta > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3" />
              +{delta.toFixed(1)}%
            </span>
          )}
        </div>
        {sublabel && (
          <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  )
}

/* --------------------------------- Overview -------------------------------- */

export default function OverviewView() {
  const workspace = useAppStore((s) => s.workspace)
  const user = useAppStore((s) => s.user)
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)

  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<OverviewStats | null>(null)
  const [trend, setTrend] = React.useState<TrendPoint[]>([])
  const [campaigns, setCampaigns] = React.useState<CampaignWithStats[]>([])

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const [statsRes, campsRes] = await Promise.all([
          fetch('/api/stats/overview?days=30', { cache: 'no-store' }),
          fetch('/api/campaigns', { cache: 'no-store' }),
        ])
        if (cancelled) return
        if (statsRes.ok) {
          const d = await statsRes.json()
          if (d?.stats) setStats(d.stats)
          if (Array.isArray(d?.trend)) setTrend(d.trend)
        }
        if (campsRes.ok) {
          const d = await campsRes.json()
          if (Array.isArray(d?.campaigns)) setCampaigns(d.campaigns)
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    // Keep quota fresh (in case campaigns were sent while the user is on Overview)
    const t = setInterval(() => void refreshSession(), 60_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [refreshSession])

  if (!workspace) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Derived values
  const sent = stats?.sent ?? 0
  const delivered = stats?.delivered ?? 0
  const opened = stats?.opened ?? 0
  const clicked = stats?.clicked ?? 0
  const errors = (stats?.bounced ?? 0) + (stats?.failed ?? 0)
  const sentToday = stats?.emailsSentToday ?? workspace?.emailsSentToday ?? 0
  const dailyLimit = stats?.dailyLimit ?? workspace?.dailyEmailLimit ?? 0

  const deliverability = pct(delivered, sent)
  const openRate = pct(opened, delivered)
  const clickRate = pct(clicked, delivered)
  const errorRate = pct(errors, sent)
  const quotaPct = pct(sentToday, dailyLimit)

  // Empty state: no email ever sent
  if (!loading && sent === 0) {
    return (
      <div className="p-4 sm:p-6">
        <EmptyState
          firstName={user?.firstName}
          workspaceName={workspace.name}
          planName={workspace.planName}
          onCreateCampaign={() => setView('campaign-new')}
        />
      </div>
    )
  }

  // Pie data — event type distribution
  const pieData = [
    { name: 'Envoyés', value: stats?.sent ?? 0, key: 'SENT' },
    { name: 'Délivrés', value: stats?.delivered ?? 0, key: 'DELIVERED' },
    { name: 'Ouverts', value: stats?.opened ?? 0, key: 'OPENED' },
    { name: 'Clics', value: stats?.clicked ?? 0, key: 'CLICKED' },
    { name: 'Erreurs', value: (stats?.bounced ?? 0) + (stats?.failed ?? 0), key: 'ERRORS' },
    { name: 'Désabonnements', value: stats?.unsubscribed ?? 0, key: 'UNSUB' },
  ].filter((d) => d.value > 0)

  const PIE_COLORS: Record<string, string> = {
    SENT: 'var(--chart-1)',
    DELIVERED: 'var(--chart-2)',
    OPENED: 'var(--chart-3)',
    CLICKED: 'var(--chart-4)',
    ERRORS: 'var(--destructive)',
    UNSUB: 'var(--chart-5)',
  }

  const pieConfig: ChartConfig = {
    SENT: { label: 'Envoyés', color: PIE_COLORS.SENT },
    DELIVERED: { label: 'Délivrés', color: PIE_COLORS.DELIVERED },
    OPENED: { label: 'Ouverts', color: PIE_COLORS.OPENED },
    CLICKED: { label: 'Clics', color: PIE_COLORS.CLICKED },
    ERRORS: { label: 'Erreurs', color: PIE_COLORS.ERRORS },
    UNSUB: { label: 'Désabonnements', color: PIE_COLORS.UNSUB },
  }

  // Bar chart data — top campaigns by open rate
  const topCampaigns = [...campaigns]
    .map((c) => ({
      name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
      openRate: Number(pct(c.opened, c.sent || c.delivered || 1).toFixed(1)),
      sent: c.sent,
    }))
    .filter((c) => c.sent > 0)
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 5)

  const recentCampaigns = campaigns.slice(0, 3)

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bonjour{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici l'activité de <span className="font-medium text-foreground">{workspace.name}</span>
            {workspace.planName && (
              <>
                {' '}— plan <span className="font-medium text-foreground">{workspace.planName}</span>
              </>
            )}{' '}
            sur les 30 derniers jours.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats?.activeCampaigns !== undefined && stats.activeCampaigns > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" />
              {stats.activeCampaigns} active{stats.activeCampaigns > 1 ? 's' : ''}
            </Badge>
          )}
          <Button size="sm" onClick={() => setView('campaign-new')}>
            <Plus className="size-4" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard
            icon={Mail}
            label="E-mails envoyés"
            value={sent}
            delta={mockDelta('sent')}
            sublabel="30 derniers jours"
            accent="var(--chart-1)"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Délivrés"
            value={delivered}
            delta={mockDelta('delivered')}
            sublabel={`${deliverability.toFixed(1)}% délivrabilité`}
            accent="var(--chart-2)"
          />
          <KpiCard
            icon={Eye}
            label="Ouvertures"
            value={opened}
            delta={mockDelta('opened')}
            sublabel={`${openRate.toFixed(1)}% taux d'ouverture`}
            accent="var(--chart-3)"
          />
          <KpiCard
            icon={MousePointerClick}
            label="Clics"
            value={clicked}
            delta={mockDelta('clicked')}
            sublabel={`${clickRate.toFixed(1)}% taux de clic`}
            accent="var(--chart-4)"
          />
          <KpiCard
            icon={AlertCircle}
            label="Erreurs"
            value={errors}
            delta={mockDelta('errors')}
            sublabel={`${errorRate.toFixed(1)}% (rebonds + échecs)`}
            accent="var(--destructive)"
          />
          <KpiCard
            icon={Gauge}
            label="Quota du jour"
            value={`${sentToday}/${dailyLimit}`}
            sublabel={`${quotaPct.toFixed(0)}% utilisé`}
            accent="var(--primary)"
          />
        </div>
      )}

      {/* Main trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Évolution des envois &amp; performances</CardTitle>
          <CardDescription>30 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : trend.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              Pas encore de données sur cette période.
            </div>
          ) : (
            <ChartContainer config={TREND_CONFIG} className="aspect-[16/7] w-full">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  {Object.entries(TREND_CONFIG).map(([k, v]) => {
                    const color = v.color as string
                    return (
                      <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDay}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.floor(v / 1000)}k` : `${v}`)}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, p) => {
                        const d = p?.[0]?.payload?.date
                        return d ? fmtDayMonth(d) : ''
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.entries(TREND_CONFIG).map(([k, v]) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={v.color}
                    fill={`url(#g-${k})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Secondary charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par type d'événement</CardTitle>
            <CardDescription>Total cumulé sur 30 jours</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                Aucun événement enregistré.
              </div>
            ) : (
              <ChartContainer config={pieConfig} className="aspect-square w-full max-h-72 mx-auto">
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="key" />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="key" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top campagnes par ouverture</CardTitle>
            <CardDescription>Taux d'ouverture % (envoyées récemment)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : topCampaigns.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                Aucune campagne envoyée à comparer.
              </div>
            ) : (
              <ChartContainer
                config={{ openRate: { label: "Taux d'ouverture", color: 'var(--chart-1)' } }}
                className="aspect-[16/9] w-full"
              >
                <BarChart data={topCampaigns} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => `${v}%`} />}
                  />
                  <Bar dataKey="openRate" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Campagnes récentes</CardTitle>
            <CardDescription>Vos 3 dernières campagnes</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setView('campaigns')}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Aucune campagne pour le moment.</p>
              <Button size="sm" className="mt-3" onClick={() => setView('campaign-new')}>
                <Plus className="size-4" />
                Créer une campagne
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {recentCampaigns.map((c) => {
                const cOpen = pct(c.opened, c.delivered || c.sent || 1)
                const cDeliv = pct(c.delivered, c.sent || 1)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setView('campaign-detail', c.id)}
                    className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-1 text-sm font-semibold">
                        {c.name}
                      </span>
                      {statusBadge(c.status)}
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {c.subject || '—'}
                    </p>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-xs">
                      <div>
                        <div className="font-medium tabular-nums">{fmtInt(c.sent)}</div>
                        <div className="text-[10px] text-muted-foreground">Envoyés</div>
                      </div>
                      <div>
                        <div className="font-medium tabular-nums">{cDeliv.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground">Délivrés</div>
                      </div>
                      <div>
                        <div className="font-medium tabular-nums text-primary">{cOpen.toFixed(0)}%</div>
                        <div className="text-[10px] text-muted-foreground">Ouverts</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
          <CardDescription>Continuez là où vous vous êtes arrêté</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              icon={Plus}
              label="Nouvelle campagne"
              description="Rédigez et envoyez"
              onClick={() => setView('campaign-new')}
            />
            <QuickAction
              icon={Upload}
              label="Importer contacts"
              description="CSV ou intégration"
              onClick={() => setView('contacts')}
            />
            <QuickAction
              icon={Globe}
              label="Configurer le domaine"
              description="Authentifiez votre envoi"
              onClick={() => setView('domain')}
            />
            <QuickAction
              icon={BarChart3}
              label="Voir statistiques"
              description="Rapports détaillés"
              onClick={() => setView('stats')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ------------------------------- subcomponents ----------------------------- */

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
}

function QuickAction({ icon: Icon, label, description, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  )
}

function EmptyState({
  firstName,
  workspaceName,
  planName,
  onCreateCampaign,
}: {
  firstName?: string | null
  workspaceName: string
  planName?: string | null
  onCreateCampaign: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center sm:py-16">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-8" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Bienvenue{firstName ? `, ${firstName}` : ''} sur MailOqui 👋
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Vous êtes prêt à envoyer votre premier e-mail pour{' '}
          <span className="font-medium text-foreground">{workspaceName}</span>
          {planName && (
            <>
              {' '}au plan <span className="font-medium text-foreground">{planName}</span>
            </>
          )}. Créez votre première campagne en quelques minutes.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onCreateCampaign}>
            <Plus className="size-4" />
            Créez votre première campagne
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Upload className="size-4" />
            Importer des contacts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
