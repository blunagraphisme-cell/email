'use client'

import * as React from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Mail,
  Users,
  ListTree,
  Workflow,
  LayoutTemplate,
  BarChart3,
  CreditCard,
  Globe,
  KeyRound,
  LifeBuoy,
  ScrollText,
  Settings,
  LogOut,
  Crown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react'

interface NavItem {
  view: ViewKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  aliases?: ViewKey[]
}

const NAV_ITEMS: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'campaigns', label: 'Campagnes', icon: Mail, aliases: ['campaign-new', 'campaign-detail', 'editor'] },
  { view: 'contacts', label: 'Contacts', icon: Users },
  { view: 'lists', label: 'Listes & Segments', icon: ListTree },
  { view: 'automations', label: 'Automatisations', icon: Workflow },
  { view: 'templates', label: 'Modèles', icon: LayoutTemplate },
  { view: 'stats', label: 'Statistiques', icon: BarChart3 },
  { view: 'subscription', label: 'Abonnement', icon: CreditCard },
  { view: 'domain', label: 'Domaine', icon: Globe },
  { view: 'apikeys', label: 'Clés API', icon: KeyRound },
  { view: 'support', label: 'Support', icon: LifeBuoy },
  { view: 'audit', label: 'Journaux', icon: ScrollText },
  { view: 'settings', label: 'Paramètres', icon: Settings },
]

/** Brand mark — uses the official EmailOqui logo PNG. */
function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <img
        src="/logo.png"
        alt="EmailOqui"
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-lg object-contain"
      />
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">EmailOqui</span>
          <span className="text-[10px] text-muted-foreground">email.oquitogo.com</span>
        </div>
      )}
    </div>
  )
}

interface SidebarContentProps {
  /** Called after a nav action (used by mobile sheet to auto-close). */
  onNavigate?: () => void
  /** Number of programmed/active campaigns (used for Campagnes badge). */
  activeCampaigns?: number
  /** Whether to render in collapsed (icons-only) mode. */
  collapsed?: boolean
}

/**
 * SidebarContent — the inner nav shared by desktop sidebar and mobile sheet.
 * Renders: brand mark, nav list, plan/quota footer, action buttons.
 */
export function SidebarContent({
  onNavigate,
  activeCampaigns = 0,
  collapsed = false,
}: SidebarContentProps) {
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const logout = useAppStore((s) => s.logout)
  const setPreviewRole = useAppStore((s) => s.setPreviewRole)
  const previewRole = useAppStore((s) => s.previewRole)
  const workspace = useAppStore((s) => s.workspace)
  const user = useAppStore((s) => s.user)

  const isItemActive = (item: NavItem) =>
    view === item.view || item.aliases?.includes(view)

  const go = (v: ViewKey) => {
    setView(v)
    onNavigate?.()
  }

  const previewOwner = () => {
    setPreviewRole('OWNER')
    setView('owner-dashboard')
    onNavigate?.()
  }

  const exitPreview = () => {
    setPreviewRole(null)
    setView('dashboard')
    onNavigate?.()
  }

  const doLogout = () => {
    void logout()
    onNavigate?.()
  }

  // Plan / quota display
  const planCode = workspace?.planCode ?? 'FREE'
  const planName = workspace?.planName ?? planCode
  const dailyLimit = workspace?.dailyEmailLimit ?? 0
  const sentToday = workspace?.emailsSentToday ?? 0
  const quotaPct = dailyLimit > 0 ? Math.min(100, (sentToday / dailyLimit) * 100) : 0
  const canPreviewOwner =
    (user?.role === 'DEVELOPER' || user?.role === 'PLATFORM_ADMIN') &&
    workspace?.memberRole !== 'OWNER'

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-3">
        <BrandMark collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="scroll-area-thin flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isItemActive(item)
            const showBadge = item.view === 'campaigns' && activeCampaigns > 0
            return (
              <li key={item.view}>
                <button
                  type="button"
                  onClick={() => go(item.view)}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'min-h-[40px]',
                    active
                      ? 'bg-sidebar-primary/10 text-sidebar-primary'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {showBadge && (
                        <Badge
                          variant="default"
                          className="h-5 px-1.5 text-[10px]"
                        >
                          {activeCampaigns}
                        </Badge>
                      )}
                    </>
                  )}
                  {collapsed && showBadge && (
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 size-2 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-sidebar-border p-3">
        {/* Owner preview / exit preview */}
        {previewRole === 'OWNER' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={exitPreview}
            className={cn('w-full', collapsed && 'px-0')}
            title="Quitter l'aperçu Owner"
          >
            <Eye className="size-4" />
            {!collapsed && <span>Quitter l'aperçu</span>}
          </Button>
        ) : canPreviewOwner ? (
          <Button
            variant="outline"
            size="sm"
            onClick={previewOwner}
            className={cn('mb-2 w-full', collapsed && 'px-0')}
            title="Vue Owner (aperçu)"
          >
            <Crown className="size-4" />
            {!collapsed && <span>Vue Owner</span>}
          </Button>
        ) : null}

        {/* Plan + quota */}
        {!collapsed && (
          <div className="mb-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Plan</span>
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Sparkles className="size-3" />
                {planName}
              </Badge>
            </div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Quota du jour</span>
              <span className="font-mono tabular-nums">
                {sentToday.toLocaleString('fr-FR')} / {dailyLimit.toLocaleString('fr-FR')}
              </span>
            </div>
            <Progress value={quotaPct} className="h-1.5" />
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={doLogout}
          className={cn('w-full text-muted-foreground', collapsed && 'px-0')}
          title="Déconnexion"
        >
          <LogOut className="size-4" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </div>
    </div>
  )
}

/**
 * Sidebar — desktop fixed sidebar with collapse support.
 * Width animates between w-64 (expanded) and w-[68px] (collapsed, icons-only).
 */
export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const [activeCampaigns, setActiveCampaigns] = React.useState(0)

  // Poll programmed campaigns count for the badge.
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/api/stats/overview?days=30', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const stats = data?.stats
        if (!cancelled && stats && typeof stats.activeCampaigns === 'number') {
          setActiveCampaigns(stats.activeCampaigns)
        }
      } catch {
        /* ignore */
      }
    }
    void load()
    const t = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  return (
    <aside
      className={cn(
        'relative hidden h-screen shrink-0 border-r border-sidebar-border lg:flex lg:flex-col',
        'transition-[width] duration-200',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <SidebarContent
        collapsed={collapsed}
        activeCampaigns={activeCampaigns}
      />
      {/* Collapse toggle — floats at the right edge */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
        className="absolute -right-3 top-20 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>
    </aside>
  )
}

export default Sidebar
