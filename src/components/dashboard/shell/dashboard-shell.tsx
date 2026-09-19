'use client'

import * as React from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar, SidebarContent } from '@/components/dashboard/shell/sidebar'
import { Topbar } from '@/components/dashboard/shell/topbar'
import { Eye, X } from 'lucide-react'

// View components — the overview is fully implemented; the others are stubs
// that will be overwritten by later agents (5-a / 5-b / 5-c / 5-d).
import OverviewView from '@/components/dashboard/views/overview'
import StatsView from '@/components/dashboard/views/stats'
import IntegrationView from '@/components/dashboard/views/integration'
import SubscriptionView from '@/components/dashboard/views/subscription'
import PaymentView from '@/components/dashboard/views/payment'
import SupportView from '@/components/dashboard/views/support'
import AuditView from '@/components/dashboard/views/audit'
import SettingsView from '@/components/dashboard/views/settings'

const APP_VERSION = 'v0.1.0'

/** View registry — only developer views are mapped here.
 *  Public views (landing/login/…), owner-dashboard, renew and platform-admin
 *  are handled outside the shell by `src/app/page.tsx`. */
const VIEW_MAP: Partial<Record<ViewKey, React.ComponentType>> = {
  dashboard: OverviewView,
  stats: StatsView,
  integration: IntegrationView,
  subscription: SubscriptionView,
  payment: PaymentView,
  support: SupportView,
  audit: AuditView,
  settings: SettingsView,
}

export function DashboardShell() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const workspace = useAppStore((s) => s.workspace)
  const previewRole = useAppStore((s) => s.previewRole)
  const setView = useAppStore((s) => s.setView)
  const setPreviewRole = useAppStore((s) => s.setPreviewRole)
  const refreshSession = useAppStore((s) => s.refreshSession)

  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Boot safety net: if the shell mounts without a session (rare, but
  // happens on hard-refresh of an authed route), try to reload it; if the
  // session is still missing, redirect to the public landing.
  React.useEffect(() => {
    if (!user || !workspace) {
      void (async () => {
        await refreshSession()
        const s = useAppStore.getState()
        if (!s.user || !s.workspace) {
          setView('landing')
        }
      })()
    }
  }, [])

  // If a Developer has switched on the Owner preview, route them to the
  // owner-dashboard view (which page.tsx renders outside the shell).
  React.useEffect(() => {
    if (
      previewRole === 'OWNER' &&
      view !== 'owner-dashboard' &&
      view !== 'renew'
    ) {
      setView('owner-dashboard')
    }
  }, [previewRole, view, setView])

  const exitPreview = () => {
    setPreviewRole(null)
    setView('dashboard')
  }

  const ActiveView = VIEW_MAP[view] ?? null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Owner preview banner (visible only briefly before the redirect) */}
      {previewRole === 'OWNER' && (
        <div className="flex items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
          <Eye className="size-4 shrink-0" />
          <span>Aperçu du dashboard Owner — lecture seule</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={exitPreview}
          >
            <X className="size-3.5" />
            Quitter
          </Button>
        </div>
      )}

      {/* Body: sidebar + content column */}
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Content column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={() => setMobileOpen(true)} />

          <main
            id="dashboard-main"
            className="flex-1 overflow-x-hidden pb-6"
            aria-label={view}
          >
            {ActiveView ? (
              <ActiveView />
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Redirection en cours…
                  </p>
                </div>
              </div>
            )}
          </main>

          {/* Discrete footer */}
          <footer className="mt-auto border-t border-border bg-background/60 px-4 py-3 text-xs text-muted-foreground">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <span>
                EmailOqui —{' '}
                <a
                  href="https://email.oquitogo.online"
                  className="font-medium text-foreground/80 hover:text-foreground"
                >
                  email.oquitogo.online
                </a>
              </span>
              <span className="font-mono tabular-nums">{APP_VERSION}</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default DashboardShell
