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
  Globe,
  ShieldCheck,
  ShieldAlert,
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
} from 'lucide-react'

/* --------------------------------- types --------------------------------- */

interface DomainRecord {
  id: string
  workspaceId: string
  domain: string
  status: string // VERIFIE | ERREUR | EN_VERIFICATION | NON_CONFIGURE
  spfStatus: string
  dkimStatus: string
  dmarcStatus: string
  lastCheckedAt: string | null
  errors: string | null
}

type DnsRow = {
  type: string
  host: string
  value: string
}

/* --------------------------------- helpers -------------------------------- */

function statusMeta(s: string): {
  label: string
  className: string
  dot: string
} {
  switch (s) {
    case 'VERIFIE':
      return {
        label: 'Vérifié',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        dot: 'bg-emerald-500',
      }
    case 'EN_VERIFICATION':
      return {
        label: 'En vérification',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500',
      }
    case 'ERREUR':
      return {
        label: 'Erreur',
        className: 'border-destructive/30 bg-destructive/10 text-destructive',
        dot: 'bg-destructive',
      }
    default:
      return {
        label: 'Non configuré',
        className: 'border-border bg-muted text-muted-foreground',
        dot: 'bg-muted-foreground/40',
      }
  }
}

function fmtDate(d: string | null | undefined): string {
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

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Valeur copiée dans le presse-papiers.')
  } catch {
    toast.error('Impossible de copier la valeur.')
  }
}

/* ------------------------------ DNS records ------------------------------ */

const SPF_RECORD: DnsRow = {
  type: 'TXT',
  host: '@ (racine du domaine)',
  value: 'v=spf1 include:_spf.mailoqui.com ~all',
}
const DKIM_RECORD: DnsRow = {
  type: 'TXT',
  host: 'mailoqui._domainkey',
  value:
    'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtU7sXKWRb/aNBLxI5w0e1pQ8w10VT0a+ZrLgWn3iV5F5cYh6w3m8dNcDT6Qf9k2xq5t5K9wI7tq3Z1oU6+5d5l9K8wL3vQ5yP9iJ6mW1zj2eO3H8Qy1mV4j+aNxKpYqZ8nBhK0tQwIDAQAB',
}
const DMARC_RECORD: DnsRow = {
  type: 'TXT',
  host: '_dmarc',
  value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@mailoqui.com',
}

/* --------------------------------- DnsCard -------------------------------- */

function DnsCard({
  code,
  title,
  description,
  records,
  status,
}: {
  code: 'SPF' | 'DKIM' | 'DMARC'
  title: string
  description: string
  records: DnsRow[]
  status: string
}) {
  const meta = statusMeta(status)
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              {title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">{code}</CardDescription>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}
          >
            <span className={`size-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        <div className="overflow-hidden rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="h-8 px-2 text-[11px] uppercase tracking-wide">Type</TableHead>
                <TableHead className="h-8 px-2 text-[11px] uppercase tracking-wide">Hôte</TableHead>
                <TableHead className="h-8 px-2 text-[11px] uppercase tracking-wide">Valeur</TableHead>
                <TableHead className="h-8 w-10 px-2 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="px-2 py-2 align-top text-xs font-medium">{r.type}</TableCell>
                  <TableCell className="px-2 py-2 align-top text-xs font-mono">
                    {r.host}
                  </TableCell>
                  <TableCell className="max-w-[260px] px-2 py-2 align-top text-xs">
                    <code className="block max-h-20 overflow-y-auto whitespace-pre-wrap break-all rounded bg-muted/60 px-1.5 py-1 font-mono text-[11px] leading-relaxed">
                      {r.value}
                    </code>
                  </TableCell>
                  <TableCell className="px-1 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => copy(r.value)}
                      title="Copier la valeur"
                      aria-label="Copier la valeur"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/* --------------------------------- Domain --------------------------------- */

export default function DomainView() {
  const user = useAppStore((s) => s.user)
  const [loading, setLoading] = React.useState(true)
  const [verifying, setVerifying] = React.useState(false)
  const [domain, setDomain] = React.useState<DomainRecord | null>(null)
  const [input, setInput] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/domain', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data?.domain) {
          setDomain(data.domain)
          setInput(data.domain.domain ?? '')
        } else {
          setDomain(null)
        }
      } else {
        setDomain(null)
      }
    } catch {
      setDomain(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const verify = async () => {
    const d = input.trim().toLowerCase()
    if (!d) {
      toast.error('Saisissez un nom de domaine.')
      return
    }
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d)) {
      toast.error('Format de domaine invalide (ex: mail.exemple.com).')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      })
      const data = await res.json()
      if (res.ok && data?.domain) {
        setDomain(data.domain)
        if (data.domain.status === 'VERIFIE') {
          toast.success(`Le domaine ${data.domain.domain} est vérifié.`)
        } else {
          toast.error('Vérification échouée. Ajoutez les enregistrements DNS ci-dessous.')
        }
      } else {
        toast.error(data?.message ?? 'Erreur lors de la vérification.')
      }
    } catch {
      toast.error('Erreur réseau lors de la vérification.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="mt-6 h-32 w-full" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const status = domain?.status ?? 'NON_CONFIGURE'
  const statusM = statusMeta(status)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Domaine d&apos;envoi</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configurez le domaine utilisé pour l&apos;envoi de vos e-mails et authentifiez-le avec SPF,
          DKIM et DMARC pour garantir une bonne délivrabilité.
        </p>
      </header>

      {/* Sender domain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domaine d&apos;envoi principal</CardTitle>
          <CardDescription>
            Le domaine à partir duquel vos e-mails sont expédiés (ex: mail.exemple.com).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!domain && (
            <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <Info className="size-4 shrink-0 text-primary" />
              <span>Aucun domaine configuré pour ce workspace.</span>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="domain-input" className="text-xs">
                Nom de domaine
              </Label>
              <Input
                id="domain-input"
                placeholder="mail.exemple.com"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={verifying}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !verifying) void verify()
                }}
              />
            </div>
            <Button
              type="button"
              onClick={verify}
              disabled={verifying}
              className="sm:w-auto"
            >
              {verifying ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Vérification…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Vérifier
                </>
              )}
            </Button>
          </div>

          {domain && (
            <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{domain.domain}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusM.className}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusM.dot}`} />
                    {statusM.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dernière vérification : {fmtDate(domain.lastCheckedAt)}
                </p>
                {domain.status === 'ERREUR' && domain.errors && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-destructive">
                    <XCircle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{domain.errors}</span>
                  </p>
                )}
                {domain.status === 'VERIFIE' && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                    <span>Les enregistrements DNS ont été détectés. Le domaine est authentifié.</span>
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={verify}
                disabled={verifying}
              >
                <RefreshCw className={`size-4 ${verifying ? 'animate-spin' : ''}`} />
                Relancer la vérification
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Le système ne considère pas un domaine comme vérifié tant que les enregistrements DNS ne
            sont pas détectés techniquement.
          </p>
        </CardContent>
      </Card>

      {/* SPF / DKIM / DMARC cards */}
      <section aria-label="Authentification DNS" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Enregistrements DNS à configurer</h2>
          <span className="text-xs text-muted-foreground">
            Ajoutez ces enregistrements auprès de votre registrar DNS.
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DnsCard
            code="SPF"
            title="SPF"
            description="Autorise MailOqui à envoyer des e-mails depuis votre domaine. Indispensable pour éviter d’être marqué comme spam."
            records={[SPF_RECORD]}
            status={domain?.spfStatus ?? 'NON_CONFIGURE'}
          />
          <DnsCard
            code="DKIM"
            title="DKIM"
            description="Signe numériquement vos e-mails pour garantir leur intégrité. La clé publique est publiée dans cet enregistrement."
            records={[DKIM_RECORD]}
            status={domain?.dkimStatus ?? 'NON_CONFIGURE'}
          />
          <DnsCard
            code="DMARC"
            title="DMARC"
            description="Indique aux fournisseurs de messagerie la politique à appliquer en cas d’échec SPF/DKIM et où envoyer les rapports."
            records={[DMARC_RECORD]}
            status={domain?.dmarcStatus ?? 'NON_CONFIGURE'}
          />
        </div>
      </section>

      {/* Footer note */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Bon à savoir</p>
            <p className="mt-1">
              La propagation DNS peut prendre de quelques minutes à 24h. Une fois les enregistrements
              ajoutés, relancez la vérification. Pour tout problème, contactez votre administrateur
              {user?.firstName ? `, ${user.firstName}` : ''}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
