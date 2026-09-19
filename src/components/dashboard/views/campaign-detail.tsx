'use client'

/**
 * EmailOqui — Campaign detail view
 *
 * Affiche:
 *   - Header (nom, statut, actions selon le statut)
 *   - Détails (expéditeur, sujet, destinataires, dates, créateur)
 *   - Statistiques (6 KPI cards + bar chart recharts)
 *   - Aperçu de l'e-mail (EmailPreview)
 *   - Événements récents (table 20 derniers)
 *
 * Récupère `viewParam` du store (campaignId) et fetch GET /api/campaigns/[id].
 */
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Loader2,
  Mail,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import { EmailPreview } from '@/components/email-editor/email-preview'
import { type Block, parseBlocks } from '@/components/email-editor/types'

/* ----------------------------- types & helpers ---------------------------- */

interface CampaignDetail {
  id: string
  name: string
  subject?: string | null
  fromName?: string | null
  fromEmail?: string | null
  content: unknown
  htmlContent?: string | null
  status: string
  scheduledAt?: string | null
  sentAt?: string | null
  recipientCount: number
  createdAt: string
  updatedAt: string
}

interface CampaignStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  unsubscribed: number
  complaint: number
}

interface EmailEvent {
  id: string
  contactEmail: string
  eventType: string
  occurredAt: string
  messageId?: string | null
}

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  BROUILLON: { label: 'Brouillon', badgeClass: 'bg-slate-500 text-white' },
  PROGRAMMEE: { label: 'Programmée', badgeClass: 'bg-muted-foreground text-white' },
  EN_COURS: { label: 'En cours', badgeClass: 'bg-foreground text-background' },
  ENVOYEE: { label: 'Envoyée', badgeClass: 'bg-foreground text-background' },
  ANNULEE: { label: 'Annulée', badgeClass: 'bg-red-500 text-white' },
  ECHOUEE: { label: 'Échouée', badgeClass: 'bg-red-500 text-white' },
}

const EVENT_LABEL: Record<string, string> = {
  SENT: 'Envoyé',
  DELIVERED: 'Délivré',
  OPENED: 'Ouverture',
  CLICKED: 'Clic',
  BOUNCE: 'Bounce',
  FAILED: 'Échec',
  UNSUBSCRIBE: 'Désabonnement',
  COMPLAINT: 'Plainte',
}

const EVENT_COLOR: Record<string, string> = {
  SENT: '#94a3b8',
  DELIVERED: '#10b981',
  OPENED: '#f59e0b',
  CLICKED: '#ea580c',
  BOUNCE: '#ef4444',
  FAILED: '#dc2626',
  UNSUBSCRIBE: '#8b5cf6',
  COMPLAINT: '#be123c',
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0)

function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtRelative(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const sec = Math.round(diff / 1000)
  if (sec < 60) return `il y a ${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `il y a ${min}min`
  const hr = Math.round(min / 60)
  if (hr < 24) return `il y a ${hr}h`
  const day = Math.round(hr / 24)
  return `il y a ${day}j`
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, badgeClass: 'bg-slate-500 text-white' }
  return (
    <Badge variant="outline" className={cn('border-transparent', meta.badgeClass)}>
      {meta.label}
    </Badge>
  )
}

/* --------------------------------- View --------------------------------- */

export default function CampaignDetailView() {
  const viewParam = useAppStore((s) => s.viewParam)
  const workspace = useAppStore((s) => s.workspace)
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)

  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [campaign, setCampaign] = React.useState<CampaignDetail | null>(null)
  const [stats, setStats] = React.useState<CampaignStats | null>(null)
  const [recentEvents, setRecentEvents] = React.useState<EmailEvent[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)

  const campaignId = viewParam
  const statsRef = React.useRef<HTMLDivElement>(null)

  const load = React.useCallback(async (silent = false) => {
    if (!campaignId) return
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message ?? 'Campagne introuvable.')
      setCampaign(data.campaign as CampaignDetail)
      setStats(data.stats as CampaignStats)
      setRecentEvents((data.recentEvents as EmailEvent[]) ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [campaignId])

  React.useEffect(() => {
    void load()
  }, [load])

  if (!campaignId) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center md:px-8">
        <p className="text-sm text-muted-foreground">Aucune campagne sélectionnée.</p>
        <Button variant="link" onClick={() => setView('campaigns')}>
          ← Retour aux campagnes
        </Button>
      </div>
    )
  }

  /* ------------------------------ Actions ------------------------------ */

  const handleEdit = () => setView('editor', campaignId)

  const handleCancelSchedule = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'BROUILLON', scheduledAt: null }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Programmation annulée. La campagne est de nouveau un brouillon.')
      void load(true)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendNow = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const code = data?.error?.code
        const msg = data?.error?.message ?? "Échec de l'envoi."
        if (code === 'SUBSCRIPTION_INACTIVE') {
          toast.error(msg, { description: 'Vérifiez votre abonnement.' })
        } else if (code === 'DOMAIN_NOT_VERIFIED') {
          toast.error(msg, { description: 'Vérifiez votre domaine.' })
        } else if (code === 'QUOTA_EXCEEDED') {
          toast.error(msg, { description: 'Quota atteint.' })
        } else {
          toast.error(msg)
        }
        return
      }
      toast.success(`Campagne envoyée à ${data.sentTo} destinataire(s).`)
      await refreshSession()
      void load(true)
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'envoi.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDuplicate = async () => {
    if (!campaign) return
    setActionLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${campaign.name} (copie)`,
          subject: campaign.subject ?? undefined,
          fromName: campaign.fromName ?? undefined,
          fromEmail: campaign.fromEmail ?? undefined,
          content: parseBlocks(campaign.content),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Campagne dupliquée.')
      setView('campaign-detail', data.campaign.id)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la duplication.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Campagne supprimée.')
      setView('campaigns')
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la suppression.')
    } finally {
      setActionLoading(false)
      setConfirmDelete(false)
    }
  }

  /* ------------------------------ Render ------------------------------ */

  if (loading) return <DetailSkeleton onBack={() => setView('campaigns')} />
  if (error || !campaign) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 text-center md:px-8">
        <p className="text-sm font-medium text-destructive">{error ?? 'Campagne introuvable.'}</p>
        <Button variant="link" onClick={() => setView('campaigns')}>
          ← Retour aux campagnes
        </Button>
      </div>
    )
  }

  const blocks: Block[] = parseBlocks(campaign.content)
  const status = campaign.status
  const isDraft = status === 'BROUILLON'
  const isScheduled = status === 'PROGRAMMEE'
  const isSending = status === 'EN_COURS'
  const isSent = status === 'ENVOYEE'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => setView('campaigns')}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Retour aux campagnes
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {campaign.subject || 'Aucun sujet'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
              Actualiser
            </Button>
            {isDraft && (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="size-4" />
                  Modifier
                </Button>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <CalendarClock className="size-4" />
                  Programmer
                </Button>
                <Button size="sm" onClick={handleSendNow} disabled={actionLoading}>
                  {actionLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Envoyer
                </Button>
              </>
            )}
            {isScheduled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelSchedule}
                disabled={actionLoading}
              >
                <CalendarClock className="size-4" />
                Annuler la programmation
              </Button>
            )}
            {isSending && (
              <Badge variant="outline" className="border-transparent bg-muted-foreground text-white">
                <Loader2 className="size-3 animate-spin" />
                Envoi en cours…
              </Badge>
            )}
            {isSent && (
              <Button variant="outline" size="sm" onClick={() => statsRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                <BarChart3 className="size-4" />
                Voir les stats
              </Button>
            )}
            {(isSent || isDraft) && (
              <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={actionLoading}>
                <Copy className="size-4" />
                Dupliquer
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={actionLoading}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Détails */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Détails
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem icon={Mail} label="Expéditeur" value={`${campaign.fromName ?? '—'} <${campaign.fromEmail ?? '—'}>`} />
          <DetailItem icon={Mail} label="Sujet" value={campaign.subject ?? '—'} />
          <DetailItem icon={Users} label="Destinataires" value={String(campaign.recipientCount ?? (stats?.sent ?? 0))} />
          <DetailItem icon={CalendarClock} label="Créée le" value={fmtDateTime(campaign.createdAt)} />
          <DetailItem
            icon={CalendarClock}
            label="Programmée pour"
            value={fmtDateTime(campaign.scheduledAt)}
          />
          <DetailItem icon={Send} label="Envoyée le" value={fmtDateTime(campaign.sentAt)} />
        </CardContent>
      </Card>

      {/* Stats */}
      {isSent && stats && (
        <Card ref={statsRef} className="mb-5 scroll-mt-20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <KpiCard label="Envoyés" value={stats.sent} icon={Send} accent="#94a3b8" />
              <KpiCard
                label="Délivrés"
                value={stats.delivered}
                sublabel={`${pct(stats.delivered, stats.sent).toFixed(1)} % délivrabilité`}
                icon={CheckCircle2}
                accent="#10b981"
              />
              <KpiCard
                label="Ouvertures"
                value={stats.opened}
                sublabel={`${pct(stats.opened, stats.sent).toFixed(1)} % ouverture`}
                icon={Eye}
                accent="#f59e0b"
              />
              <KpiCard
                label="Clics"
                value={stats.clicked}
                sublabel={`${pct(stats.clicked, stats.sent).toFixed(1)} % clic`}
                icon={BarChart3}
                accent="#ea580c"
              />
              <KpiCard
                label="Bounces"
                value={stats.bounced}
                sublabel={`${pct(stats.bounced, stats.sent).toFixed(1)} % bounce`}
                icon={Mail}
                accent="#ef4444"
              />
              <KpiCard
                label="Désabo."
                value={stats.unsubscribed}
                sublabel={`${pct(stats.unsubscribed, stats.sent).toFixed(1)} %`}
                icon={Users}
                accent="#8b5cf6"
              />
            </div>

            {/* Bar chart: events distribution */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">Répartition par type d'événement</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eventChartData(stats)} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      cursor={{ fill: 'var(--accent)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Nombre">
                      {eventChartData(stats).map((d, i) => (
                        <Cell key={i} fill={(EVENT_COLOR[d.key] as string) ?? '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aperçu de l'e-mail */}
      <Card className="mb-5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-4" />
            Aperçu de l'e-mail
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <EmailPreview blocks={blocks} workspaceName={workspace?.name ?? 'Mon Entreprise'} />
        </CardContent>
      </Card>

      {/* Événements récents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Événements récents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun événement enregistré pour cette campagne.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">E-mail destinataire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="pr-4 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="pl-4 font-mono text-xs">{e.contactEmail}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-transparent text-white"
                          style={{
                            backgroundColor: EVENT_COLOR[e.eventType] ?? '#94a3b8',
                          }}
                        >
                          {EVENT_LABEL[e.eventType] ?? e.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {fmtDateTime(e.occurredAt)}{' '}
                        <span className="text-[11px] opacity-70">({fmtRelative(e.occurredAt)})</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer définitivement
              <strong className="mx-1 font-semibold text-foreground">{campaign.name}</strong>
              et tous ses événements. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
              disabled={actionLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {actionLoading ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------ Sub-components ----------------------------- */

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  sublabel?: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span
          className="flex size-6 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums">
        {value.toLocaleString('fr-FR')}
      </p>
      {sublabel && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>
      )}
    </div>
  )
}

function eventChartData(stats: CampaignStats) {
  return [
    { key: 'SENT', label: 'Envoyés', value: stats.sent },
    { key: 'DELIVERED', label: 'Délivrés', value: stats.delivered },
    { key: 'OPENED', label: 'Ouverts', value: stats.opened },
    { key: 'CLICKED', label: 'Clics', value: stats.clicked },
    { key: 'BOUNCE', label: 'Bounces', value: stats.bounced },
    { key: 'FAILED', label: 'Échecs', value: stats.failed },
    { key: 'UNSUBSCRIBE', label: 'Désabo.', value: stats.unsubscribed },
  ]
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <button
        onClick={onBack}
        className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Retour aux campagnes
      </button>
      <Skeleton className="mb-4 h-8 w-80" />
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="mb-5 h-40 w-full" />
      <Skeleton className="mb-5 h-72 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  )
}
