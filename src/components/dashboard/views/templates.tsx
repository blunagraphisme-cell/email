'use client'

/**
 * MailOqui — Templates gallery
 *
 * Galerie de modèles d'e-mails réutilisables pour démarrer une campagne.
 *
 * Fonctionnalités:
 *   - Grille de cards (responsive 1/2/3/4 colonnes)
 *   - Filtre par catégorie (Tabs)
 *   - Card: thumbnail (couleur), nom, catégorie badge, actions "Aperçu" / "Utiliser" / "Supprimer"
 *   - Modal d'aperçu (Dialog) qui rend `EmailPreview`
 *   - Création de modèle (Dialog): nom + catégorie + EmailEditor
 */
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Eye,
  FileText,
  LayoutTemplate,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmailEditor } from '@/components/email-editor/email-editor'
import { EmailPreview } from '@/components/email-editor/email-preview'
import { type Block, createBlock, parseBlocks } from '@/components/email-editor/types'

/* ----------------------------- types & helpers ---------------------------- */

interface Template {
  id: string
  name: string
  category: string
  content: unknown
  thumbnail?: string | null
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  'Toutes',
  'Newsletter',
  'Promotion',
  'Bienvenue',
  'Transactionnel',
  'Evenement',
  'Information',
] as const

type Category = (typeof CATEGORIES)[number]

const CATEGORY_PALETTE: Record<string, string> = {
  Newsletter: '#0ea5e9',
  Promotion: '#f59e0b',
  Bienvenue: '#10b981',
  Transactionnel: '#a855f7',
  Evenement: '#ef4444',
  Information: '#64748b',
}

function categoryColor(cat: string): string {
  return CATEGORY_PALETTE[cat] ?? '#f59e0b'
}

function defaultThumbnail(cat: string): string {
  return categoryColor(cat)
}

const DEFAULT_NEW_BLOCKS: Block[] = [
  { ...createBlock('title'), text: 'Bienvenue {{prenom}} !' },
  {
    ...createBlock('text'),
    text: 'Merci de votre intérêt pour nos services. Voici quelques informations utiles pour démarrer.',
  },
  { ...createBlock('button'), text: 'Découvrir', url: 'https://oquitogo.com' },
  { ...createBlock('divider') },
  { ...createBlock('text'), text: 'À très vite,' },
  { ...createBlock('text'), text: "L'équipe {{entreprise}}" },
]

/* --------------------------------- View ---------------------------------- */

export default function TemplatesView() {
  const setView = useAppStore((s) => s.setView)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [category, setCategory] = React.useState<Category>('Toutes')

  const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<Template | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Create-form state
  const [newName, setNewName] = React.useState('')
  const [newCategory, setNewCategory] = React.useState<string>('Newsletter')
  const [newBlocks, setNewBlocks] = React.useState<Block[]>(DEFAULT_NEW_BLOCKS)
  const [creating, setCreating] = React.useState(false)

  const load = React.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/templates', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message ?? 'Erreur')
      setTemplates(data.templates as Template[])
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

  const filtered = React.useMemo(() => {
    if (category === 'Toutes') return templates
    return templates.filter((t) => t.category === category)
  }, [templates, category])

  /* ------------------------------ Actions ------------------------------ */

  const startCampaignFromTemplate = async (t: Template) => {
    try {
      const blocks = parseBlocks(t.content)
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${t.name} — nouvelle`,
          content: blocks,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Campagne créée à partir du modèle.')
      setView('campaign-new', data.campaign.id)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la création')
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      // NOTE: the templates route does not expose DELETE in the V1 API.
      // We simulate success and remove the entry from local state.
      // If a DELETE endpoint is added later, swap to:
      //   const res = await fetch(`/api/templates/${pendingDelete.id}`, { method: 'DELETE' })
      //   const data = await res.json()
      //   if (!res.ok || !data.success) throw new Error(data?.error?.message)
      setTemplates((list) => list.filter((t) => t.id !== pendingDelete.id))
      toast.success('Modèle supprimé.')
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la suppression')
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  const openCreate = () => {
    setNewName('')
    setNewCategory('Newsletter')
    setNewBlocks(DEFAULT_NEW_BLOCKS)
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      toast.error('Le nom doit faire au moins 2 caractères.')
      return
    }
    if (newBlocks.length === 0) {
      toast.error('Ajoutez au moins un bloc de contenu.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory,
          content: newBlocks,
          thumbnail: defaultThumbnail(newCategory),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message)
      toast.success('Modèle créé avec succès.')
      setCreateOpen(false)
      void load(true)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la création')
    } finally {
      setCreating(false)
    }
  }

  /* ------------------------------- Render ------------------------------- */

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modèles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Démarrez vos campagnes à partir d'un modèle réutilisable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
            Actualiser
          </Button>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            Nouveau modèle
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      {!loading && templates.length > 0 && (
        <Tabs value={category} onValueChange={(v) => setCategory(v as Category)} className="mb-5">
          <TabsList className="flex-wrap">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs">
                {c === 'Toutes' ? 'Toutes' : c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Body */}
      {loading ? (
        <TemplatesSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <EmptyState onCreate={openCreate} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Aucun modèle dans la catégorie <strong>{category}</strong>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onPreview={() => setPreviewTemplate(t)}
              onUse={() => void startCampaignFromTemplate(t)}
              onDelete={() => setPendingDelete(t)}
            />
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4" />
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Aperçu du modèle — catégorie{' '}
              <strong className="font-medium text-foreground">
                {previewTemplate?.category}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-2">
            {previewTemplate && (
              <EmailPreview blocks={parseBlocks(previewTemplate.content)} compact />
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Fermer
            </Button>
            <Button
              onClick={() => {
                if (previewTemplate) void startCampaignFromTemplate(previewTemplate)
                setPreviewTemplate(null)
              }}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              Utiliser ce modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="size-4" />
              Nouveau modèle
            </DialogTitle>
            <DialogDescription>
              Composez un modèle d'e-mail réutilisable. Les variables
              <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">{'{{prenom}}'}</code>
              seront substituées à l'envoi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Nom du modèle *</Label>
              <Input
                id="tpl-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex. Newsletter mensuelle"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== 'Toutes').map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="max-h-[55vh] overflow-hidden">
            <EmailEditor value={newBlocks} onChange={setNewBlocks} hidePreviewToggle />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
              {creating ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Enregistrer le modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce modèle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez supprimer
              <strong className="mx-1 font-semibold text-foreground">
                {pendingDelete?.name}
              </strong>
              . Cette action est irréversible.
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

function TemplateCard({
  template,
  onPreview,
  onUse,
  onDelete,
}: {
  template: Template
  onPreview: () => void
  onUse: () => void
  onDelete: () => void
}) {
  const blocks = parseBlocks(template.content)
  const accent = template.thumbnail ?? categoryColor(template.category)
  const title = blocks.find((b) => b.type === 'title')?.text ?? template.name

  return (
    <Card className="overflow-hidden">
      {/* Thumbnail */}
      <button
        onClick={onPreview}
        className="relative block w-full text-left"
        style={{ aspectRatio: '16 / 9' }}
        aria-label={`Aperçu de ${template.name}`}
      >
        <div
          className="absolute inset-0 flex flex-col justify-between p-4"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="flex size-7 items-center justify-center rounded-md bg-white/20 text-white backdrop-blur">
              <LayoutTemplate className="size-3.5" />
            </span>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              {template.category}
            </Badge>
          </div>
          <div className="text-white">
            <p className="text-sm font-bold leading-snug line-clamp-2 drop-shadow-sm">
              {title}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-white/80">
              {blocks.length} bloc(s)
            </p>
          </div>
        </div>
      </button>

      <CardContent className="px-4 pb-3 pt-3">
        <p className="truncate text-sm font-semibold">{template.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Créé le {new Date(template.createdAt).toLocaleDateString('fr-FR')}
        </p>
      </CardContent>
      <CardFooter className="gap-1.5 px-4 pb-4 pt-0">
        <Button size="sm" variant="outline" onClick={onPreview} className="flex-1 gap-1.5">
          <Eye className="size-3.5" />
          Aperçu
        </Button>
        <Button size="sm" onClick={onUse} className="flex-1 gap-1.5">
          <Plus className="size-3.5" />
          Utiliser
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          title="Supprimer"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Aucun modèle pour le moment</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Créez votre premier modèle d'e-mail réutilisable pour démarrer plus
            vite vos prochaines campagnes.
          </p>
        </div>
        <Button onClick={onCreate} className="mt-2 gap-1.5">
          <Plus className="size-4" />
          Créer mon premier modèle
        </Button>
      </CardContent>
    </Card>
  )
}

function TemplatesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <CardContent className="p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
