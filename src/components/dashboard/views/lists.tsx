'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Filter,
  ListTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'

/* ------------------------------- types ------------------------------------ */

interface SegmentEntry {
  id: string
  name: string
  ruleType?: string | null
  ruleValue?: string | null
  listId?: string | null
}

interface ListEntry {
  id: string
  name: string
  description?: string | null
  color?: string | null
  segments?: SegmentEntry[]
  createdAt: string
}

interface ListsResponse {
  lists: ListEntry[]
  segments: SegmentEntry[]
}

const RULE_TYPES = [
  { value: 'TAG', label: 'Tag' },
  { value: 'STATUS', label: 'Statut' },
  { value: 'DATE', label: "Date d'inscription" },
  { value: 'ACTIVITY', label: 'Activité' },
  { value: 'CAMPAIGN', label: 'Campagne' },
  { value: 'OPEN', label: 'Ouverture' },
  { value: 'CLICK', label: 'Clic' },
]

const PRESET_COLORS = [
  '#000000', // black
  '#1f2937', // gray-800
  '#374151', // gray-700
  '#6b7280', // gray-500
  '#9ca3af', // gray-400
  '#d1d5db', // gray-300
  '#e5e7eb', // gray-200
]

const RULE_LABELS: Record<string, string> = Object.fromEntries(
  RULE_TYPES.map((r) => [r.value, r.label])
)

/* ------------------------------- main view -------------------------------- */

export default function ListsView() {
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)
  const [lists, setLists] = React.useState<ListEntry[]>([])
  const [segments, setSegments] = React.useState<SegmentEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [listDialogOpen, setListDialogOpen] = React.useState(false)
  const [segmentDialogOpen, setSegmentDialogOpen] = React.useState(false)

  const reload = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/lists', { cache: 'no-store' })
      if (res.status === 401) {
        refreshSession()
        return
      }
      const data = (await res.json()) as ListsResponse & {
        success?: boolean
        error?: { message?: string }
      }
      if (data.success) {
        setLists(data.lists ?? [])
        setSegments(data.segments ?? [])
      } else {
        toast.error(data?.error?.message ?? 'Erreur de chargement')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [refreshSession])

  React.useEffect(() => {
    reload()
  }, [reload])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Listes &amp; Segments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Regroupez vos contacts en listes, ou segmentez-les dynamiquement par règles.
          </p>
        </div>
      </div>

      <Tabs defaultValue="lists" className="w-full">
        <TabsList>
          <TabsTrigger value="lists">
            <ListTree className="size-4" /> Listes
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Filter className="size-4" /> Segments
          </TabsTrigger>
        </TabsList>

        {/* LISTES */}
        <TabsContent value="lists" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {lists.length} liste{lists.length > 1 ? 's' : ''}
            </p>
            <Button size="sm" onClick={() => setListDialogOpen(true)}>
              <Plus className="size-4" /> Créer une liste
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <EmptyBlock
              title="Aucune liste"
              message="Créez votre première liste pour organiser vos contacts."
              action={
                <Button size="sm" onClick={() => setListDialogOpen(true)}>
                  <Plus className="size-4" /> Créer une liste
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((l) => {
                const segCount = l.segments?.length ?? 0
                const color = l.color || PRESET_COLORS[0]
                return (
                  <Card key={l.id} className="flex flex-col overflow-hidden">
                    <div className="h-1.5" style={{ backgroundColor: color }} />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{l.name}</CardTitle>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {l.description || 'Aucune description'}
                          </p>
                        </div>
                        <span
                          className="mt-1 size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-primary"
                        >
                          {segCount} segment{segCount > 1 ? 's' : ''}
                        </Badge>
                        <span>· {new Date(l.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setView('contacts')}>
                          <Users className="size-3.5" /> Voir contacts
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toast.info('Édition non disponible dans cette démo.', {
                              description: "Aucun endpoint PATCH implémenté côté serveur.",
                            })
                          }
                        >
                          <Pencil className="size-3.5" /> Éditer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() =>
                            toast.info('Suppression non disponible dans cette démo.', {
                              description: "Aucun endpoint DELETE implémenté côté serveur.",
                            })
                          }
                        >
                          <Trash2 className="size-3.5" /> Supprimer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* SEGMENTS */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {segments.length} segment{segments.length > 1 ? 's' : ''}
            </p>
            <Button size="sm" onClick={() => setSegmentDialogOpen(true)}>
              <Plus className="size-4" /> Créer un segment
            </Button>
          </div>
          {loading ? (
            <div className="space-y-2 rounded-lg border bg-card p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : segments.length === 0 ? (
            <EmptyBlock
              title="Aucun segment"
              message="Créez un segment dynamique pour cibler vos contacts par règle."
              action={
                <Button size="sm" onClick={() => setSegmentDialogOpen(true)}>
                  <Plus className="size-4" /> Créer un segment
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Règle</TableHead>
                    <TableHead>Liste associée</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((s) => {
                    const parent = lists.find((l) => l.id === s.listId)
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge
                              variant="outline"
                              className="border-primary/20 bg-primary/5 text-primary"
                            >
                              {RULE_LABELS[s.ruleType ?? ''] ?? s.ruleType ?? '—'}
                            </Badge>
                            <span className="text-muted-foreground">
                              {s.ruleValue || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {parent ? (
                            <span className="inline-flex items-center gap-2 text-sm">
                              <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: parent.color || PRESET_COLORS[0] }}
                              />
                              {parent.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.info('Édition non disponible dans cette démo.', {
                                    description: "Aucun endpoint PATCH implémenté côté serveur.",
                                  })
                                }
                              >
                                <Pencil className="size-4" /> Éditer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  toast.info('Suppression non disponible dans cette démo.', {
                                    description: "Aucun endpoint DELETE implémenté côté serveur.",
                                  })
                                }
                              >
                                <Trash2 className="size-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onCreated={() => {
          reload()
          setListDialogOpen(false)
        }}
      />
      <CreateSegmentDialog
        open={segmentDialogOpen}
        onOpenChange={setSegmentDialogOpen}
        lists={lists}
        onCreated={() => {
          reload()
          setSegmentDialogOpen(false)
        }}
      />
    </div>
  )
}

/* ----------------------------- sub-components ----------------------------- */

function EmptyBlock({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-4 py-14 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ListTree className="size-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function CreateListDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [color, setColor] = React.useState(PRESET_COLORS[0])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setColor(PRESET_COLORS[0])
    }
  }, [open])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Le nom est requis.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Liste créée.', { description: name.trim() })
        onCreated()
      } else {
        toast.error(data?.error?.message ?? 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une liste</DialogTitle>
          <DialogDescription>Regroupez des contacts pour vos campagnes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="l-name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="l-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Newsletter VIP"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="l-desc">Description</Label>
            <Textarea
              id="l-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contacts VIP intéressés par l'offre d'été"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Couleur</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`size-7 rounded-full border-2 transition ${
                    color === c ? 'border-foreground' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Couleur ${c}`}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Création…' : 'Créer la liste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateSegmentDialog({
  open,
  onOpenChange,
  lists,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  lists: ListEntry[]
  onCreated: () => void
}) {
  const [name, setName] = React.useState('')
  const [ruleType, setRuleType] = React.useState(RULE_TYPES[0].value)
  const [ruleValue, setRuleValue] = React.useState('')
  const [listId, setListId] = React.useState<string>('none')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setName('')
      setRuleType(RULE_TYPES[0].value)
      setRuleValue('')
      setListId('none')
    }
  }, [open])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Le nom est requis.')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, string | undefined> = {
        kind: 'segment',
        name: name.trim(),
        ruleType,
        ruleValue: ruleValue.trim() || undefined,
      }
      if (listId !== 'none') payload.listId = listId
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Segment créé.', { description: name.trim() })
        onCreated()
      } else {
        toast.error(data?.error?.message ?? 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un segment</DialogTitle>
          <DialogDescription>
            Les segments ciblent dynamiquement des contacts selon une règle.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bounced 30 derniers jours"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="s-rt">Type de règle</Label>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger id="s-rt" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-rv">Valeur de la règle</Label>
              <Input
                id="s-rv"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                placeholder="vip, ACTIF, 30, ..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-list">Liste associée (optionnel)</Label>
            <Select value={listId} onValueChange={setListId}>
              <SelectTrigger id="s-list" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Aucune —</SelectItem>
                {lists.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Création…' : 'Créer le segment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
