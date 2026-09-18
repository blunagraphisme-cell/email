'use client'

/**
 * EmailOqui — Campaigns list view
 *
 * Tableau des campagnes du workspace courant avec:
 *  - Filtres par statut (Toutes / Brouillons / Programmées / En cours / Envoyées / Annulées)
 *  - Compteur en haut + badges par statut
 *  - Tableau shadcn (Nom, Sujet, Statut, Destinataires, Taux ouverture, Taux clic,
 *    Date envoi/programmation, Actions)
 *  - Menu Actions (Voir, Dupliquer, Supprimer) avec AlertDialog de confirmation
 *  - Loading skeletons + empty state CTA
 *  - Refetch automatique au retour sur la vue (window focus) + bouton refresh manuel
 */
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  Copy,
  Eye,
  Inbox,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

/* ----------------------------- types & helpers ---------------------------- */

interface CampaignRow {
  id: string
  name: string
  subject?: string | null
  fromName?: string | null
  fromEmail?: string | null
  status: string
  scheduledAt?: string | null
  sentAt?: string | null
  recipientCount: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  unsubscribed: number
  createdAt: string
  updatedAt: string
}

type FilterKey = 'all' | 'BROUILLON' | 'PROGRAMMEE' | 'EN_COURS' | 'ENVOYEE' | 'ANNULEE' | 'ECHOUEE'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'BROUILLON', label: 'Brouillons' },
  { key: 'PROGRAMMEE', label: 'Programmées' },
  { key: 'EN_COURS', label: 'En cours' },
  { key: 'ENVOYEE', label: 'Envoyées' },
  { key: 'ANNULEE', label: 'Annulées' },
]

const STATUS_META: Record<string, { label: string; badgeClass: string }> = {
  BROUILLON: { label: 'Brouillon', badgeClass: 'bg-slate-500 text-white' },
  PROGRAMMEE: { label: 'Programmée', badgeClass: 'bg-amber-500 text-white' },
  EN_COURS: { label: 'En cours', badgeClass: 'bg-emerald-600 text-white' },
  ENVOYEE: { label: 'Envoyée', badgeClass: 'bg-emerald-600 text-white' },
  ANNULEE: { label: 'Annulée', badgeClass: 'bg-red-500 text-white' },
  ECHOUEE: { label: 'Échouée', badgeClass: 'bg-red-500 text-white' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, badgeClass: 'bg-slate-500 text-white' }
  return (
    <Badge variant="outline" className={cn('border-transparent', meta.badgeClass)}>
      {meta.label}
    </Badge>
  )
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0)

function fmtDate(iso?: string | null): string {
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

/* ------------------------------- View body ------------------------------- */

export default function CampaignsView() {
  const setView = useAppStore((s) => s.setView)
  const [filter, setFilter] = React.useState<FilterKey>('all')
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [campaigns, setCampaigns] = React.useState<CampaignRow[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<CampaignRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const load = React.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/campaigns', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message ?? 'Erreur lors du chargement.')
      }
      setCampaigns(data.campaigns as CampaignRow[])
    } catch (e: any) {
      setError(e?.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  // Refetch on window focus (returning to this tab)
  React.useEffect(() => {
    const onFocus = () => void load(true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [load])

  const filtered = React.useMemo(() => {
    let list = campaigns
    if (filter !== 'all') list = list.filter((c) => c.status === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.subject ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [campaigns, filter, search])

  const counts = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of campaigns) out[c.status] = (out[c.status] ?? 0) + 1
    return out
  }, [campaigns])

  const duplicate = async (c: CampaignRow) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${c.name} (copie)`,
          subject: c.subject ?? undefined,
          fromName: c.fromName ?? undefined,
          fromEmail: c.fromEmail ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Campagne dupliquée avec succès.')
      void load(true)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la duplication.')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/campaigns/${pendingDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Campagne supprimée.')
      setPendingDelete(null)
      void load(true)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campagnes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez, programmez et analysez vos campagnes e-mail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={() => setView('campaign-new')} className="gap-1.5">
            <Plus className="size-4" />
            Nouvelle campagne
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && campaigns.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard label="Total" value={campaigns.length} accent="bg-slate-500" />
          <SummaryCard
            label="Brouillons"
            value={counts.BROUILLON ?? 0}
            accent="bg-slate-500"
          />
          <SummaryCard
            label="Programmées"
            value={counts.PROGRAMMEE ?? 0}
            accent="bg-amber-500"
          />
          <SummaryCard
            label="En cours"
            value={counts.EN_COURS ?? 0}
            accent="bg-emerald-600"
          />
          <SummaryCard
            label="Envoyées"
            value={counts.ENVOYEE ?? 0}
            accent="bg-emerald-600"
          />
          <SummaryCard
            label="Annulées"
            value={(counts.ANNULEE ?? 0) + (counts.ECHOUEE ?? 0)}
            accent="bg-red-500"
          />
        </div>
      )}

      {/* Filters + search */}
      {!loading && campaigns.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList className="flex-wrap">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.key} value={f.key} className="text-xs">
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Input
            placeholder="Rechercher par nom ou sujet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-64"
          />
        </div>
      )}

      {/* Body */}
      {loading ? (
        <CampaignsSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void load()}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <EmptyState onCreate={() => setView('campaign-new')} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Aucune campagne ne correspond à ce filtre.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4">Nom</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Destinataires</TableHead>
                <TableHead className="text-right">Taux ouverture</TableHead>
                <TableHead className="text-right">Taux clic</TableHead>
                <TableHead>Date envoi / programmation</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const openRate = pct(c.opened, c.sent)
                const clickRate = pct(c.clicked, c.sent)
                const date = c.sentAt ?? c.scheduledAt
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setView('campaign-detail', c.id)}
                  >
                    <TableCell className="pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 text-muted-foreground" />
                        <span className="truncate">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {c.subject || '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.recipientCount || c.sent || 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.sent > 0 ? `${openRate.toFixed(1)} %` : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.sent > 0 ? `${clickRate.toFixed(1)} %` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(date)}
                    </TableCell>
                    <TableCell className="pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setView('campaign-detail', c.id)}>
                            <Eye className="size-3.5" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void duplicate(c)}>
                            <Copy className="size-3.5" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingDelete(c)}
                          >
                            <Trash2 className="size-3.5" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer définitivement
              <strong className="mx-1 font-semibold text-foreground">
                {pendingDelete?.name}
              </strong>
              et tous ses événements associés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------ Sub-components ----------------------------- */

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <span className={cn('size-2.5 rounded-full', accent)} aria-hidden />
        <div>
          <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Inbox className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Aucune campagne pour le moment</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Créez votre première campagne e-mail pour commencer à toucher vos
            contacts et suivre vos performances.
          </p>
        </div>
        <Button onClick={onCreate} className="mt-2 gap-1.5">
          <Plus className="size-4" />
          Créer ma première campagne
        </Button>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="size-3" />
          Vous venez d'ajouter des données démo ? Actualisez.
        </button>
      </CardContent>
    </Card>
  )
}

function CampaignsSkeleton() {
  return (
    <Card className="p-0">
      <div className="space-y-2 p-4">
        <Skeleton className="h-9 w-full" />
        <Separator />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </Card>
  )
}
