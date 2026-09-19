'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { BrandMark } from '@/components/brand/brand-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Building2,
  Users,
  CreditCard,
  LifeBuoy,
  Mail,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Search,
  DollarSign,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  workspaces: number
  activeSubscriptions: number
  expiringSoon: number
  expired: number
  suspended: number
  users: number
  emailVolume: number
  pendingPayments: number
  confirmedPayments: number
  tickets: number
  openTickets: number
  revenue: number
}

interface AdminWorkspace {
  id: string
  name: string
  status: string
  timezone: string
  createdAt: string
  contactsCount: number
  campaignsCount: number
  membersCount: number
  plan: string | null
  planName: string | null
  subscriptionStatus: string | null
  subscriptionEnd: string | null
  domain: string | null
  domainStatus: string | null
}

interface AdminUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  status: string
  emailVerified: boolean
  createdAt: string
  workspacesCount: number
  auditLogsCount: number
}

interface AdminPayment {
  id: string
  workspaceName: string
  planCode: string | null
  planName: string | null
  amount: number
  currency: string
  status: string
  transactionReference: string | null
  paymentMethod: string
  cardLast4: string | null
  confirmedAt: string | null
  createdAt: string
}

interface AdminTicket {
  id: string
  workspaceName: string
  userEmail: string
  userName: string
  subject: string
  category: string
  priority: string
  status: string
  message: string
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIF: 'border-foreground/30 bg-foreground/10 text-foreground',
  ACTIVE: 'border-foreground/30 bg-foreground/10 text-foreground',
  EN_ATTENTE: 'border-foreground/20 bg-muted text-muted-foreground',
  EXPIRANT_BIENTOT: 'border-foreground/20 bg-muted text-muted-foreground',
  EXPIRE: 'border-destructive/30 bg-destructive/10 text-destructive',
  SUSPENDU: 'border-destructive/30 bg-destructive/10 text-destructive',
  ANNULE: 'border-destructive/30 bg-destructive/10 text-destructive',
  CONFIRME: 'border-foreground/30 bg-foreground/10 text-foreground',
  REFUSE: 'border-destructive/30 bg-destructive/10 text-destructive',
  OUVERT: 'border-foreground/20 bg-muted text-muted-foreground',
  EN_COURS: 'border-foreground/30 bg-foreground/10 text-foreground',
  RESOLU: 'border-foreground/30 bg-foreground/10 text-foreground',
  FERME: 'border-border bg-muted text-muted-foreground',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[status] ?? 'border-border bg-muted text-muted-foreground'}`}>
      {status}
    </Badge>
  )
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function PlatformAdminDashboard() {
  const user = useAppStore((s) => s.user)
  const logout = useAppStore((s) => s.logout)
  const [stats, setStats] = React.useState<AdminStats | null>(null)
  const [recentWorkspaces, setRecentWorkspaces] = React.useState<AdminWorkspace[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState('overview')

  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' })
        const data = await res.json()
        if (active && data.success) {
          setStats(data.stats)
          setRecentWorkspaces(data.recentWorkspaces)
        }
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandMark size={32} />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">EmailOqui Admin</span>
              <span className="text-[10px] text-muted-foreground">Plateforme globale — email.oquitogo.online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:flex sm:flex-col sm:leading-tight">
              <span className="text-sm font-medium">{user?.firstName ?? user?.email}</span>
              <span className="text-[10px] text-muted-foreground">Platform Admin</span>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="size-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de la plateforme EmailOqui : workspaces, utilisateurs, paiements, tickets.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="workspaces" className="text-xs sm:text-sm">Workspaces</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Utilisateurs</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">Paiements</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs sm:text-sm">Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {loading ? <Loading /> : <Overview stats={stats} recentWorkspaces={recentWorkspaces} />}
          </TabsContent>
          <TabsContent value="workspaces" className="mt-6">
            <WorkspacesTab />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <PaymentsTab />
          </TabsContent>
          <TabsContent value="tickets" className="mt-6">
            <TicketsTab />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>EmailOqui Admin — email.oquitogo.online</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, hint, tone = 'default' }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warning' | 'error'
}) {
  const toneClass = tone === 'error' ? 'text-destructive' : tone === 'warning' ? 'text-muted-foreground' : 'text-foreground'
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className={`mt-2 text-3xl font-bold tabular-nums ${toneClass}`}>{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}

function Overview({ stats, recentWorkspaces }: { stats: AdminStats | null; recentWorkspaces: AdminWorkspace[] }) {
  if (!stats) return <Loading />
  return (
    <div className="flex flex-col gap-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <KpiCard icon={Building2} label="Workspaces" value={stats.workspaces} hint={`${stats.activeSubscriptions} actifs`} />
        <KpiCard icon={Users} label="Utilisateurs" value={stats.users} />
        <KpiCard icon={DollarSign} label="Revenu total" value={fmtMoney(stats.revenue, 'USD')} hint={`${stats.confirmedPayments} paiements confirmés`} />
        <KpiCard icon={Send} label="E-mails envoyés" value={stats.emailVolume.toLocaleString('fr-FR')} />
        <KpiCard icon={CheckCircle2} label="Souscriptions actives" value={stats.activeSubscriptions} tone="default" />
        <KpiCard icon={Clock} label="Expirant bientôt" value={stats.expiringSoon} tone="warning" />
        <KpiCard icon={XCircle} label="Expirées" value={stats.expired} tone="error" />
        <KpiCard icon={AlertTriangle} label="Suspendues" value={stats.suspended} tone="error" />
        <KpiCard icon={CreditCard} label="Paiements en attente" value={stats.pendingPayments} tone="warning" />
        <KpiCard icon={LifeBuoy} label="Tickets ouverts" value={stats.openTickets} hint={`${stats.tickets} total`} tone={stats.openTickets > 0 ? 'warning' : 'default'} />
      </div>

      {/* Recent workspaces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workspaces récents</CardTitle>
          <CardDescription>5 derniers espaces de travail créés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {recentWorkspaces.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">Aucun workspace.</div>
            )}
            {recentWorkspaces.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                <div className="flex flex-col">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {w.contactsCount} contacts · {w.campaignsCount} campagnes · {w.membersCount} membres
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {w.plan && <Badge variant="outline" className="text-xs">{w.plan}</Badge>}
                  <StatusBadge status={w.subscriptionStatus ?? 'EN_ATTENTE'} />
                  <span className="text-xs text-muted-foreground">{fmtDate(w.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WorkspacesTab() {
  const [items, setItems] = React.useState<AdminWorkspace[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  const fetchPage = React.useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/workspaces', window.location.origin)
      url.searchParams.set('page', String(p))
      url.searchParams.set('pageSize', '20')
      if (q) url.searchParams.set('q', q)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setItems(data.workspaces)
        setTotal(data.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchPage(page, search) }, [page, search, fetchPage])

  const pageCount = Math.ceil(total / 20)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tous les workspaces ({total})</CardTitle>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Loading /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Nom</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Abonn.</th>
                  <th className="py-2 pr-3 text-right">Contacts</th>
                  <th className="py-2 pr-3 text-right">Campagnes</th>
                  <th className="py-2 pr-3 text-right">Membres</th>
                  <th className="py-2 pr-3">Domaine</th>
                  <th className="py-2 pr-3">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="border-b border-border/60 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-medium">{w.name}</td>
                    <td className="py-2 pr-3"><StatusBadge status={w.status} /></td>
                    <td className="py-2 pr-3">{w.plan ? <Badge variant="outline" className="text-xs">{w.plan}</Badge> : '—'}</td>
                    <td className="py-2 pr-3"><StatusBadge status={w.subscriptionStatus ?? 'EN_ATTENTE'} /></td>
                    <td className="py-2 pr-3 text-right tabular-nums">{w.contactsCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{w.campaignsCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{w.membersCount}</td>
                    <td className="py-2 pr-3 text-xs">{w.domain ?? '—'}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDate(w.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Page {page} / {pageCount}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
                  <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsersTab() {
  const [items, setItems] = React.useState<AdminUser[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [loading, setLoading] = React.useState(true)

  const fetchPage = React.useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/admin/users', window.location.origin)
      url.searchParams.set('page', String(p))
      url.searchParams.set('pageSize', '20')
      if (q) url.searchParams.set('q', q)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const data = await res.json()
      if (data.success) {
        setItems(data.users)
        setTotal(data.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchPage(page, search) }, [page, search, fetchPage])

  const pageCount = Math.ceil(total / 20)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tous les utilisateurs ({total})</CardTitle>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par e-mail…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Loading /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">E-mail</th>
                  <th className="py-2 pr-3">Nom</th>
                  <th className="py-2 pr-3">Rôle</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Vérifié</th>
                  <th className="py-2 pr-3 text-right">Workspaces</th>
                  <th className="py-2 pr-3 text-right">Actions audit</th>
                  <th className="py-2 pr-3">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-medium">{u.email}</td>
                    <td className="py-2 pr-3">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-2 pr-3"><StatusBadge status={u.role} /></td>
                    <td className="py-2 pr-3"><StatusBadge status={u.status} /></td>
                    <td className="py-2 pr-3">{u.emailVerified ? <CheckCircle2 className="size-4 text-foreground" /> : <XCircle className="size-4 text-muted-foreground" />}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{u.workspacesCount}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{u.auditLogsCount}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Page {page} / {pageCount}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
                  <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PaymentsTab() {
  const [items, setItems] = React.useState<AdminPayment[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/payments?limit=50', { cache: 'no-store' })
        const data = await res.json()
        if (data.success) setItems(data.payments)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const totalConfirmed = items.filter((p) => p.status === 'CONFIRME').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={DollarSign} label="Revenu confirmé" value={fmtMoney(totalConfirmed, 'USD')} />
        <KpiCard icon={CheckCircle2} label="Confirmés" value={items.filter((p) => p.status === 'CONFIRME').length} />
        <KpiCard icon={Clock} label="En attente" value={items.filter((p) => p.status === 'EN_ATTENTE').length} tone="warning" />
        <KpiCard icon={XCircle} label="Refusés/remboursés" value={items.filter((p) => ['REFUSE', 'ANNULE', 'REMBOURSE'].includes(p.status)).length} tone="error" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tous les paiements</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Loading /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Workspace</th>
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3 text-right">Montant</th>
                    <th className="py-2 pr-3">Statut</th>
                    <th className="py-2 pr-3">Méthode</th>
                    <th className="py-2 pr-3">Référence</th>
                    <th className="py-2 pr-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="py-2 pr-3 font-medium">{p.workspaceName}</td>
                      <td className="py-2 pr-3">{p.planCode ? <Badge variant="outline" className="text-xs">{p.planCode}</Badge> : '—'}</td>
                      <td className="py-2 pr-3 text-right tabular-nums font-medium">{fmtMoney(p.amount, p.currency)}</td>
                      <td className="py-2 pr-3"><StatusBadge status={p.status} /></td>
                      <td className="py-2 pr-3 text-xs">{p.paymentMethod}{p.cardLast4 ? ` •••• ${p.cardLast4}` : ''}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{p.transactionReference ?? '—'}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDateTime(p.confirmedAt ?? p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {items.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Aucun paiement.</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TicketsTab() {
  const [items, setItems] = React.useState<AdminTicket[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/tickets?limit=50', { cache: 'no-store' })
        const data = await res.json()
        if (data.success) setItems(data.tickets)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tous les tickets support ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Loading /> : (
          <div className="flex flex-col gap-3">
            {items.map((t) => (
              <div key={t.id} className="rounded-md border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{t.subject}</span>
                  <StatusBadge status={t.status} />
                  <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                  <Badge variant="outline" className="text-xs">{t.category}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.workspaceName} · {t.userEmail} · {fmtDateTime(t.createdAt)}
                </div>
                <p className="mt-2 text-sm text-foreground/90 line-clamp-2">{t.message}</p>
              </div>
            ))}
            {items.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Aucun ticket.</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PlatformAdminDashboard
