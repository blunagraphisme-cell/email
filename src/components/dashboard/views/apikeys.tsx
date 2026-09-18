'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  ShieldAlert,
  ShieldCheck,
  Code2,
} from 'lucide-react'

/* --------------------------------- types --------------------------------- */

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  status: string // ACTIF | REVOQUE
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

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
    })
  } catch {
    return '—'
  }
}

async function copy(text: string, msg?: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(msg ?? 'Clé copiée dans le presse-papiers.')
  } catch {
    toast.error('Impossible de copier.')
  }
}

/* ------------------------------ API doc panel ----------------------------- */

function ApiDocCard() {
  const examples: { title: string; method: string; path: string; code: string }[] = [
    {
      title: 'Lister les campagnes',
      method: 'GET',
      path: '/api/v1/campaigns',
      code: `curl https://email.oquitogo.online/api/v1/campaigns \\
  -H "Authorization: Bearer moq_live_xxxx"`,
    },
    {
      title: 'Importer des contacts',
      method: 'POST',
      path: '/api/v1/contacts',
      code: `curl https://email.oquitogo.online/api/v1/contacts \\
  -H "Authorization: Bearer moq_live_xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"contact@exemple.com","firstName":"Awa"}'`,
    },
    {
      title: 'Récupérer les analytics',
      method: 'GET',
      path: '/api/v1/analytics',
      code: `curl https://email.oquitogo.online/api/v1/analytics?days=30 \\
  -H "Authorization: Bearer moq_live_xxxx"`,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="size-4 text-primary" />
          Documentation API
        </CardTitle>
        <CardDescription>
          Intégrez EmailOqui à vos applications. Toutes les requêtes doivent inclure l&apos;en-tête
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">Authorization: Bearer &lt;votre_clé&gt;</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {examples.map((ex) => (
            <div
              key={ex.path}
              className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    ex.method === 'GET'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-primary/30 bg-primary/10 text-primary'
                  }
                >
                  {ex.method}
                </Badge>
                <code className="text-xs font-mono">{ex.path}</code>
              </div>
              <p className="text-xs text-muted-foreground">{ex.title}</p>
              <pre className="overflow-x-auto rounded bg-foreground/5 p-2 text-[11px] leading-relaxed text-foreground/80">
                <code className="font-mono whitespace-pre">{ex.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* --------------------------------- View --------------------------------- */

export default function ApiKeysView() {
  const [loading, setLoading] = React.useState(true)
  const [keys, setKeys] = React.useState<ApiKey[]>([])
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [newKey, setNewKey] = React.useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = React.useState<ApiKey | null>(null)
  const [revoking, setRevoking] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/apikeys', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setKeys(Array.isArray(data?.keys) ? data.keys : [])
      } else {
        setKeys([])
      }
    } catch {
      setKeys([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setNewName('')
    setNewKey(null)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    // Clear after the dialog close animation so the key isn't visible again
    setTimeout(() => {
      setNewKey(null)
      setNewName('')
    }, 200)
  }

  const submitCreate = async () => {
    const name = newName.trim()
    if (!name) {
      toast.error('Donnez un nom à votre clé API.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok && data?.key?.raw) {
        setNewKey(data.key.raw)
        await load()
        toast.success('Clé API générée.')
      } else {
        toast.error(data?.message ?? 'Erreur lors de la génération.')
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setCreating(false)
    }
  }

  const confirmRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/apikeys?id=${encodeURIComponent(revokeTarget.id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Clé révoquée.')
        setRevokeTarget(null)
        await load()
      } else {
        toast.error('Erreur lors de la révocation.')
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Clés API</h1>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" />
          Générer une clé
        </Button>
      </header>

      {/* Security banner */}
      <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Les clés API donnent accès programmatique à votre workspace.{' '}
          <strong>Ne les partagez jamais.</strong> Elles ne sont jamais visibles par le
          propriétaire (Owner).
        </p>
      </div>

      {/* Keys table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clés actives</CardTitle>
          <CardDescription>Clés d&apos;accès générées pour ce workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/20 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium">Aucune clé API</p>
                <p className="text-xs text-muted-foreground">
                  Générez votre première clé pour accéder à l&apos;API EmailOqui.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                Générer une clé
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="h-9">Nom</TableHead>
                    <TableHead className="h-9">Préfixe</TableHead>
                    <TableHead className="h-9">Statut</TableHead>
                    <TableHead className="h-9">Dernière utilisation</TableHead>
                    <TableHead className="h-9">Création</TableHead>
                    <TableHead className="h-9 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => {
                    const active = k.status === 'ACTIF'
                    return (
                      <TableRow key={k.id}>
                        <TableCell className="font-medium">{k.name}</TableCell>
                        <TableCell>
                          <code className="font-mono text-xs text-muted-foreground">
                            {k.keyPrefix}
                            <span className="text-muted-foreground/60">…</span>
                          </code>
                        </TableCell>
                        <TableCell>
                          {active ? (
                            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              <ShieldCheck className="size-3" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <Trash2 className="size-3" />
                              Révoqué
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmt(k.lastUsedAt)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmt(k.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {active ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setRevokeTarget(k)}
                            >
                              <Trash2 className="size-3.5" />
                              Révoquer
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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

      {/* API documentation */}
      <ApiDocCard />

      {/* Create / show key dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) closeCreate()
          else setCreateOpen(true)
        }}
      >
        <DialogContent className="sm:max-w-md">
          {!newKey ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="size-4 text-primary" />
                  Générer une clé API
                </DialogTitle>
                <DialogDescription>
                  Donnez un nom explicite pour identifier cette clé (ex: Integration CRM).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-2">
                <Label htmlFor="apikey-name" className="text-xs">
                  Nom de la clé
                </Label>
                <Input
                  id="apikey-name"
                  placeholder="Integration CRM"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={creating}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creating) void submitCreate()
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeCreate} disabled={creating}>
                  Annuler
                </Button>
                <Button type="button" onClick={submitCreate} disabled={creating}>
                  {creating ? 'Génération…' : 'Générer'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Clé générée
                </DialogTitle>
                <DialogDescription>
                  Copiez cette clé maintenant. Elle ne sera plus jamais affichée.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Pour des raisons de sécurité, la clé complète n&apos;est affichée qu&apos;une
                    seule fois. Si vous la perdez, vous devrez révoquer et régénérer une nouvelle clé.
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-3">
                  <code className="flex-1 truncate font-mono text-xs break-all">{newKey}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copy(newKey, 'Clé copiée. Stockez-la en lieu sûr.')}
                  >
                    <Copy className="size-3.5" />
                    Copier
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={closeCreate}>
                  J&apos;ai copié ma clé
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(o) => {
          if (!o) setRevokeTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-4 text-destructive" />
              Révoquer la clé « {revokeTarget?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les intégrations utilisant cette clé cesseront
              immédiatement de fonctionner. Une clé révoquée ne peut pas être réactivée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmRevoke()
              }}
              disabled={revoking}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {revoking ? 'Révocation…' : 'Révoquer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
