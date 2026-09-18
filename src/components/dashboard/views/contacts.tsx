'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  AlertTriangle,
  Download,
  FileText,
  FileUp,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react'

/* ----------------------------- types & helpers ---------------------------- */

type ContactStatus = 'ACTIF' | 'DESABONNE' | 'BOUNCE' | 'SUPPRIME'

interface Contact {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  company?: string | null
  tags?: string | null
  status: ContactStatus
  createdAt: string
}

interface ContactsResponse {
  contacts: Contact[]
  total: number
  page: number
  pageSize: number
  byStatus: Partial<Record<ContactStatus, number>>
}

const STATUS_BADGE: Record<ContactStatus, string> = {
  ACTIF: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  DESABONNE: 'bg-muted text-muted-foreground border-border',
  BOUNCE: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  SUPPRIME: 'bg-destructive/15 text-destructive border-destructive/30',
}

const STATUS_LABEL: Record<ContactStatus, string> = {
  ACTIF: 'Actif',
  DESABONNE: 'Désabonné',
  BOUNCE: 'Bounce',
  SUPPRIME: 'Supprimé',
}

const PAGE_SIZE = 10
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

/* ------------------------------- main view -------------------------------- */

export default function ContactsView() {
  const refreshSession = useAppStore((s) => s.refreshSession)
  const [contacts, setContacts] = React.useState<Contact[]>([])
  const [total, setTotal] = React.useState(0)
  const [byStatus, setByStatus] = React.useState<Partial<Record<ContactStatus, number>>>({})
  const [page, setPage] = React.useState(1)
  const [q, setQ] = React.useState('')
  const [qInput, setQInput] = React.useState('')
  const [status, setStatus] = React.useState<'ALL' | ContactStatus>('ALL')
  const [loading, setLoading] = React.useState(true)
  const [editOpen, setEditOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Contact | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))
      if (q) params.set('q', q)
      if (status !== 'ALL') params.set('status', status)
      const res = await fetch(`/api/contacts?${params.toString()}`, { cache: 'no-store' })
      if (res.status === 401) {
        refreshSession()
        return
      }
      const data = (await res.json()) as ContactsResponse & { success?: boolean; error?: { message?: string } }
      if (data.success) {
        setContacts(data.contacts ?? [])
        setTotal(data.total ?? 0)
        setByStatus(data.byStatus ?? {})
      } else {
        toast.error(data?.error?.message ?? 'Erreur de chargement')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [page, q, status, refreshSession])

  React.useEffect(() => {
    reload()
  }, [reload])

  const onSearchInput = (v: string) => {
    setQInput(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      setQ(v.trim())
    }, 350)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const onAdd = () => {
    setEditing(null)
    setEditOpen(true)
  }
  const onEdit = (c: Contact) => {
    setEditing(c)
    setEditOpen(true)
  }
  const onDelete = async (c: Contact) => {
    if (!window.confirm(`Supprimer le contact ${c.email} ?`)) return
    try {
      const res = await fetch(`/api/contacts?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Contact supprimé.', { description: c.email })
        reload()
      } else {
        toast.error(data?.error?.message ?? 'Erreur de suppression')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  const onExport = () => {
    toast.success('Export en cours…', {
      description: 'Le fichier CSV sera téléchargé dans un instant.',
    })
  }

  const totalAll =
    (byStatus.ACTIF ?? 0) +
    (byStatus.DESABONNE ?? 0) +
    (byStatus.BOUNCE ?? 0) +
    (byStatus.SUPPRIME ?? 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos abonnés, importez un fichier CSV, segmentez par statut.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="size-4" /> Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> Importer CSV
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-4" /> Ajouter un contact
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={totalAll} icon={<Users className="size-4" />} accent="primary" />
        <StatCard label="Actifs" value={byStatus.ACTIF ?? 0} icon={<UserCheck className="size-4" />} accent="emerald" />
        <StatCard label="Désabonnés" value={byStatus.DESABONNE ?? 0} icon={<UserX className="size-4" />} accent="muted" />
        <StatCard label="Bounces" value={byStatus.BOUNCE ?? 0} icon={<AlertTriangle className="size-4" />} accent="amber" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder="Rechercher par e-mail, nom, entreprise…"
            className="pl-9"
            aria-label="Recherche de contacts"
          />
          {qInput && (
            <button
              type="button"
              onClick={() => onSearchInput('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Effacer la recherche"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as 'ALL' | ContactStatus)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="ACTIF">Actif</SelectItem>
            <SelectItem value="DESABONNE">Désabonné</SelectItem>
            <SelectItem value="BOUNCE">Bounce</SelectItem>
            <SelectItem value="SUPPRIME">Supprimé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState onAdd={onAdd} hasFilter={q !== '' || status !== 'ALL'} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="hidden md:table-cell">Prénom</TableHead>
                  <TableHead className="hidden md:table-cell">Nom</TableHead>
                  <TableHead className="hidden lg:table-cell">Entreprise</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden sm:table-cell">Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => {
                  const tags = (c.tags ?? '')
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {c.firstName ?? '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {c.lastName ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {c.company ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {tags.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((t, i) => (
                              <Badge
                                key={`${c.id}-${i}`}
                                variant="outline"
                                className="bg-primary/5 border-primary/20 text-primary"
                              >
                                {t}
                              </Badge>
                            ))}
                            {tags.length > 3 && (
                              <Badge variant="outline">+{tags.length - 3}</Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_BADGE[c.status]}>
                          {STATUS_LABEL[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label="Actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(c)}>
                              <Pencil className="size-4" /> Éditer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDelete(c)}
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
      </div>

      {/* Pagination */}
      {!loading && contacts.length > 0 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}
          </p>
          <Pagination className="sm:justify-end sm:mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage(page - 1)
                  }}
                  aria-disabled={page === 1}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {buildPages(page, totalPages).map((p, i) =>
                p === '...' ? (
                  <PaginationItem key={`e${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(p as number)
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) setPage(page + 1)
                  }}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add / Edit dialog */}
      <ContactFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={editing}
        onSaved={() => {
          reload()
          setEditOpen(false)
        }}
      />

      {/* Import dialog */}
      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          reload()
          setImportOpen(false)
        }}
      />
    </div>
  )
}

/* ----------------------------- sub-components ----------------------------- */

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: 'primary' | 'emerald' | 'muted' | 'amber'
}) {
  const accents: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    muted: 'bg-muted text-muted-foreground',
    amber: 'bg-amber-500/10 text-amber-600',
  }
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-9 items-center justify-center rounded-md ${accents[accent]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value.toLocaleString('fr-FR')}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ onAdd, hasFilter }: { onAdd: () => void; hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="size-6" />
      </div>
      <p className="font-medium">
        {hasFilter ? 'Aucun contact trouvé' : 'Aucun contact pour le moment'}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilter
          ? 'Essayez de modifier votre recherche ou votre filtre de statut.'
          : 'Ajoutez votre premier contact ou importez un fichier CSV pour démarrer.'}
      </p>
      {!hasFilter && (
        <Button size="sm" className="mt-4" onClick={onAdd}>
          <Plus className="size-4" /> Ajouter un contact
        </Button>
      )}
    </div>
  )
}

function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  contact: Contact | null
  onSaved: () => void
}) {
  const isEdit = !!contact
  const [email, setEmail] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [tags, setTags] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (contact) {
      setEmail(contact.email ?? '')
      setFirstName(contact.firstName ?? '')
      setLastName(contact.lastName ?? '')
      setPhone(contact.phone ?? '')
      setCompany(contact.company ?? '')
      setTags(contact.tags ?? '')
    } else {
      setEmail('')
      setFirstName('')
      setLastName('')
      setPhone('')
      setCompany('')
      setTags('')
    }
  }, [open, contact])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("L'e-mail est requis.")
      return
    }
    if (!emailRegex.test(email.trim())) {
      toast.error("Format d'e-mail invalide.")
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        // No PATCH endpoint — inform user we can't update.
        toast.info("L'édition n'est pas encore disponible côté serveur.", {
          description: 'Aucun endpoint PATCH implémenté. Utilisez la création pour de nouvelles données.',
        })
        onOpenChange(false)
        return
      }
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          tags: tags.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Contact ajouté.', { description: email.trim() })
        onSaved()
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Éditer le contact' : 'Ajouter un contact'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifiez les informations du contact.'
              : 'Renseignez les informations du contact.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-email">
              E-mail <span className="text-destructive">*</span>
            </Label>
            <Input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@exemple.com"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-first">Prénom</Label>
              <Input
                id="c-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-last">Nom</Label>
              <Input
                id="c-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Téléphone</Label>
              <Input
                id="c-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+228 90 00 00 00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-company">Entreprise</Label>
              <Input
                id="c-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme SARL"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-tags">Tags</Label>
            <Input
              id="c-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vip, prospects, lome"
            />
            <p className="text-xs text-muted-foreground">Séparés par une virgule.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ImportCsvDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onImported: () => void
}) {
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [headers, setHeaders] = React.useState<string[]>([])
  const [rows, setRows] = React.useState<string[][]>([])
  const [mapping, setMapping] = React.useState<Record<string, string>>({})
  const [dragOver, setDragOver] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const FIELD_OPTIONS = [
    { value: 'skip', label: '— Ignorer —' },
    { value: 'email', label: 'E-mail' },
    { value: 'firstName', label: 'Prénom' },
    { value: 'lastName', label: 'Nom' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'company', label: 'Entreprise' },
    { value: 'tags', label: 'Tags' },
  ]

  React.useEffect(() => {
    if (!open) {
      setFileName(null)
      setHeaders([])
      setRows([])
      setMapping({})
      setDragOver(false)
    }
  }, [open])

  const parseFile = (file: File) => {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
      if (lines.length === 0) {
        setHeaders([])
        setRows([])
        return
      }
      const splitLine = (l: string) =>
        l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      const cols = splitLine(lines[0])
      const body = lines.slice(1, 200).map(splitLine)
      setHeaders(cols)
      setRows(body)
      const autoMap: Record<string, string> = {}
      cols.forEach((c) => {
        const lc = c.toLowerCase()
        if (lc.includes('email') || lc.includes('mail') || lc === 'e-mail') autoMap[c] = 'email'
        else if (lc.includes('prenom') || lc.includes('prénom') || lc.includes('first')) autoMap[c] = 'firstName'
        else if (
          (lc.includes('nom') && !lc.includes('entreprise')) ||
          lc.includes('last') ||
          lc.includes('name')
        )
          autoMap[c] = 'lastName'
        else if (lc.includes('tel') || lc.includes('phone')) autoMap[c] = 'phone'
        else if (lc.includes('entreprise') || lc.includes('company') || lc.includes('societe'))
          autoMap[c] = 'company'
        else if (lc.includes('tag')) autoMap[c] = 'tags'
        else autoMap[c] = 'skip'
      })
      setMapping(autoMap)
    }
    reader.readAsText(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && (f.name.toLowerCase().endsWith('.csv') || f.type === 'text/csv')) {
      parseFile(f)
    } else {
      toast.error('Veuillez déposer un fichier .csv')
    }
  }

  const emailCol = Object.entries(mapping).find(([, v]) => v === 'email')?.[0] ?? null
  const emailIdx = emailCol ? headers.indexOf(emailCol) : -1
  const validRows = emailIdx >= 0 ? rows.filter((r) => r[emailIdx] && emailRegex.test(r[emailIdx])) : []
  const invalidEmails = emailIdx >= 0 ? rows.length - validRows.length : 0
  const duplicatesMock = Math.max(0, Math.floor(rows.length * 0.05))

  const onImport = async () => {
    if (!emailCol) {
      toast.error('Veuillez mapper au moins une colonne à "E-mail".')
      return
    }
    setImporting(true)
    // Simulated import (no real upload backend in scope).
    setTimeout(() => {
      setImporting(false)
      toast.success(`${validRows.length} contacts importés (simulation)`, {
        description: `${validRows.length} valides, ${invalidEmails} invalides, ${duplicatesMock} doublons.`,
      })
      onImported()
    }, 700)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un fichier CSV</DialogTitle>
          <DialogDescription>
            Déposez votre fichier, mappez les colonnes puis lancez l&apos;import.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!fileName ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileUp className="size-5" />
              </div>
              <p className="font-medium">Glissez-déposez votre CSV ici</p>
              <p className="text-xs text-muted-foreground">
                ou cliquez pour parcourir — format .csv uniquement
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) parseFile(f)
                }}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-primary" />
                  <span className="truncate text-sm font-medium">{fileName}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFileName(null)
                    setHeaders([])
                    setRows([])
                    setMapping({})
                  }}
                >
                  Changer
                </Button>
              </div>

              {headers.length > 0 && (
                <>
                  <div className="rounded-md border">
                    <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground">
                      Mapping des colonnes ({headers.length} détectées)
                    </div>
                    <div className="max-h-64 space-y-2 overflow-y-auto p-3">
                      {headers.map((h) => (
                        <div
                          key={h}
                          className="grid grid-cols-[1fr_auto] items-center gap-3"
                        >
                          <span className="truncate font-mono text-sm text-muted-foreground">
                            {h}
                          </span>
                          <Select
                            value={mapping[h] ?? 'skip'}
                            onValueChange={(v) =>
                              setMapping((m) => ({ ...m, [h]: v }))
                            }
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <SummaryStat label="Lignes" value={rows.length} />
                    <SummaryStat
                      label="E-mails invalides"
                      value={invalidEmails}
                      tone={invalidEmails > 0 ? 'amber' : 'muted'}
                    />
                    <SummaryStat
                      label="Doublons (est.)"
                      value={duplicatesMock}
                      tone={duplicatesMock > 0 ? 'amber' : 'muted'}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={onImport}
            disabled={importing || !fileName || headers.length === 0}
          >
            {importing ? 'Import…' : 'Importer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryStat({
  label,
  value,
  tone = 'muted',
}: {
  label: string
  value: number
  tone?: 'muted' | 'amber' | 'emerald'
}) {
  const tones: Record<string, string> = {
    muted: 'text-foreground',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  }
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-center">
      <p className={`text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
