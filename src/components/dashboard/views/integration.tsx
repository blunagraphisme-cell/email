'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  KeyRound, Plus, Copy, Trash2, CheckCircle2, Code2, Webhook, ArrowRight,
  Server, ShieldCheck, AlertTriangle, Loader2, FlaskConical,
} from 'lucide-react'
import { toast } from 'sonner'

const EVENT_TYPES = ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCE', 'FAILED', 'UNSUBSCRIBE', 'COMPLAINT']

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  status: string
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
  raw?: string // only present once after creation
}

const CODE_EXAMPLES = {
  curl: `curl -X POST https://email.oquitogo.online/api/v1/events \\
  -H "Authorization: Bearer moq_live_VOTRE_CLE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "events": [
      {
        "event_id": "evt_123456",
        "email": "destinataire@example.com",
        "type": "SENT",
        "campaign_name": "Newsletter Octobre",
        "occurred_at": "2026-10-15T10:30:00Z"
      }
    ]
  }'`,
  node: `// Node.js — retransmettre les événements Resend vers EmailOqui
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// Quand Resend envoie un webhook d'événement :
app.post('/resend-webhook', async (req, res) => {
  const events = req.body.events // tableau d’événements Resend

  // Re-transforme en format EmailOqui et pousse
  await fetch('https://email.oquitogo.online/api/v1/events', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.EMAILOQUI_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      events: events.map(ev => ({
        event_id: ev.email_id,
        email: ev.to,
        type: ev.event_type.toUpperCase(), // sent, delivered, opened, ...
        campaign_name: ev.tags?.campaign ?? 'Général',
        occurred_at: ev.created_at,
      })),
    }),
  })

  res.status(200).send('ok')
})`,
  python: `# Python — retransmettre les événements vers EmailOqui
import os, requests

EMAILOQUI_API_KEY = os.environ['EMAILOQUI_API_KEY']
EMAILOQUI_ENDPOINT = 'https://email.oquitogo.online/api/v1/events'

def push_events(events):
    """events: liste de dicts {event_id, email, type, campaign_name, occurred_at}"""
    r = requests.post(
        EMAILOQUI_ENDPOINT,
        headers={
            'Authorization': f'Bearer {EMAILOQUI_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={'events': events},
    )
    r.raise_for_status()
    return r.json()  # {success, received, duplicates, errors}`,
}

export function IntegrationView() {
  const workspace = useAppStore((s) => s.workspace)
  const [keys, setKeys] = React.useState<ApiKey[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createName, setCreateName] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newlyCreated, setNewlyCreated] = React.useState<ApiKey | null>(null)
  const [revokeTarget, setRevokeTarget] = React.useState<ApiKey | null>(null)
  const [revoking, setRevoking] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [exampleTab, setExampleTab] = React.useState<'curl' | 'node' | 'python'>('curl')
  const [testEmail, setTestEmail] = React.useState('')
  const [testing, setTesting] = React.useState(false)

  const fetchKeys = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/apikeys', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setKeys(data.keys)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const copyToClipboard = (text: string, label = 'Copié') => {
    navigator.clipboard.writeText(text).then(() => toast.success(label))
  }

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error('Donnez un nom à votre clé.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim() }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error?.message ?? 'Erreur lors de la création.')
        return
      }
      setNewlyCreated(data.key)
      await fetchKeys()
      setCreateName('')
      setCreateOpen(false)
      toast.success('Clé d’intégration générée.')
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/apikeys?id=${revokeTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        await fetchKeys()
        toast.success('Clé révoquée.')
        setRevokeTarget(null)
      } else {
        toast.error('Échec de la révocation.')
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setRevoking(false)
    }
  }

  const handleTestEvent = async () => {
    if (!testEmail.trim()) {
      toast.error('Saisissez un e-mail destinataire de test.')
      return
    }
    if (!newlyCreated?.raw && keys.filter((k) => k.status === 'ACTIF').length === 0) {
      toast.error('Générez d’abord une clé d’intégration.')
      return
    }
    setTesting(true)
    // Note: en V1, on ne peut pas tester sans la clé raw — on simule via l’endpoint API interne
    try {
      const res = await fetch(`/api/test/event?email=${encodeURIComponent(testEmail)}`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Événement de test injecté. Vérifiez les statistiques.')
      } else {
        toast.error('Échec du test.')
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setTesting(false)
    }
  }

  const activeKeys = keys.filter((k) => k.status === 'ACTIF')
  const endpointUrl = 'https://email.oquitogo.online/api/v1/events'

  return (
    <main className="flex-1">
      {/* Header */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight">Intégration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez votre application à EmailOqui pour remonter vos statistiques de communication. Le fournisseur technique d’envoi reste invisible pour le propriétaire.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Architecture */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Server className="size-5" />
              Architecture en 4 étapes
            </CardTitle>
            <CardDescription>
              Votre application envoie les e-mails ; EmailOqui agrège les statistiques et les présente au propriétaire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3 text-sm">
              {[
                { icon: '1', text: 'Votre application envoie un e-mail via votre infrastructure d’envoi (intégrée par votre développeur).' },
                { icon: '2', text: 'L’infrastructure génère des événements (envoyé, délivré, ouvert, cliqué, rebond, désabonnement…).' },
                { icon: '3', text: 'Votre backend reçoit ces événements (via webhook) et les pousse vers l’endpoint EmailOqui ci-dessous.' },
                { icon: '4', text: 'Le propriétaire consulte les statistiques depuis son tableau de bord EmailOqui — sans jamais voir la configuration technique.' },
              ].map((step) => (
                <li key={step.icon} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                    {step.icon}
                  </span>
                  <span className="text-foreground/90">{step.text}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* API key management */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="size-5" />
              Clé d’intégration
            </CardTitle>
            <CardDescription>
              Cette clé authentifie votre backend lorsqu'il pousse des événements vers EmailOqui. Ne la partagez jamais avec le propriétaire.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Warning banner */}
            <div className="mb-4 flex items-start gap-3 rounded-md border border-foreground/20 bg-muted p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span>
                La clé d’intégration est strictement technique. Le propriétaire du workspace ne peut jamais la voir ni la générer — seul le Developer y a accès.
              </span>
            </div>

            {/* Newly created key — show raw once */}
            {newlyCreated?.raw && (
              <div className="mb-4 rounded-md border border-foreground/30 bg-foreground/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="size-4 text-foreground" />
                  Clé générée — copiez-la maintenant
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Elle ne sera plus jamais affichée. Si vous la perdez, révoquez-la et régénérez-en une nouvelle.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 overflow-x-auto rounded-md bg-background p-2 text-xs font-mono">
                    {newlyCreated.raw}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(newlyCreated.raw!, 'Clé copiée')}>
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Generate new key */}
            {createOpen && (
              <div className="mb-4 rounded-md border border-border p-4">
                <Label htmlFor="key-name" className="text-xs">Nom de la clé</Label>
                <Input
                  id="key-name"
                  placeholder="ex: Production backend"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={handleCreate} disabled={creating}>
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Générer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setCreateOpen(false); setCreateName('') }}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Keys table */}
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Loader2 className="mx-auto size-5 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="py-2 pr-3">Nom</th>
                      <th className="py-2 pr-3">Préfixe</th>
                      <th className="py-2 pr-3">Statut</th>
                      <th className="py-2 pr-3">Dernière utilisation</th>
                      <th className="py-2 pr-3">Création</th>
                      <th className="py-2 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          Aucune clé d’intégration. Générez votre première clé pour commencer à remonter vos statistiques.
                        </td>
                      </tr>
                    )}
                    {keys.map((k) => (
                      <tr key={k.id} className="border-b border-border/60 hover:bg-muted/40">
                        <td className="py-2 pr-3 font-medium">{k.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{k.keyPrefix}…</td>
                        <td className="py-2 pr-3">
                          {k.status === 'ACTIF' ? (
                            <Badge variant="outline" className="border-foreground/30 bg-foreground/10 text-foreground text-xs">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-xs">Révoquée</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('fr-FR') : '—'}
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {new Date(k.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-2 pr-3 text-right">
                          {k.status === 'ACTIF' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRevokeTarget(k)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!createOpen && (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Générer une nouvelle clé
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Endpoint */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Webhook className="size-5" />
              Endpoint de réception
            </CardTitle>
            <CardDescription>
              URL où votre backend doit pousser les événements e-mail au format JSON.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md bg-muted p-2 text-xs font-mono">
                POST {endpointUrl}
              </code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(endpointUrl, 'URL copiée')}>
                <Copy className="size-3.5" />
              </Button>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground">Authentification</p>
              <p className="mt-1 text-muted-foreground">
                En-tête HTTP : <code className="rounded bg-background px-1 py-0.5">Authorization: Bearer &lt;votre_clé&gt;</code>
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground">Types d’événements supportés</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {EVENT_TYPES.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground">Format du corps (JSON)</p>
              <pre className="mt-2 overflow-x-auto rounded bg-background p-2 text-xs">
{`{
  "events": [
    {
      "event_id": "evt_12345",       // string — identifiant unique
      "email": "destinataire@x.com", // string — e-mail du destinataire
      "type": "SENT",                // un des types ci-dessus
      "campaign_name": "Newsletter", // string optionnel — regroupe les événements
      "occurred_at": "2026-10-15T10:30:00Z" // ISO — défaut: maintenant
    }
  ]
}`}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Idempotent : chaque <code className="rounded bg-muted px-1 py-0.5">event_id</code> ne sera compté qu’une fois. Vous pouvez re-pousser les mêmes événements en cas de retry sans risque de double-comptage. Maximum 1000 événements par requête.
            </p>
          </CardContent>
        </Card>

        {/* Code examples */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code2 className="size-5" />
              Exemples d’intégration
            </CardTitle>
            <CardDescription>
              Comment retransmettre les événements de votre backend vers EmailOqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 inline-flex rounded-md border border-border bg-muted p-1">
              {(['curl', 'node', 'python'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setExampleTab(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    exampleTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node.js' : 'Python'}
                </button>
              ))}
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-md bg-foreground p-4 text-xs leading-relaxed text-background">
                <code>{CODE_EXAMPLES[exampleTab]}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute right-2 top-2 bg-background/90"
                onClick={() => copyToClipboard(CODE_EXAMPLES[exampleTab], 'Code copié')}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test integration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="size-5" />
              Tester l’intégration
            </CardTitle>
            <CardDescription>
              Injectez un événement de test pour vérifier que les statistiques remontent dans le tableau de bord.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="test-email" className="text-xs">E-mail destinataire de test</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleTestEvent} disabled={testing || activeKeys.length === 0}>
                {testing ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
                Envoyer un événement de test
              </Button>
            </div>
            {activeKeys.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Générez d’abord une clé d’intégration pour activer le test.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Flow diagram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Flux complet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-xs font-mono">
              {[
                'Application du client — envoie un e-mail',
                '↓ infrastructure d’envoi (intégrée par le dev)',
                'E-mail envoyé → événements générés',
                '↓ webhook → backend du client',
                'POST /api/v1/events → EmailOqui',
                '↓ agrégation + déduplication',
                'Tableau de bord Owner — statistiques',
              ].map((line, i) => (
                <div key={i} className={`rounded-md px-3 py-1.5 ${line.startsWith('↓') ? 'text-muted-foreground' : 'bg-muted text-foreground'}`}>
                  {line}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer la clé "{revokeTarget?.name}" ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le backend qui utilise cette clé ne pourra plus pousser d’événements vers EmailOqui. Les statistiques déjà enregistrées restent visibles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Annuler</AlertDialogCancel>
          <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRevoke() }}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? <Loader2 className="size-4 animate-spin" /> : null}
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default IntegrationView
