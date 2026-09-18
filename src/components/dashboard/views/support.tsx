'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LifeBuoy,
  Plus,
  Mail,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

/* --------------------------------- types --------------------------------- */

interface Ticket {
  id: string
  subject: string
  category: string // TECHNIQUE | FACTURATION | COMPTE | AUTRE
  priority: string // BASSE | NORMALE | HAUTE | URGENTE
  status: string // OUVERT | EN_COURS | RESOLU | FERME
  message: string
  createdAt: string
  updatedAt: string
}

/* --------------------------------- meta ---------------------------------- */

const CATEGORY_META: Record<string, { label: string; cls: string }> = {
  TECHNIQUE: {
    label: 'Technique',
    cls: 'border-foreground/30 bg-foreground/10 text-foreground',
  },
  FACTURATION: {
    label: 'Facturation',
    cls: 'border-foreground/20 bg-muted text-muted-foreground',
  },
  COMPTE: {
    label: 'Compte',
    cls: 'border-foreground/30 bg-foreground/10 text-foreground',
  },
  AUTRE: {
    label: 'Autre',
    cls: 'border-border bg-muted text-muted-foreground',
  },
}

const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  BASSE: { label: 'Basse', cls: 'border-border bg-muted text-muted-foreground' },
  NORMALE: {
    label: 'Normale',
    cls: 'border-foreground/30 bg-foreground/10 text-foreground',
  },
  HAUTE: {
    label: 'Haute',
    cls: 'border-foreground/20 bg-muted text-muted-foreground',
  },
  URGENTE: { label: 'Urgente', cls: 'border-destructive/30 bg-destructive/10 text-destructive' },
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  OUVERT: {
    label: 'Ouvert',
    cls: 'border-foreground/20 bg-muted text-muted-foreground',
  },
  EN_COURS: {
    label: 'En cours',
    cls: 'border-foreground/20 bg-muted text-muted-foreground',
  },
  RESOLU: {
    label: 'Résolu',
    cls: 'border-foreground/30 bg-foreground/10 text-foreground',
  },
  FERME: { label: 'Fermé', cls: 'border-border bg-muted text-muted-foreground' },
}

function badge(meta: Record<string, { label: string; cls: string }>, key: string) {
  const m = meta[key] ?? { label: key, cls: 'border-border bg-muted text-muted-foreground' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>
      {m.label}
    </span>
  )
}

function fmt(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

/* --------------------------------- View ---------------------------------- */

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tous' },
  { key: 'OUVERT', label: 'Ouverts' },
  { key: 'EN_COURS', label: 'En cours' },
  { key: 'RESOLU', label: 'Résolus' },
  { key: 'FERME', label: 'Fermés' },
]

export default function SupportView() {
  const user = useAppStore((s) => s.user)
  const [loading, setLoading] = React.useState(true)
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [statusFilter, setStatusFilter] = React.useState('ALL')

  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({
    subject: '',
    category: 'TECHNIQUE',
    priority: 'NORMALE',
    message: '',
  })

  const [detail, setDetail] = React.useState<Ticket | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setTickets(Array.isArray(data?.tickets) ? data.tickets : [])
      } else {
        setTickets([])
      }
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setForm({ subject: '', category: 'TECHNIQUE', priority: 'NORMALE', message: '' })
    setCreateOpen(true)
  }

  const submitCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Sujet et message sont requis.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data?.ticket) {
        toast.success('Ticket créé. Notre équipe vous répondra sous 24h.')
        setCreateOpen(false)
        await load()
      } else {
        toast.error(data?.message ?? 'Erreur lors de la création.')
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setCreating(false)
    }
  }

  const filtered = React.useMemo(() => {
    if (statusFilter === 'ALL') return tickets
    return tickets.filter((t) => t.status === statusFilter)
  }, [tickets, statusFilter])

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <LifeBuoy className="size-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Support</h1>
            <p className="text-xs text-muted-foreground">
              Besoin d&apos;aide ? Notre équipe répond sous 24h.
            </p>
          </div>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Nouveau ticket
        </Button>
      </header>

      {/* Filters */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/20 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LifeBuoy className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {statusFilter === 'ALL' ? 'Aucun ticket' : `Aucun ticket ${STATUS_META[statusFilter]?.label?.toLowerCase() ?? ''}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Ouvrez un ticket pour signaler un problème ou poser une question.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Ouvrir un ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetail(t)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setDetail(t)
                }
              }}
              className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{t.subject}</h3>
                    {badge(CATEGORY_META, t.category)}
                    {badge(PRIORITY_META, t.priority)}
                    {badge(STATUS_META, t.status)}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{t.message}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground sm:min-w-[160px]">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Créé {fmt(t.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3" />
                    MAJ {fmt(t.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-primary" />
              Nouveau ticket de support
            </DialogTitle>
            <DialogDescription>
              Décrivez votre demande. Notre équipe vous répondra par e-mail sous 24h.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-subject" className="text-xs">Sujet</Label>
              <Input
                id="ticket-subject"
                placeholder="Ex: Problème d'envoi d'une campagne"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                disabled={creating}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ticket-cat" className="text-xs">Catégorie</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  disabled={creating}
                >
                  <SelectTrigger id="ticket-cat" className="w-full">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNIQUE">Technique</SelectItem>
                    <SelectItem value="FACTURATION">Facturation</SelectItem>
                    <SelectItem value="COMPTE">Compte</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ticket-prio" className="text-xs">Priorité</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                  disabled={creating}
                >
                  <SelectTrigger id="ticket-prio" className="w-full">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASSE">Basse</SelectItem>
                    <SelectItem value="NORMALE">Normale</SelectItem>
                    <SelectItem value="HAUTE">Haute</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ticket-msg" className="text-xs">Message</Label>
              <Textarea
                id="ticket-msg"
                placeholder="Décrivez votre problème en détail…"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                disabled={creating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button type="button" onClick={submitCreate} disabled={creating}>
              {creating ? 'Envoi…' : 'Envoyer le ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  {badge(CATEGORY_META, detail.category)}
                  {badge(PRIORITY_META, detail.priority)}
                  {badge(STATUS_META, detail.status)}
                </div>
                <DialogTitle className="text-base">{detail.subject}</DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Clock className="size-3" />
                  Ouvert {fmt(detail.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-md border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium">
                      {user?.firstName ?? 'Vous'}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{fmt(detail.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{detail.message}</p>
                </div>

                {/* Simulated support reply */}
                <div className="rounded-md border border-foreground/30 bg-foreground/5 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-foreground/15 text-foreground">
                      <CheckCircle2 className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium">Support EmailOqui</span>
                    <span className="text-[11px] text-muted-foreground">{fmt(detail.updatedAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">
                    Bonjour,
                    <br />
                    Nous avons bien reçu votre demande. Notre équipe technique analyse le problème
                    et revient vers vous dans les plus brefs délais. Merci de votre patience.
                    <br />
                    — L&apos;équipe EmailOqui
                  </p>
                </div>

                {detail.status === 'FERME' && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <XCircle className="size-3.5" />
                    Ce ticket est fermé. Pour rouvrir, créez un nouveau ticket en référençant celui-ci.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDetail(null)}>
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
