'use client'

import * as React from 'react'
import { Mail, Sparkles, Loader2, AlertCircle } from 'lucide-react'
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

const DEMO_EMAIL = 'blunagraphisme@gmail.com'
const DEMO_PASSWORD = 'Antoine@228'

function randomDemoEmail(): string {
  const n = Math.floor(Math.random() * 1_000_000)
    .toString(36)
    .padStart(6, '0')
  return `demo-${n}@email.oquitogo.online`
}

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

  // login form
  const [loginEmail, setLoginEmail] = React.useState('')
  const [loginPassword, setLoginPassword] = React.useState('')

  // signup form
  const [suFirstName, setSuFirstName] = React.useState('')
  const [suLastName, setSuLastName] = React.useState('')
  const [suEmail, setSuEmail] = React.useState('')
  const [suPassword, setSuPassword] = React.useState('')
  const [suWorkspaceName, setSuWorkspaceName] = React.useState('')
  const [suPlanCode, setSuPlanCode] = React.useState<'STARTER' | 'BUSINESS' | 'PREMIUM'>('STARTER')

  // forgot form
  const [forgotEmail, setForgotEmail] = React.useState('')

  // sync tab with authMode coming from openAuth()
  React.useEffect(() => {
    if (authModalOpen) {
      setTab(storeAuthMode === 'signup' ? 'signup' : 'login')
      setLoading(false)
    }
  }, [authModalOpen, storeAuthMode])

  // Handle Google OAuth error redirect (?google_error=...)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
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
      // Clean the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('google_error')
      window.history.replaceState({}, '', url.toString())
      // Open the auth modal so the user can retry
      useAppStore.getState().openAuth('login')
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
    setSuPlanCode('STARTER')
    setForgotEmail('')
  }

  const handleClose = () => {
    resetForms()
    setLoading(false)
    closeAuth()
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
      setUser(data.user)
      handleClose()
      toast.success('Connexion réussie. Bienvenue !')
      const role = (data.user?.role as string) || 'USER'
      setView(role === 'PLATFORM_ADMIN' ? 'owner-dashboard' : 'dashboard')
    } catch {
      toast.error('Une erreur réseau est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmitSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (suPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (suWorkspaceName.trim().length < 2) {
      toast.error('Le nom du workspace est trop court.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: suEmail.trim(),
          password: suPassword,
          firstName: suFirstName.trim() || undefined,
          lastName: suLastName.trim() || undefined,
          workspaceName: suWorkspaceName.trim(),
          planCode: suPlanCode,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const msg = data?.error?.message ?? 'Inscription impossible.'
        toast.error(msg)
        return
      }
      setUser(data.user)
      setWorkspace(data.workspace)
      toast.success('Compte créé ! Votre espace est prêt.')
      handleClose()
      setView('dashboard')

      // Seed demo data so dashboard displays stats immediately
      try {
        await fetch('/api/seed/demo', { method: 'POST' })
        toast('Données démo chargées', {
          description: 'Vos contacts, campagnes et templates sont prêts.',
          icon: <Sparkles className="size-4 text-primary" />,
        })
      } catch {
        // best effort
      } finally {
        await refreshSession()
      }
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

  const fillDemoCredentials = () => {
    setLoginEmail(DEMO_EMAIL)
    setLoginPassword(DEMO_PASSWORD)
    toast.info('Identifiants Platform Admin renseignés.')
  }

  const fillDemoSignup = () => {
    const email = randomDemoEmail()
    setSuEmail(email)
    setSuPassword('demo1234')
    setSuFirstName('Utilisateur')
    setSuLastName('Démo')
    setSuWorkspaceName('Mon Entreprise')
    setSuPlanCode('STARTER')
    toast.info('Compte démo pré-rempli — cliquez sur « Créer mon compte ».')
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

              <div className="mt-2 rounded-md border border-dashed border-border bg-secondary/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">Compte démo Platform Admin</span>
                    <span className="text-[11px] text-muted-foreground">
                      {DEMO_EMAIL} / {DEMO_PASSWORD}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={fillDemoCredentials}
                  >
                    Utiliser
                  </Button>
                </div>
              </div>
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="su-workspace">Nom du workspace</Label>
                <Input
                  id="su-workspace"
                  placeholder="Mon Entreprise"
                  value={suWorkspaceName}
                  onChange={(e) => setSuWorkspaceName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="su-plan">Plan souhaité</Label>
                <Select
                  value={suPlanCode}
                  onValueChange={(v) => setSuPlanCode(v as 'STARTER' | 'BUSINESS' | 'PREMIUM')}
                >
                  <SelectTrigger id="su-plan" className="w-full">
                    <SelectValue placeholder="Choisir un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTER">Starter — 20 USD / 3 mois</SelectItem>
                    <SelectItem value="BUSINESS">Business — 45 USD / 3 mois</SelectItem>
                    <SelectItem value="PREMIUM">Premium — 80 USD / 3 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
              <Button
                type="button"
                variant="outline"
                onClick={fillDemoSignup}
                disabled={loading}
              >
                <Sparkles className="size-4" />
                Créer un compte de démo
              </Button>
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
