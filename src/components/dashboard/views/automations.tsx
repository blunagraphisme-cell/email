'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Mail,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  Workflow,
  Zap,
} from 'lucide-react'

/* ------------------------------- types ------------------------------------ */

type StepType = 'trigger' | 'wait' | 'send'
type WaitUnit = 'minute' | 'hour' | 'day'

interface Step {
  id: string
  type: StepType
  event?: string
  duration?: number
  unit?: WaitUnit
  template?: string
}

interface Automation {
  id: string
  name: string
  status: string // BROUILLON | ACTIF | EN_PAUSE | ARCHIVE
  configuration: Step[]
  executionCount: number
  createdAt: string
  updatedAt: string
}

interface AutomationsResponse {
  automations: Automation[]
}

const TRIGGER_EVENTS = [
  { value: 'NEW_CONTACT', label: 'Nouveau contact' },
  { value: 'NO_OPEN_60D', label: 'Aucune ouverture 60 j' },
  { value: 'TAG_ADDED', label: 'Tag ajouté' },
]

const WAIT_UNITS: { value: WaitUnit; label: string }[] = [
  { value: 'minute', label: 'minutes' },
  { value: 'hour', label: 'heures' },
  { value: 'day', label: 'jours' },
]

const TEMPLATES_MOCK = ['Bienvenue', 'Promo week-end', 'Relance panier', 'Newsletter mensuelle']

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  ACTIF: { label: 'Active', className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700' },
  EN_PAUSE: { label: 'En pause', className: 'border-amber-500/30 bg-amber-500/15 text-amber-700' },
  BROUILLON: { label: 'Brouillon', className: 'border-border bg-muted text-muted-foreground' },
  ARCHIVE: { label: 'Archivée', className: 'border-border bg-muted text-muted-foreground' },
}

/* ------------------------------- main view -------------------------------- */

export default function AutomationsView() {
  const workspace = useAppStore((s) => s.workspace)
  const refreshSession = useAppStore((s) => s.refreshSession)
  const [automations, setAutomations] = React.useState<Automation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<'active' | 'paused'>('active')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Automation | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/automations', { cache: 'no-store' })
      if (res.status === 401) {
        refreshSession()
        return
      }
      const data = (await res.json()) as AutomationsResponse & {
        success?: boolean
        error?: { message?: string }
      }
      if (data.success) {
        setAutomations(data.automations ?? [])
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

  const actives = automations.filter((a) => a.status === 'ACTIF')
  const paused = automations.filter((a) => a.status !== 'ACTIF')
  const shown = tab === 'active' ? actives : paused
  const totalExec = automations.reduce((acc, a) => acc + (a.executionCount ?? 0), 0)

  const onNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const onEdit = (a: Automation) => {
    setEditing(a)
    setDialogOpen(true)
  }
  const onToggle = (a: Automation) => {
    toast.info(
      `Bascule ${a.status === 'ACTIF' ? 'en pause' : 'en actif'} non disponible dans cette démo.`,
      { description: "Aucun endpoint PATCH implémenté côté serveur." }
    )
  }
  const onDelete = (a: Automation) => {
    toast.info('Suppression non disponible dans cette démo.', {
      description: "Aucun endpoint DELETE implémenté côté serveur.",
    })
  }
  const onViewExec = () => {
    toast.info('Historique des exécutions non disponible dans cette démo.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automatisations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mettez votre marketing en pilotage automatique avec des workflows en étapes.
          </p>
        </div>
        <Button size="sm" onClick={onNew}>
          <Plus className="size-4" /> Nouvelle automatisation
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'active' | 'paused')}>
        <TabsList>
          <TabsTrigger value="active">Actives ({actives.length})</TabsTrigger>
          <TabsTrigger value="paused">
            En pause / Brouillons ({paused.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyBlock
          title={
            tab === 'active'
              ? 'Aucune automatisation active'
              : 'Aucune automatisation en pause'
          }
          message="Créez votre première automatisation pour engager vos contacts automatiquement."
          action={
            <Button size="sm" onClick={onNew}>
              <Plus className="size-4" /> Nouvelle automatisation
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <AutomationCard
              key={a.id}
              automation={a}
              onEdit={() => onEdit(a)}
              onToggle={() => onToggle(a)}
              onDelete={() => onDelete(a)}
              onViewExec={onViewExec}
            />
          ))}
        </div>
      )}

      {/* Quota */}
      {workspace?.planCode && (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Exécutions ce mois</p>
            <p className="text-xs text-muted-foreground">
              Plan {workspace.planName ?? workspace.planCode}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">
              {totalExec.toLocaleString('fr-FR')}
            </span>
            <span className="text-sm text-muted-foreground">
              / {workspace.dailyEmailLimit ?? '—'} emails/jour
            </span>
          </div>
        </div>
      )}

      <AutomationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        automation={editing}
        onSaved={() => {
          reload()
          setDialogOpen(false)
        }}
      />
    </div>
  )
}

/* ----------------------------- sub-components ----------------------------- */

function AutomationCard({
  automation,
  onEdit,
  onToggle,
  onDelete,
  onViewExec,
}: {
  automation: Automation
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onViewExec: () => void
}) {
  const s = STATUS_STYLE[automation.status] ?? STATUS_STYLE.BROUILLON
  const isActive = automation.status === 'ACTIF'
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-base">{automation.name}</CardTitle>
              <Badge variant="outline" className={s.className}>
                {s.label}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Mis à jour le {new Date(automation.updatedAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
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
              <DropdownMenuItem onClick={onToggle}>
                {isActive ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {isActive ? 'Mettre en pause' : 'Activer'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" /> Éditer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewExec}>
                <History className="size-4" /> Voir exécutions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="size-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <WorkflowSteps steps={automation.configuration ?? []} />
        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Exécutions:{' '}
            <span className="font-medium text-foreground">
              {automation.executionCount ?? 0}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onToggle}>
              {isActive ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              {isActive ? 'Mettre en pause' : 'Activer'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Pencil className="size-3.5" /> Éditer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowSteps({ steps }: { steps: Step[] }) {
  if (!steps || steps.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        Aucune étape configurée.
      </p>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          {i > 0 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
          <StepPill step={s} />
        </React.Fragment>
      ))}
    </div>
  )
}

function StepPill({ step }: { step: Step }) {
  if (step.type === 'trigger') {
    const ev = TRIGGER_EVENTS.find((e) => e.value === step.event)
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
        <Zap className="size-3.5" />
        Trigger: {ev?.label ?? step.event}
      </span>
    )
  }
  if (step.type === 'wait') {
    const u = WAIT_UNITS.find((x) => x.value === step.unit)
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-700">
        <Clock className="size-3.5" />
        {step.duration} {u?.label ?? ''}
      </span>
    )
  }
  // send
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
      <Mail className="size-3.5" />
      Send: {step.template || '—'}
    </span>
  )
}

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
        <Workflow className="size-6" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ----------------------------- automation dialog -------------------------- */

function AutomationDialog({
  open,
  onOpenChange,
  automation,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  automation: Automation | null
  onSaved: () => void
}) {
  const isEdit = !!automation
  const [name, setName] = React.useState('')
  const [status, setStatus] = React.useState<'BROUILLON' | 'ACTIF' | 'EN_PAUSE'>('BROUILLON')
  const [steps, setSteps] = React.useState<Step[]>([])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    if (automation) {
      setName(automation.name)
      setStatus((automation.status as 'BROUILLON' | 'ACTIF' | 'EN_PAUSE') ?? 'BROUILLON')
      setSteps(automation.configuration ?? [])
    } else {
      setName('')
      setStatus('BROUILLON')
      setSteps([{ id: makeId(), type: 'trigger', event: 'NEW_CONTACT' }])
    }
  }, [open, automation])

  const addStep = (type: StepType) => {
    const base: Step = { id: makeId(), type }
    if (type === 'trigger') base.event = 'NEW_CONTACT'
    if (type === 'wait') {
      base.duration = 1
      base.unit = 'day'
    }
    if (type === 'send') base.template = TEMPLATES_MOCK[0]
    setSteps((s) => [...s, base])
  }

  const updateStep = (id: string, patch: Partial<Step>) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, ...patch } : st)))
  }

  const removeStep = (id: string) => {
    setSteps((s) => s.filter((st) => st.id !== id))
  }

  const moveStep = (idx: number, dir: -1 | 1) => {
    setSteps((s) => {
      const next = [...s]
      const target = idx + dir
      if (target < 0 || target >= next.length) return s
      const tmp = next[idx]
      next[idx] = next[target]
      next[target] = tmp
      return next
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Le nom est requis.')
      return
    }
    if (steps.length === 0) {
      toast.error('Ajoutez au moins une étape.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          status,
          configuration: steps,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(
          isEdit
            ? 'Automatisation enregistrée (nouvelle version créée).'
            : 'Automatisation créée.',
          { description: name.trim() }
        )
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Éditer l\'automatisation' : 'Nouvelle automatisation'}
          </DialogTitle>
          <DialogDescription>
            Composez votre workflow en étapes&nbsp;: déclencheur, attente, envoi.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="a-name">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="a-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bienvenue nouveaux contacts"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-status">Statut</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as 'BROUILLON' | 'ACTIF' | 'EN_PAUSE')
                }
              >
                <SelectTrigger id="a-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BROUILLON">Brouillon</SelectItem>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="EN_PAUSE">En pause</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Étapes du workflow</Label>
              <span className="text-xs text-muted-foreground">
                {steps.length} étape{steps.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  className="space-y-2 rounded-md border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary"
                    >
                      {i + 1}
                    </Badge>
                    <span className="text-xs uppercase text-muted-foreground">
                      {s.type}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => moveStep(i, -1)}
                        disabled={i === 0}
                        aria-label="Monter"
                      >
                        <ChevronUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => moveStep(i, 1)}
                        disabled={i === steps.length - 1}
                        aria-label="Descendre"
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive"
                        onClick={() => removeStep(s.id)}
                        aria-label="Supprimer l'étape"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <StepEditor
                    step={s}
                    onChange={(patch) => updateStep(s.id, patch)}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => addStep('trigger')}>
                <Zap className="size-3.5" /> Déclencheur
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addStep('wait')}>
                <Clock className="size-3.5" /> Attente
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addStep('send')}>
                <Mail className="size-3.5" /> Envoi
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StepEditor({
  step,
  onChange,
}: {
  step: Step
  onChange: (patch: Partial<Step>) => void
}) {
  if (step.type === 'trigger') {
    return (
      <div className="space-y-1">
        <Label className="text-xs">Événement</Label>
        <Select
          value={step.event ?? 'NEW_CONTACT'}
          onValueChange={(v) => onChange({ event: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_EVENTS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  if (step.type === 'wait') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Durée</Label>
          <Input
            type="number"
            min={1}
            value={step.duration ?? 1}
            onChange={(e) => onChange({ duration: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unité</Label>
          <Select
            value={step.unit ?? 'day'}
            onValueChange={(v) => onChange({ unit: v as WaitUnit })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WAIT_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }
  // send
  return (
    <div className="space-y-1">
      <Label className="text-xs">Template</Label>
      <Select
        value={step.template ?? TEMPLATES_MOCK[0]}
        onValueChange={(v) => onChange({ template: v })}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TEMPLATES_MOCK.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/* ----------------------------- helpers ------------------------------------ */

function makeId(): string {
  return `s${Date.now()}_${Math.floor(Math.random() * 1000)}`
}
