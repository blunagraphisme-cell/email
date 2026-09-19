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
      // OWNER: always has access to owner-dashboard + support (no subscription gate)
      // The owner is a guest — they can view stats but can't pay or configure.
      if (workspace.memberRole === 'OWNER') {
        const ownerViews: ViewKey[] = ['owner-dashboard', 'support']
        if (!ownerViews.includes(view)) {
          setView('owner-dashboard')
        }
        return
      }

      // DEVELOPER: subscription gate applies — must pay before accessing dashboard
      const subStatus = workspace.subscriptionStatus
      const isSubscriptionActive = subStatus === 'ACTIF' || subStatus === 'EXPIRANT_BIENTOT'

      const unlockedViews: ViewKey[] = ['subscription', 'payment', 'payment-method', 'owner', 'support', 'settings']

      if (!isSubscriptionActive) {
        if (!unlockedViews.includes(view)) {
          setView('subscription')
        }
        return
      }

      // Subscription active → full developer access
      const devViews: ViewKey[] = [
        'dashboard', 'stats', 'integration',
        'subscription', 'payment', 'payment-method', 'owner', 'support', 'audit', 'settings',
      ]
      if (!devViews.includes(view)) {
        setView('dashboard')
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
  const isOwner = !!workspace && workspace.memberRole === 'OWNER'

  return (
    <>
      {/* Platform Admin dashboard — full-screen */}
      {isPlatformAdmin && <PlatformAdminDashboard />}

      {/* Public marketing site — shown when not authed */}
      {!user && <MarketingSite activeView={view} />}

      {/* Authed Owner → always OwnerDashboard (never DashboardShell) */}
      {isAuthed && isOwner && view !== 'renew' && <OwnerDashboard />}

      {/* Authed Developer → DashboardShell (subscription gated by useEffect above) */}
      {isAuthed && !isOwner && view !== 'renew' && <DashboardShell />}

      {/* Renew view (both roles) */}
      {isAuthed && view === 'renew' && <RenewView />}

      {/* Auth modal (overlay) */}
      <AuthModal />
    </>
  )
}
