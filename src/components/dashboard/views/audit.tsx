'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  ScrollText,
  Download,
  LogIn,
  Plus,
  Mail,
  Pencil,
  Send,
  Trash2,
  CreditCard,
  Globe,
  KeyRound,
  RefreshCw,
  Database,
  ChevronDown,
} from 'lucide-react'

/* --------------------------------- types --------------------------------- */

interface AuditUser {
  email: string
  firstName?: string | null
  lastName?: string | null
}

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown> | string | null
  createdAt: string
  user: AuditUser
}

/* --------------------------------- meta ---------------------------------- */

type ActionKey =
  | 'ALL'
  | 'LOGIN'
  | 'WORKSPACE_CREATED'
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_UPDATED'
  | 'CAMPAIGN_SENT'
  | 'CAMPAIGN_DELETED'
  | 'PAYMENT_CONFIRMED'
  | 'DOMAIN_UPDATED'
  | 'API_KEY_GENERATED'
  | 'API_KEY_REVOKED'
  | 'RENEWAL_LINK_GENERATED'
  | 'DEMO_DATA_SEEDED'

const ACTION_META: Record<Exclude<ActionKey, 'ALL'>, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  LOGIN: { label: 'Connexion', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', icon: LogIn },
  WORKSPACE_CREATED: { label: 'Workspace créé', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300', icon: Plus },
  CAMPAIGN_CREATED: { label: 'Campagne créée', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300', icon: Mail },
  CAMPAIGN_UPDATED: { label: 'Campagne modifiée', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', icon: Pencil },
  CAMPAIGN_SENT: { label: 'Campagne envoyée', cls: 'border-primary/30 bg-primary/10 text-primary', icon: Send },
  CAMPAIGN_DELETED: { label: 'Campagne supprimée', cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: Trash2 },
  PAYMENT_CONFIRMED: { label: 'Paiement confirmé', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', icon: CreditCard },
  DOMAIN_UPDATED: { label: 'Domaine modifié', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', icon: Globe },
  API_KEY_GENERATED: { label: 'Clé API générée', cls: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300', icon: KeyRound },
  API_KEY_REVOKED: { label: 'Clé API révoquée', cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: RefreshCw },
  RENEWAL_LINK_GENERATED: { label: 'Lien de renouvellement', cls: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300', icon: CreditCard },
  DEMO_DATA_SEEDED: { label: 'Données démo peuplées', cls: 'border-border bg-muted text-muted-foreground', icon: Database },
}

const ACTION_OPTIONS: ActionKey[] = [
  'ALL',
  'LOGIN',
  'WORKSPACE_CREATED',
  'CAMPAIGN_CREATED',
  'CAMPAIGN_UPDATED',
  'CAMPAIGN_SENT',
  'CAMPAIGN_DELETED',
  'PAYMENT_CONFIRMED',
  'DOMAIN_UPDATED',
  'API_KEY_GENERATED',
  'API_KEY_REVOKED',
  'RENEWAL_LINK_GENERATED',
  'DEMO_DATA_SEEDED',
]

/* --------------------------------- helpers -------------------------------- */

function fmt(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

function userLabel(u: AuditUser | null | undefined): string {
  if (!u) return '—'
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return name ? `${name} (${u.email})` : u.email
}

function metadataToText(m: AuditLog['metadata']): string {
  if (!m) return ''
  if (typeof m === 'string') {
    try {
      return JSON.stringify(JSON.parse(m), null, 2)
    } catch {
      return m
    }
  }
  try {
    return JSON.stringify(m, null, 2)
  } catch {
    return ''
  }
}

function buildCsv(logs: AuditLog[]): string {
  const headers = ['Date', 'Utilisateur', 'Email', 'Action', 'Entité', 'ID Entité', 'Détails']
  const rows = logs.map((l) => {
    const date = fmt(l.createdAt)
    const name = [l.user?.firstName, l.user?.lastName].filter(Boolean).join(' ').trim()
    const email = l.user?.email ?? ''
    const actionLabel = ACTION_META[l.action as Exclude<ActionKey, 'ALL'>]?.label ?? l.action
    const row = [
      date,
      name,
      email,
      actionLabel,
      l.entityType,
      l.entityId,
      metadataToText(l.metadata),
    ]
    return row
      .map((v) => {
        const s = String(v ?? '').replace(/"/g, '""')
        return `"${s}"`
      })
      .join(',')
  })
  return [headers.join(','), ...rows].join('\r\n')
}

function exportCsv(logs: AuditLog[]) {
  if (logs.length === 0) {
    toast.info('Aucun journal à exporter.')
    return
  }
  toast.info('Export en cours…')
  try {
    const csv = buildCsv(logs)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-mailoqui-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Export téléchargé.')
  } catch {
    toast.error('Erreur lors de l’export.')
  }
}

/* --------------------------------- View ---------------------------------- */

export default function AuditView() {
  const [loading, setLoading] = React.useState(true)
  const [logs, setLogs] = React.useState<AuditLog[]>([])
  const [limit, setLimit] = React.useState(50)
  const [actionFilter, setActionFilter] = React.useState<string>('ALL')
  const [hasMore, setHasMore] = React.useState(false)

  const load = React.useCallback(
    async (lim: number) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/audit?limit=${lim}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const items: AuditLog[] = Array.isArray(data?.logs) ? data.logs : []
          setLogs(items)
          setHasMore(items.length >= lim)
        } else {
          setLogs([])
          setHasMore(false)
        }
      } catch {
        setLogs([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  React.useEffect(() => {
    void load(limit)
  }, [load, limit])

  const filtered = React.useMemo(() => {
    if (actionFilter === 'ALL') return logs
    return logs.filter((l) => l.action === actionFilter)
  }, [logs, actionFilter])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="size-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Journaux d&apos;audit</h1>
            <p className="text-xs text-muted-foreground">
              Historique des actions effectuées sur ce workspace.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => exportCsv(filtered)}
          disabled={loading || filtered.length === 0}
        >
          <Download className="size-4" />
          Exporter CSV
        </Button>
      </header>

      {/* Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label htmlFor="audit-filter" className="text-xs text-muted-foreground">
          Filtrer par action
        </Label>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger id="audit-filter" className="w-full sm:w-[280px]">
            <SelectValue placeholder="Toutes les actions" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a === 'ALL' ? 'Toutes les actions' : (ACTION_META[a as Exclude<ActionKey, 'ALL'>]?.label ?? a)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} entrée{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ScrollText className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Aucun journal d&apos;audit</p>
                <p className="text-xs text-muted-foreground">
                  Les actions effectuées sur le workspace apparaîtront ici.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-9">Date</TableHead>
                    <TableHead className="h-9">Utilisateur</TableHead>
                    <TableHead className="h-9">Action</TableHead>
                    <TableHead className="h-9">Entité</TableHead>
                    <TableHead className="h-9">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => {
                    const m =
                      ACTION_META[l.action as Exclude<ActionKey, 'ALL'>] ??
                      ({ label: l.action, cls: 'border-border bg-muted text-muted-foreground', icon: ScrollText } as const)
                    const Icon = m.icon
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {fmt(l.createdAt)}
                        </TableCell>
                        <TableCell className="text-xs">{userLabel(l.user)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}
                          >
                            <Icon className="size-3" />
                            {m.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-col">
                            <span className="font-medium">{l.entityType}</span>
                            <code className="font-mono text-[10px] text-muted-foreground">{l.entityId.slice(0, 12)}…</code>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[320px]">
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                              <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                              Voir les détails
                            </summary>
                            <pre className="mt-2 max-h-40 overflow-auto rounded bg-foreground/5 p-2 text-[11px] leading-relaxed">
                              <code className="font-mono whitespace-pre-wrap break-all">
                                {metadataToText(l.metadata) || '—'}
                              </code>
                            </pre>
                          </details>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load more */}
      {hasMore && !loading && actionFilter === 'ALL' && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLimit((n) => Math.min(200, n + 50))}
          >
            <ChevronDown className="size-4" />
            Charger plus
          </Button>
        </div>
      )}
    </div>
  )
}
