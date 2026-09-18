/**
 * EmailOqui — Application store (Zustand)
 * Gère la navigation côté client (routeur de vue), la session simulée, et le panier UI.
 *
 * NOTE: la vraie session est sécurisée côté serveur (cookie httpOnly via /api/auth/*).
 * Ce store ne conserve que l'objet "user" renvoyé par /api/auth/me pour l'affichage.
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewKey =
  // Public
  | 'landing'
  | 'features'
  | 'pricing'
  | 'contact'
  | 'legal'
  | 'login'
  | 'signup'
  | 'forgot'
  // Authed
  | 'dashboard'
  | 'campaigns'
  | 'campaign-new'
  | 'campaign-detail'
  | 'editor'
  | 'contacts'
  | 'lists'
  | 'automations'
  | 'templates'
  | 'stats'
  | 'subscription'
  | 'domain'
  | 'apikeys'
  | 'support'
  | 'audit'
  | 'settings'
  | 'renew'
  | 'owner-dashboard'

export type Role = 'DEVELOPER' | 'OWNER' | 'PLATFORM_ADMIN'

export interface SessionUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: Role
  emailVerified: boolean
}

export interface WorkspaceInfo {
  id: string
  name: string
  status: string
  timezone: string
  planCode?: string
  planName?: string
  subscriptionStatus?: string
  subscriptionEnd?: string | null
  dailyEmailLimit?: number
  emailsSentToday?: number
  memberRole: Role
}

interface AppState {
  view: ViewKey
  viewParam: string | null // e.g. campaignId, planCode
  user: SessionUser | null
  workspace: WorkspaceInfo | null
  // role switch: a Developer can preview the Owner dashboard
  previewRole: Role | null
  // ui
  authModalOpen: boolean
  authMode: 'login' | 'signup'
  sidebarCollapsed: boolean
  // actions
  setView: (v: ViewKey, param?: string | null) => void
  setUser: (u: SessionUser | null) => void
  setWorkspace: (w: WorkspaceInfo | null) => void
  setPreviewRole: (r: Role | null) => void
  openAuth: (mode: 'login' | 'signup') => void
  closeAuth: () => void
  toggleSidebar: () => void
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: 'landing',
      viewParam: null,
      user: null,
      workspace: null,
      previewRole: null,
      authModalOpen: false,
      authMode: 'login',
      sidebarCollapsed: false,
      setView: (v, param = null) => {
        set({ view: v, viewParam: param })
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        }
      },
      setUser: (u) => set({ user: u }),
      setWorkspace: (w) => set({ workspace: w }),
      setPreviewRole: (r) => set({ previewRole: r }),
      openAuth: (mode) => set({ authModalOpen: true, authMode: mode }),
      closeAuth: () => set({ authModalOpen: false }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch {}
        set({ user: null, workspace: null, view: 'landing', viewParam: null, previewRole: null })
      },
      refreshSession: async () => {
        try {
          const res = await fetch('/api/auth/me', { cache: 'no-store' })
          if (!res.ok) {
            set({ user: null, workspace: null })
            return
          }
          const data = await res.json()
          if (data.success) {
            set({ user: data.user, workspace: data.workspace })
          } else {
            set({ user: null, workspace: null })
          }
        } catch {
          set({ user: null, workspace: null })
        }
      },
    }),
    {
      name: 'emailoqui-store',
      // Ne pas persister user/workspace (sécurité: la session est gérée serveur)
      partialize: (s) => ({
        view: s.view,
        sidebarCollapsed: s.sidebarCollapsed,
        previewRole: s.previewRole,
      }),
    }
  )
)
