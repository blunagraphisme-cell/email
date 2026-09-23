'use client'

import * as React from 'react'
import { Mail, Loader2, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { GoogleButton } from '@/components/auth/google-button'
import { toast } from 'sonner'

type TabKey = 'login' | 'signup' | 'forgot'

export function AuthModal() {
  const authModalOpen = useAppStore((s) => s.authModalOpen)
  const storeAuthMode = useAppStore((s) => s.authMode)
  const closeAuth = useAppStore((s) => s.closeAuth)
  const setUser = useAppStore((s) => s.setUser)
  const setWorkspace = useAppStore((s) => s.setWorkspace)
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)

  const [tab, setTab] = React.useState<TabKey>('login')
  const [loading, setLoading] = React.useState(false)
  const [inviteInfo, setInviteInfo] = React.useState<{ workspaceName: string; invitedBy: string; email: string; role: string } | null>(null)

  // login form
  const [loginEmail, setLoginEmail] = React.useState('')
  const [loginPassword, setLoginPassword] = React.useState('')

  // signup form
  const [suFirstName, setSuFirstName] = React.useState('')
  const [suLastName, setSuLastName] = React.useState('')
  const [suEmail, setSuEmail] = React.useState('')
  const [suPassword, setSuPassword] = React.useState('')
  const [suWorkspaceName, setSuWorkspaceName] = React.useState('')
  const [suPlanCode, setSuPlanCode] = React.useState<'STARTER_3M' | 'STARTER_6M' | 'STARTER_1Y' | 'STARTER_2Y' | 'BUSINESS_3M' | 'BUSINESS_6M' | 'BUSINESS_1Y' | 'BUSINESS_2Y' | 'PREMIUM_3M' | 'PREMIUM_6M' | 'PREMIUM_1Y' | 'PREMIUM_2Y'>('STARTER_3M')

  // forgot form
  const [forgotEmail, setForgotEmail] = React.useState('')

  // sync tab with authMode coming from openAuth()
  React.useEffect(() => {
    if (authModalOpen) {
      setTab(storeAuthMode === 'signup' ? 'signup' : 'login')
      setLoading(false)
    }
  }, [authModalOpen, storeAuthMode])

  // Handle ?google_error=... + ?invite=TOKEN detection
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Google OAuth error
    const params = new URLSearchParams(window.location.search)
    const err = params.get('google_error')
    if (err) {
      const messages: Record<string, string> = {
        access_denied: 'Connexion Google annulée.',
        invalid_callback: 'Réponse Google invalide. Réessayez.',
        state_mismatch: 'Session expirée. Réessayez la connexion Google.',
        token_exchange_failed: 'Échange de code Google échoué. Vérifiez la configuration.',
        userinfo_failed: 'Impossible de récupérer vos informations Google.',
        no_email: 'Aucun e-mail reçu de Google.',
        account_suspended: 'Votre compte EmailOqui est suspendu. Contactez le support.',
        oauth_not_configured: 'Connexion Google non configurée. Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET au .env.',
      }
      toast.error(messages[err] ?? 'Erreur de connexion Google.')
      const url = new URL(window.location.href)
      url.searchParams.delete('google_error')
      window.history.replaceState({}, '', url.toString())
      useAppStore.getState().openAuth('login')
    }

    // 2. Invitation token — validate + open auth modal + show banner
    const inviteToken = params.get('invite') ?? sessionStorage.getItem('eo_invite_token')
    if (inviteToken) {
      sessionStorage.setItem('eo_invite_token', inviteToken)
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
      // Validate the token (get workspace info)
      ;(async () => {
        try {
          const res = await fetch(`/api/invitations/validate?token=${encodeURIComponent(inviteToken)}`, { cache: 'no-store' })
          const data = await res.json()
          if (data.success) {
            const inv = data.invitation
            setInviteInfo(inv)
            setLoginEmail(inv.email)
            setSuEmail(inv.email)
            useAppStore.getState().openAuth(inv.hasAccount ? 'login' : 'signup')
            toast.info(`Invitation à rejoindre « ${inv.workspaceName} »`)
          } else {
            toast.error(data?.error?.message ?? 'Invitation invalide.')
            sessionStorage.removeItem('eo_invite_token')
          }
        } catch {
          // network error — ignore
        }
      })()
    }
  }, [])

  const resetForms = () => {
    setLoginEmail('')
    setLoginPassword('')
    setSuFirstName('')
    setSuLastName('')
    setSuEmail('')
    setSuPassword('')
    setSuWorkspaceName('')
    setSuPlanCode('STARTER_3M')
    setForgotEmail('')
  }

  const handleClose = () => {
    resetForms()
    setLoading(false)
    closeAuth()
  }

  // Accept a pending invitation (if a token is stored in sessionStorage)
  const acceptInvitationIfPending = async (): Promise<boolean> => {
    const token = sessionStorage.getItem('eo_invite_token')
    if (!token) return false
    try {
      // Validate first to get the invitation id
      const valRes = await fetch(`/api/invitations/validate?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      const valData = await valRes.json()
      if (!valData.success) {
        sessionStorage.removeItem('eo_invite_token')
        return false
      }
      const invitationId = valData.invitation.id
      // Accept
      const accRes = await fetch(`/api/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const accData = await accRes.json()
      if (accData.success) {
        sessionStorage.removeItem('eo_invite_token')
        toast.success(`Invitation acceptée. Bienvenue dans « ${valData.invitation.workspaceName} ».`)
        return true
      } else {
        toast.error(accData?.error?.message ?? 'Échec de l’acceptation de l’invitation.')
        sessionStorage.removeItem('eo_invite_token')
        return false
      }
    } catch {
      sessionStorage.removeItem('eo_invite_token')
      return false
    }
  }

  const onSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const msg = data?.error?.message ?? 'E-mail ou mot de passe incorrect.'
        toast.error(msg)
        return
      }
      // refresh session to populate user + workspace
      await refreshSession()
      // Accept pending invitation if any
      const accepted = await acceptInvitationIfPending()
      if (accepted) {
        await refreshSession()
      }
      setUser(data.user)
      handleClose()
      toast.success('Connexion réussie. Bienvenue !')
      const role = (data.user?.role as string) || 'USER'
      if (role === 'PLATFORM_ADMIN') {
        setView('platform-admin-dashboard')
      } else {
        const ws = useAppStore.getState().workspace
        // Owner: always go to owner-dashboard (no subscription gate for owners)
        // Developer: go to subscription page if not paid, else dashboard
        if (ws?.memberRole === 'OWNER') {
          setView('owner-dashboard')
        } else {
          const isSubActive = ws?.subscriptionStatus === 'ACTIF' || ws?.subscriptionStatus === 'EXPIRANT_BIENTOT'
          setView(isSubActive ? 'dashboard' : 'subscription')
        }
      }
    } catch {
      toast.error('Une erreur réseau est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    const inviteToken = typeof window !== 'undefined' ? sessionStorage.getItem('eo_invite_token') : null
    if (suPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (!inviteToken && suWorkspaceName.trim().length < 2) {
      toast.error('Le nom du workspace est trop court.')
      return
    }
    setLoading(true)
    try {
      const inviteToken = sessionStorage.getItem('eo_invite_token')
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: suEmail.trim(),
          password: suPassword,
          firstName: suFirstName.trim() || undefined,
          lastName: suLastName.trim() || undefined,
          workspaceName: inviteToken ? undefined : suWorkspaceName.trim(),
          planCode: suPlanCode,
          inviteToken: inviteToken || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const msg = data?.error?.message ?? 'Inscription impossible.'
        toast.error(msg)
        return
      }
      // Clear invite token if used
      if (inviteToken) {
        sessionStorage.removeItem('eo_invite_token')
      }
      setUser(data.user)
      setWorkspace(data.workspace)
      toast.success(inviteToken
        ? `Invitation acceptée. Bienvenue dans « ${data.workspace?.name} ».`
        : 'Compte créé ! Votre espace est prêt.')
      handleClose()
      // Owner: always go to owner-dashboard
      // Developer: go to subscription if not paid, else dashboard
      const ws = data.workspace
      if (ws?.memberRole === 'OWNER') {
        setView('owner-dashboard')
      } else {
        const isSubActive = ws?.subscriptionStatus === 'ACTIF' || ws?.subscriptionStatus === 'EXPIRANT_BIENTOT'
        setView(isSubActive ? 'dashboard' : 'subscription')
      }

      // No demo seed for invitation signups
    } catch {
      toast.error('Une erreur réseau est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      // No backend endpoint required — simulate send
      await new Promise((r) => setTimeout(r, 500))
      toast.success('Lien envoyé si le compte existe.')
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
 <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Mail className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-lg">Bienvenue sur EmailOqui</DialogTitle>
              <DialogDescription>
                Connectez-vous ou créez un compte pour démarrer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          {/* LOGIN */}
          <TabsContent value="login" className="mt-4">
            <div className="flex flex-col gap-3">
              <GoogleButton label="Continuer avec Google" />
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-[11px] text-muted-foreground">ou</span>
                <Separator className="flex-1" />
              </div>
            </div>
            <form className="mt-3 flex flex-col gap-3" onSubmit={onSubmitLogin}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs font-normal text-muted-foreground"
                    onClick={() => setTab('forgot')}
                  >
                    Mot de passe oublié ?
                  </Button>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="h-10 mt-1">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* SIGNUP */}
          <TabsContent value="signup" className="mt-4">
            <div className="flex flex-col gap-3">
              <GoogleButton label="S'inscrire avec Google" />
              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-[11px] text-muted-foreground">ou créez un compte avec votre e-mail</span>
                <Separator className="flex-1" />
              </div>
            </div>
            <form className="mt-3 flex flex-col gap-3" onSubmit={onSubmitSignup}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="su-first">Prénom</Label>
                  <Input
                    id="su-first"
                    placeholder="Awa"
                    value={suFirstName}
                    onChange={(e) => setSuFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="su-last">Nom</Label>
                  <Input
                    id="su-last"
                    placeholder="Agbode"
                    value={suLastName}
                    onChange={(e) => setSuLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="su-email">E-mail</Label>
                <Input
                  id="su-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                  value={suEmail}
                  onChange={(e) => setSuEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="su-password">Mot de passe (≥ 6 caractères)</Label>
                <Input
                  id="su-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={suPassword}
                  onChange={(e) => setSuPassword(e.target.value)}
                  required
                />
              </div>
              {!inviteInfo && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="su-workspace">Nom du workspace</Label>
                  <Input
                    id="su-workspace"
                    placeholder="Mon Entreprise"
                    value={suWorkspaceName}
                    onChange={(e) => setSuWorkspaceName(e.target.value)}
                    required={!inviteInfo}
                  />
                </div>
              )}
              {!inviteInfo && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="su-plan">Plan souhaité</Label>
                  <Select
                    value={suPlanCode}
                    onValueChange={(v) => setSuPlanCode(v as 'STARTER_3M' | 'STARTER_6M' | 'STARTER_1Y' | 'STARTER_2Y' | 'BUSINESS_3M' | 'BUSINESS_6M' | 'BUSINESS_1Y' | 'BUSINESS_2Y' | 'PREMIUM_3M' | 'PREMIUM_6M' | 'PREMIUM_1Y' | 'PREMIUM_2Y')}
                  >
                    <SelectTrigger id="su-plan" className="w-full">
                      <SelectValue placeholder="Choisir un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER_3M">Starter — 20 USD / 3 mois</SelectItem>
                      <SelectItem value="STARTER_6M">Starter — 38 USD / 6 mois</SelectItem>
                      <SelectItem value="STARTER_1Y">Starter — 74 USD / 1 an</SelectItem>
                      <SelectItem value="STARTER_2Y">Starter — 120 USD / 2 ans</SelectItem>
                      <SelectItem value="BUSINESS_3M">Business — 20 USD / 3 mois</SelectItem>
                      <SelectItem value="BUSINESS_6M">Business — 38 USD / 6 mois</SelectItem>
                      <SelectItem value="BUSINESS_1Y">Business — 74 USD / 1 an</SelectItem>
                      <SelectItem value="BUSINESS_2Y">Business — 120 USD / 2 ans</SelectItem>
                      <SelectItem value="PREMIUM_3M">Premium — 20 USD / 3 mois</SelectItem>
                      <SelectItem value="PREMIUM_6M">Premium — 38 USD / 6 mois</SelectItem>
                      <SelectItem value="PREMIUM_1Y">Premium — 74 USD / 1 an</SelectItem>
                      <SelectItem value="PREMIUM_2Y">Premium — 120 USD / 2 ans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" disabled={loading} className="h-10 mt-1">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Création…
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>

              <div className="mt-1 flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-[11px] text-muted-foreground">ou</span>
                <Separator className="flex-1" />
              </div>
            </form>
          </TabsContent>

          {/* FORGOT */}
          <TabsContent value="forgot" className="mt-4">
            <form className="flex flex-col gap-3" onSubmit={onSubmitForgot}>
              <p className="text-sm text-muted-foreground">
                Saisissez votre e-mail. Si un compte existe, vous recevrez un lien de
                réinitialisation.
              </p>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="h-10 mt-1">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi…
                  </>
                ) : (
                  'Envoyer le lien'
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                className="self-start p-0 text-xs"
                onClick={() => setTab('login')}
              >
                Retour à la connexion
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
