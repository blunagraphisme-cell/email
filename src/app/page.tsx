'use client'

import { useEffect } from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { MarketingSite } from '@/components/marketing/marketing-site'
import { AuthModal } from '@/components/auth/auth-modal'
import { DashboardShell } from '@/components/dashboard/shell/dashboard-shell'
import { OwnerDashboard } from '@/components/dashboard/views/owner-dashboard'
import { PlatformAdminDashboard } from '@/components/dashboard/views/platform-admin-dashboard'
import { LegalView } from '@/components/marketing/legal-view'
import { ContactView } from '@/components/marketing/contact-view'
import { PricingView } from '@/components/marketing/pricing-view'
import { FeaturesView } from '@/components/marketing/features-view'
import { RenewView } from '@/components/dashboard/views/renew-view'

export default function Home() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const workspace = useAppStore((s) => s.workspace)
  const refreshSession = useAppStore((s) => s.refreshSession)
  const setView = useAppStore((s) => s.setView)

  // boot: load session once on mount
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Routing logic for authenticated users — reset invalid views
  useEffect(() => {
    if (!user) return
    // Platform Admin → dedicated admin dashboard
    if (user.role === 'PLATFORM_ADMIN') {
      // Redirect away from any non-admin view
      if (view !== 'platform-admin-dashboard') {
        setView('platform-admin-dashboard')
      }
      return
    }
    // Developer or Owner with workspace
    if (workspace) {
      const ownerViews: ViewKey[] = ['owner-dashboard', 'support']
      const devViews: ViewKey[] = [
        'dashboard', 'campaigns', 'campaign-new', 'campaign-detail', 'editor',
        'contacts', 'lists', 'automations', 'templates', 'stats',
        'subscription', 'domain', 'apikeys', 'support', 'audit', 'settings',
      ]
      const validViews: ViewKey[] = [...ownerViews, ...devViews]
      // If current view isn't valid for this user, redirect to their default dashboard
      if (!validViews.includes(view)) {
        setView(workspace.memberRole === 'OWNER' ? 'owner-dashboard' : 'dashboard')
      }
      return
    }
    // User without workspace (edge case — shouldn't happen for regular users)
    if (view !== 'signup' && view !== 'login') {
      setView('landing')
    }
  }, [user, workspace, view, setView])

  const isAuthed = !!user && !!workspace
  const isPlatformAdmin = !!user && user.role === 'PLATFORM_ADMIN'

  return (
    <>
      {/* Platform Admin dashboard — full-screen, no MarketingSite/DashboardShell wrapper */}
      {isPlatformAdmin && <PlatformAdminDashboard />}

      {/* Public marketing site — shown when not authed */}
      {!user && <MarketingSite activeView={view} />}

      {/* Authed regular user (Developer or Owner) */}
      {isAuthed && view === 'owner-dashboard' && <OwnerDashboard />}
      {isAuthed && view !== 'owner-dashboard' && view !== 'renew' && (
        <DashboardShell />
      )}
      {isAuthed && view === 'renew' && <RenewView />}

      {/* Auth modal (overlay) */}
      <AuthModal />
    </>
  )
}
