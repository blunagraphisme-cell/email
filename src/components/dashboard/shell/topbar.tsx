'use client'

import * as React from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  CheckCheck,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

/** Maps a view key to a human-readable French title for the topbar. */
export const VIEW_TITLES: Record<ViewKey, string> = {
  landing: 'Accueil',
  features: 'Fonctionnalités',
  pricing: 'Tarifs',
  contact: 'Contact',
  legal: 'Mentions légales',
  login: 'Connexion',
  signup: 'Inscription',
  forgot: 'Mot de passe oublié',
  dashboard: 'Tableau de bord',
  campaigns: 'Campagnes',
  'campaign-new': 'Nouvelle campagne',
  'campaign-detail': 'Détail de campagne',
  editor: 'Éditeur de campagne',
  contacts: 'Contacts',
  lists: 'Listes & Segments',
  automations: 'Automatisations',
  templates: 'Modèles',
  stats: 'Statistiques',
  subscription: 'Abonnement',
  domain: 'Domaine',
  apikeys: 'Clés API',
  support: 'Support',
  audit: 'Journaux',
  settings: 'Paramètres',
  renew: 'Renouvellement',
  'owner-dashboard': 'Dashboard Owner',
}

interface Notification {
  id: string
  type: string
  title: string
  message?: string | null
  read?: boolean
  createdAt?: string | null
}

/** Relative-time formatter (French). */
function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'à l\'instant'
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `il y a ${hr} h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `il y a ${day} j`
  return d.toLocaleDateString('fr-FR')
}

function notifIcon(type: string) {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle2 className="size-4 text-foreground" />
    case 'WARNING':
      return <AlertTriangle className="size-4 text-muted-foreground" />
    case 'ERROR':
      return <XCircle className="size-4 text-destructive" />
    default:
      return <Info className="size-4 text-primary" />
  }
}

interface TopbarProps {
  /** Called when the mobile hamburger button is clicked. */
  onMenu?: () => void
}

export function Topbar({ onMenu }: TopbarProps) {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const workspace = useAppStore((s) => s.workspace)
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)

  // notifications
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [marking, setMarking] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
        }
      } catch {
        /* ignore */
      }
    }
    void load()
    const t = setInterval(load, 45_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const unread = notifications.filter((n) => !n.read).length

  const markAllRead = async () => {
    setMarking(true)
    try {
      await fetch('/api/notifications', { method: 'POST' })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      /* ignore */
    } finally {
      setMarking(false)
    }
  }

  // quota color logic
  const sentToday = workspace?.emailsSentToday ?? 0
  const dailyLimit = workspace?.dailyEmailLimit ?? 0
  const quotaPct = dailyLimit > 0 ? Math.min(100, (sentToday / dailyLimit) * 100) : 0
  const quotaColor =
    quotaPct >= 90
      ? 'bg-destructive'
      : quotaPct >= 80
        ? 'bg-muted-foreground'
        : 'bg-foreground'

  const title = VIEW_TITLES[view] ?? 'EmailOqui'

  const initials = [
    user?.firstName?.[0] ?? '',
    user?.lastName?.[0] ?? '',
  ]
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  const doLogout = () => {
    void logout()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenu}
        aria-label="Ouvrir le menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Title */}
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        {workspace?.name && (
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            · {workspace.name}
          </span>
        )}
      </div>

      {/* Center search (hidden on small) */}
      <div className="mx-auto hidden w-full max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher campagnes, contacts, modèles…"
            className="h-9 pl-9 pr-3 text-sm"
            aria-label="Recherche"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
        {/* Quota indicator */}
        <div className="hidden items-center gap-2 sm:flex" title={`Quota du jour : ${sentToday} / ${dailyLimit} e-mails`}>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full transition-all', quotaColor)}
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {sentToday}/{dailyLimit}
          </span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex size-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && <Badge variant="secondary">{unread}</Badge>}
            </div>
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto mb-2 size-6 opacity-40" />
                  Aucune notification
                </div>
              ) : (
                <ul className="divide-y border-b">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        'flex gap-3 px-3 py-2.5 text-sm',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{notifIcon(n.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{n.title}</span>
                          {!n.read && (
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        {n.message && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.message}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={markAllRead}
                disabled={unread === 0 || marking}
              >
                <CheckCheck className="size-4" />
                Tout marquer comme lu
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar / user menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full p-0.5 pr-1 transition-colors hover:bg-accent sm:pr-2"
              aria-label="Menu utilisateur"
            >
              <Avatar className="size-8 border">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-xs font-medium sm:inline">
                {user?.firstName ?? user?.email?.split('@')[0]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setView('settings')}>
              <User className="size-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView('settings')}>
              <Sliders className="size-4" />
              Préférences
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setView('subscription')}>
              <Settings className="size-4" />
              Abonnement
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={doLogout}>
              <LogOut className="size-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Topbar
