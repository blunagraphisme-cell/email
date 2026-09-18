'use client'

import { useEffect } from 'react'
import { useAppStore, ViewKey } from '@/lib/store'
import { MarketingSite } from '@/components/marketing/marketing-site'
import { AuthModal } from '@/components/auth/auth-modal'
import { DashboardShell } from '@/components/dashboard/shell/dashboard-shell'
import { OwnerDashboard } from '@/components/dashboard/views/owner-dashboard'
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

  // If user becomes authenticated but is on a public view, route them to dashboard
  useEffect(() => {
    if (user && workspace) {
      const publicAuthedViews: ViewKey[] = ['login', 'signup', 'forgot', 'landing']
      if (publicAuthedViews.includes(view)) {
        setView(workspace.memberRole === 'OWNER' ? 'owner-dashboard' : 'dashboard')
      }
    }
    if (user && !workspace && view !== 'signup' && view !== 'login') {
      // utilisateur sans workspace — on le laisse voir landing
      setView('landing')
    }
  }, [user, workspace, view, setView])

  const isAuthed = !!user && !!workspace

  return (
    <>
      {/* Public marketing site — shown when not authed OR explicitly viewing public pages */}
      {!isAuthed && (
        <MarketingSite activeView={view} />
      )}
      {isAuthed && view === 'owner-dashboard' && <OwnerDashboard />}
      {isAuthed && view !== 'owner-dashboard' && view !== 'renew' && (
        <DashboardShell />
      )}
      {isAuthed && view === 'renew' && <RenewView />}

      {/* Auth modal (overlay) */}
      <AuthModal />

      {/* Public sub-views rendered inside MarketingSite when not authed.
          When authed and viewing public pages (legal, contact, pricing, features),
          we still show MarketingSite to keep the public UX consistent. */}
    </>
  )
}
