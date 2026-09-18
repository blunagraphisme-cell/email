'use client'

/**
 * StatsView — Statistiques détaillées MailOqui (Task 5-c)
 * Vue agrégée: KPIs, taux calculés, graphiques d'évolution, répartition par
 * type d'événement, performance par campagne, quota quotidien, campagnes
 * récentes. Tout est lu via GET /api/stats/overview?days=... et GET /api/campaigns.
 *
 * Aucune mention d'un fournisseur d'envoi tiers — MailOqui reste white-label.
 */

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Mail,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertCircle,
  UserMinus,
  FileDown,
  Info,
  BarChart3,
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
import { toast } from 'sonner'

/* ------------------------------- data types ------------------------------- */

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
  recipientCount?: number | null
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  unsubscribed: number
  sentAt?: string | null
  createdAt?: string | null
}

/* -------------------------------- helpers --------------------------------- */

const fmtInt = (n: number) => n.toLocaleString('fr-FR')
const fmtFloat = (n: number, d = 1) => n.toFixed(d)
const pct = (num: number, denom: number) => (denom > 0 ? (num / denom) * 100 : 0)

function fmtDay(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function fmtDayMonth(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ------------------------------- chart config ----------------------------- */

const TREND_CONFIG: ChartConfig = {
  SENT: { label: 'Envoyés', color: 'var(--chart-1)' },
  DELIVERED: { label: 'Délivrés', color: 'var(--chart-2)' },
  OPENED: { label: 'Ouverts', color: 'var(--chart-3)' },
  CLICKED: { label: 'Clics', color: 'var(--chart-4)' },
}

const PIE_COLORS: Record<string, string> = {
  SENT: 'var(--chart-1)',
  DELIVERED: 'var(--chart-2)',
  OPENED: 'var(--chart-3)',
  CLICKED: 'var(--chart-4)',
  ERRORS: 'var(--destructive)',
  UNSUB: 'var(--chart-5)',
}

const PIE_CONFIG: ChartConfig = {
  SENT: { label: 'Envoyés', color: PIE_COLORS.SENT },
  DELIVERED: { label: 'Délivrés', color: PIE_COLORS.DELIVERED },
  OPENED: { label: 'Ouverts', color: PIE_COLORS.OPENED },
  CLICKED: { label: 'Clics', color: PIE_COLORS.CLICKED },
  ERRORS: { label: 'Erreurs', color: PIE_COLORS.ERRORS },
  UNSUB: { label: 'Désabonnements', color: PIE_COLORS.UNSUB },
}

const BAR_CONFIG: ChartConfig = {
  openRate: { label: "Taux d'ouverture", color: 'var(--chart-3)' },
}

const STATUS_META: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  BROUILLON: { label: 'Brouillon', variant: 'secondary' },
  PROGRAMMEE: { label: 'Programmée', variant: 'default' },
  EN_COURS: { label: 'En cours', variant: 'default' },
  ENVOYEE: { label: 'Envoyée', variant: 'outline' },
  ECHOUEE: { label: 'Échouée', variant: 'destructive' },
  ANNULEE: { label: 'Annulée', variant: 'destructive' },
  ARCHIVEE: { label: 'Archivée', variant: 'secondary' },
}

function statusBadge(status: string) {
  const m = STATUS_META[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={m.variant}>{m.label}</Badge>
}

/* --------------------------------- periods -------------------------------- */

const PERIODS = [
  { value: '1', label: "Aujourd'hui" },
  { value: '7', label: '7 jours' },
  { value: '30', label: '30 jours' },
  { value: 'custom', label: 'Personnalisé' },
]

const CUSTOM_DAYS = [
  { value: '14', label: '14 jours' },
  { value: '60', label: '60 jours' },
  { value: '90', label: '90 jours' },
  { value: '180', label: '180 jours' },
]

/* -------------------------------- KPI card --------------------------------- */

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  sublabel: string
  accent?: string
}

function KpiCard({ icon: Icon, label, value, sublabel, accent }: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wide">
            {label}
          </CardDescription>
          <span
            className="flex size-8 items-center justify-center rounded-md"
            style={{
              backgroundColor: `color-mix(in srgb, ${accent ?? 'var(--primary)'} 18%, transparent)`,
              color: accent ?? 'var(--primary)',
            }}
          >
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {fmtInt(value)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  )
}

/* ------------------------------ rate tile --------------------------------- */

interface RateTileProps {
  label: string
  value: number
  formula: string
  tone?: 'default' | 'destructive' | 'warning'
}

function RateTile({ label, value, formula, tone = 'default' }: RateTileProps) {
  const toneColor =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-foreground'
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${toneColor}`}>
        {fmtFloat(value)}%
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{formula}</p>
    </div>
  )
}

/* ----------------------------- header / controls -------------------------- */

interface StatsHeaderProps {
  days: number
  period: string
  customDays: string
  onPeriodChange: (v: string) => void
  onCustomChange: (v: string) => void
  onExport: () => void
}

function StatsHeader({
  days,
  period,
  customDays,
  onPeriodChange,
  onCustomChange,
  onExport,
}: StatsHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyse détaillée de vos performances —{' '}
          {days === 1 ? "aujourd'hui" : `${days} derniers jours`}.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger size="sm" className="w-[160px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {period === 'custom' && (
          <Select value={customDays} onValueChange={onCustomChange}>
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue placeholder="Durée" />
            </SelectTrigger>
            <SelectContent>
              {CUSTOM_DAYS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant="outline" onClick={onExport}>
          <FileDown className="size-4" />
          Export PDF
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------- main view ------------------------------- */

export default function StatsView() {
  const workspace = useAppStore((s) => s.workspace)
  const setView = useAppStore((s) => s.setView)

  const [period, setPeriod] = React.useState('30')
  const [customDays, setCustomDays] = React.useState('90')
  const days = period === 'custom' ? Number(customDays) : Number(period)

  const [loading, setLoading] = React.useState(true)
  const [stats, setStats] = React.useState<OverviewStats | null>(null)
  const [trend, setTrend] = React.useState<TrendPoint[]>([])
  const [campaigns, setCampaigns] = React.useState<CampaignWithStats[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, campsRes] = await Promise.all([
        fetch(`/api/stats/overview?days=${days}`, { cache: 'no-store' }),
        fetch('/api/campaigns', { cache: 'no-store' }),
      ])
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
      /* network error — keep skeleton */
    } finally {
      setLoading(false)
    }
  }, [days])

  React.useEffect(() => {
    void load()
  }, [load])

  /* -------------------------------- derived -------------------------------- */

  const sent = stats?.sent ?? 0
  const delivered = stats?.delivered ?? 0
  const opened = stats?.opened ?? 0
  const clicked = stats?.clicked ?? 0
  const errors = (stats?.bounced ?? 0) + (stats?.failed ?? 0)
  const unsubscribed = stats?.unsubscribed ?? 0

  const sentToday = stats?.emailsSentToday ?? workspace?.emailsSentToday ?? 0
  const dailyLimit = stats?.dailyLimit ?? workspace?.dailyEmailLimit ?? 0

  const deliverability = pct(delivered, sent)
  const openRate = pct(opened, delivered)
  const clickRate = pct(clicked, delivered)
  const errorRate = pct(errors, sent)
  const unsubRate = pct(unsubscribed, delivered)
  const quotaPct = pct(sentToday, dailyLimit)
  const quotaTone: 'destructive' | 'primary' | 'emerald' =
    quotaPct >= 90 ? 'destructive' : quotaPct >= 80 ? 'primary' : 'emerald'

  // Pie data — event type distribution (filter out zero entries so the chart
  // is not polluted by empty slices)
  const pieData = [
    { name: 'Envoyés', value: sent, key: 'SENT' },
    { name: 'Délivrés', value: delivered, key: 'DELIVERED' },
    { name: 'Ouverts', value: opened, key: 'OPENED' },
    { name: 'Clics', value: clicked, key: 'CLICKED' },
    { name: 'Erreurs', value: errors, key: 'ERRORS' },
    { name: 'Désabonnements', value: unsubscribed, key: 'UNSUB' },
  ].filter((d) => d.value > 0)

  // Top 5 campaigns by open rate (only those with at least one delivered)
  const topCampaigns = [...campaigns]
    .map((c) => ({
      name: c.name.length > 14 ? c.name.slice(0, 13) + '…' : c.name,
      openRate: Number(pct(c.opened, c.delivered || c.sent || 1).toFixed(1)),
      sent: c.sent,
    }))
    .filter((c) => c.sent > 0)
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 5)

  const recentCampaigns = campaigns.slice(0, 5)

  /* ------------------------------- empty state ----------------------------- */

  if (!loading && sent === 0) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <StatsHeader
          days={days}
          period={period}
          customDays={customDays}
          onPeriodChange={setPeriod}
          onCustomChange={setCustomDays}
          onExport={() => toast.info('Rapport en cours de génération…')}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BarChart3 className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Aucune statistique disponible</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Lancez votre première campagne pour commencer à suivre vos
                performances. Les envois, ouvertures, clics et erreurs
                apparaîtront ici en temps réel.
              </p>
            </div>
            <Button onClick={() => setView('campaign-new')}>
              <Mail className="size-4" />
              Créer une campagne
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* -------------------------------- render --------------------------------- */

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <StatsHeader
        days={days}
        period={period}
        customDays={customDays}
        onPeriodChange={setPeriod}
        onCustomChange={setCustomDays}
        onExport={() => toast.info('Rapport en cours de génération…')}
      />

      {/* KPI grid — 6 cards responsive */}
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
            sublabel={`Taux de délivrabilité: ${fmtFloat(deliverability)}%`}
            accent="var(--chart-1)"
          />
          <KpiCard
            icon={CheckCircle2}
            label="E-mails délivrés"
            value={delivered}
            sublabel={`Taux de délivrabilité: ${fmtFloat(deliverability)}%`}
            accent="var(--chart-2)"
          />
          <KpiCard
            icon={Eye}
            label="Ouvertures uniques"
            value={opened}
            sublabel={`Taux d'ouverture: ${fmtFloat(openRate)}%`}
            accent="var(--chart-3)"
          />
          <KpiCard
            icon={MousePointerClick}
            label="Clics uniques"
            value={clicked}
            sublabel={`Taux de clic: ${fmtFloat(clickRate)}%`}
            accent="var(--chart-4)"
          />
          <KpiCard
            icon={AlertCircle}
            label="Erreurs"
            value={errors}
            sublabel={`Taux d'erreur: ${fmtFloat(errorRate)}%`}
            accent="var(--destructive)"
          />
          <KpiCard
            icon={UserMinus}
            label="Désabonnements"
            value={unsubscribed}
            sublabel={`Taux de désabonnement: ${fmtFloat(unsubRate)}%`}
            accent="var(--chart-5)"
          />
        </div>
      )}

      {/* Main trend chart — full width AreaChart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Évolution des envois &amp; performances
          </CardTitle>
          <CardDescription>
            {days === 1 ? "Aujourd'hui" : `${days} derniers jours`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : trend.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              Pas encore de données sur cette période.
            </div>
          ) : (
            <ChartContainer
              config={TREND_CONFIG}
              className="aspect-[16/7] w-full"
            >
              <AreaChart
                data={trend}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
              >
                <defs>
                  {Object.entries(TREND_CONFIG).map(([k, v]) => {
                    const color = v.color as string
                    return (
                      <linearGradient
                        key={k}
                        id={`g-stat-${k}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
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
                  tickFormatter={(v) =>
                    v >= 1000 ? `${Math.floor(v / 1000)}k` : `${v}`
                  }
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, p) => {
                        const d = p?.[0]?.payload?.date as string | undefined
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
                    fill={`url(#g-stat-${k})`}
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

      {/* Calculated rates block */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Taux calculés</CardTitle>
          <CardDescription>
            Indicateurs de performance sur la période sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <RateTile
              label="Taux de délivrabilité"
              value={deliverability}
              formula="délivrés / envoyés × 100"
            />
            <RateTile
              label="Taux d'ouverture"
              value={openRate}
              formula="ouvertures / délivrés × 100"
            />
            <RateTile
              label="Taux de clic"
              value={clickRate}
              formula="clics / délivrés × 100"
            />
            <RateTile
              label="Taux d'erreur"
              value={errorRate}
              formula="(rebonds + échecs) / envoyés × 100"
              tone="destructive"
            />
            <RateTile
              label="Taux de désabonnement"
              value={unsubRate}
              formula="désabonnements / délivrés × 100"
              tone="warning"
            />
          </div>
        </CardContent>
      </Card>

      {/* Secondary charts — Pie (event distribution) + Bar (campaigns) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Répartition par type d'événement
            </CardTitle>
            <CardDescription>Total cumulé sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                Aucun événement enregistré.
              </div>
            ) : (
              <ChartContainer
                config={PIE_CONFIG}
                className="mx-auto aspect-square max-h-72 w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="key" />} />
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
            <CardTitle className="text-base">Performance par campagne</CardTitle>
            <CardDescription>Top 5 par taux d'ouverture</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : topCampaigns.length === 0 ? (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                Aucune campagne envoyée sur la période.
              </div>
            ) : (
              <ChartContainer
                config={BAR_CONFIG}
                className="mx-auto aspect-square max-h-72 w-full"
              >
                <BarChart
                  data={topCampaigns}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={88}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)' }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `${Number(value).toFixed(1)}%`}
                      />
                    }
                  />
                  <Bar dataKey="openRate" fill="var(--chart-3)" radius={6} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily quota block */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quota quotidien d'envoi</CardTitle>
          <CardDescription>
            Limite appliquée par le plan courant
            {workspace?.planName ? ` — plan ${workspace.planName}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tabular-nums">
              {fmtInt(sentToday)}{' '}
              <span className="text-base font-medium text-muted-foreground">
                / {fmtInt(dailyLimit)}
              </span>
            </span>
            <Badge
              variant={
                quotaTone === 'destructive'
                  ? 'destructive'
                  : quotaTone === 'primary'
                    ? 'default'
                    : 'secondary'
              }
            >
              {fmtFloat(quotaPct, 0)}% utilisé
            </Badge>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                quotaTone === 'destructive'
                  ? 'bg-destructive'
                  : quotaTone === 'primary'
                    ? 'bg-primary'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, quotaPct)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {quotaPct >= 90
              ? "Vous approchez de la limite quotidienne. Les envois seront bloqués au-delà de 100%."
              : quotaPct >= 80
                ? 'Plus de 80% du quota utilisé. Surveillez vos envois restants.'
                : 'Quota sain — vous pouvez continuer à envoyer.'}
          </p>
        </CardContent>
      </Card>

      {/* Recent campaigns table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campagnes récentes</CardTitle>
          <CardDescription>Les 5 dernières campagnes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : recentCampaigns.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Aucune campagne pour le moment.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Destinataires</TableHead>
                    <TableHead className="text-right">Taux ouverture</TableHead>
                    <TableHead className="text-right">Taux clic</TableHead>
                    <TableHead className="text-right">Date envoi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCampaigns.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setView('campaign-detail', c.id)}
                    >
                      <TableCell className="max-w-[220px] truncate font-medium text-foreground">
                        {c.name}
                      </TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtInt(c.recipientCount ?? c.sent)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtFloat(pct(c.opened, c.delivered || c.sent || 1))}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmtFloat(pct(c.clicked, c.delivered || c.sent || 1))}%
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmtDayMonth(c.sentAt ?? c.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5" />
                Les ouvertures et clics sont comptés de manière unique.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
