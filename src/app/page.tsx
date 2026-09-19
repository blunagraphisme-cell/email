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

  // Handle ?invite=TOKEN param — store it for the auth-modal to pick up after login/signup
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const inviteToken = params.get('invite')
    if (inviteToken) {
      sessionStorage.setItem('eo_invite_token', inviteToken)
      // Clean the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // Routing logic for authenticated users — reset invalid views
  useEffect(() => {
    if (!user) return
    // Platform Admin → dedicated admin dashboard
    if (user.role === 'PLATFORM_ADMIN') {
      if (view !== 'platform-admin-dashboard') {
        setView('platform-admin-dashboard')
      }
      return
    }
    // Developer or Owner with workspace
    if (workspace) {
      // SUBSCRIPTION GATE: if the subscription is not ACTIF or EXPIRANT_BIENTOT,
      // force the user to the payment/subscription pages. They can't access
      // the dashboard, stats, integration, etc. until they've paid.
      const subStatus = workspace.subscriptionStatus
      const isSubscriptionActive = subStatus === 'ACTIF' || subStatus === 'EXPIRANT_BIENTOT'
      
      // Views accessible WITHOUT an active subscription
      const unlockedViews: ViewKey[] = ['subscription', 'payment', 'support', 'settings']
      
      // Views accessible WITH an active subscription (developer)
      const devViews: ViewKey[] = [
        'dashboard', 'stats', 'integration',
        'subscription', 'payment', 'owner', 'support', 'audit', 'settings',
      ]
      
      // Views accessible WITH an active subscription (owner)
      const ownerViews: ViewKey[] = ['owner-dashboard', 'support']
      
      if (!isSubscriptionActive) {
        // Subscription not active → lock to payment/subscription/support/settings
        if (!unlockedViews.includes(view)) {
          setView('subscription')
        }
        return
      }
      
      // Subscription active → check role-based views
      const validViews = workspace.memberRole === 'OWNER' ? ownerViews : devViews
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
