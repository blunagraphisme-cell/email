'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Bell,
  ShieldCheck,
  Trash2,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  Mail,
  CreditCard,
  AlertTriangle,
  Lock,
} from 'lucide-react'

/* ----------------------------- timezones list ---------------------------- */

const TIMEZONES: { label: string; value: string }[] = [
  { label: '(GMT+00:00) UTC', value: 'UTC' },
  { label: '(GMT+00:00) Casablanca', value: 'Africa/Casablanca' },
  { label: '(GMT+00:00) Londres', value: 'Europe/London' },
  { label: '(GMT+01:00) Lomé', value: 'Africa/Lome' },
  { label: '(GMT+01:00) Paris', value: 'Europe/Paris' },
  { label: '(GMT+01:00) Berlin', value: 'Europe/Berlin' },
  { label: '(GMT+01:00) Lagos', value: 'Africa/Lagos' },
  { label: '(GMT+02:00) Le Cap', value: 'Africa/Johannesburg' },
  { label: '(GMT+02:00) Le Caire', value: 'Africa/Cairo' },
  { label: '(GMT+02:00) Athènes', value: 'Europe/Athens' },
  { label: '(GMT+03:00) Nairobi', value: 'Africa/Nairobi' },
  { label: '(GMT+03:00) Moscou', value: 'Europe/Moscow' },
  { label: '(GMT+05:30) Mumbai', value: 'Asia/Kolkata' },
  { label: '(GMT+08:00) Singapour', value: 'Asia/Singapore' },
  { label: '(GMT-05:00) New York', value: 'America/New_York' },
  { label: '(GMT-08:00) Los Angeles', value: 'America/Los_Angeles' },
]

/* --------------------------- notification types --------------------------- */

interface NotifType {
  key: string
  label: string
  description: string
}

const NOTIF_TYPES: NotifType[] = [
  { key: 'invitation', label: 'Invitations', description: 'Quand un membre est invité au workspace.' },
  { key: 'payment', label: 'Paiements', description: 'Confirmation et reçus de paiement.' },
  { key: 'activation', label: 'Activation de campagne', description: 'Quand une campagne démarre.' },
  { key: 'expiration', label: 'Expiration', description: 'Avant l\'expiration de l\'abonnement.' },
  { key: 'quota', label: 'Quota', description: 'Quand le quota quotidien atteint 80%.' },
  { key: 'domain', label: 'Domaine', description: 'Changements de statut du domaine d\'envoi.' },
  { key: 'ticket', label: 'Tickets support', description: 'Réponses et mises à jour de vos tickets.' },
]

/* ----------------------------- mock sessions ----------------------------- */

const MOCK_SESSIONS: { id: string; device: 'desktop' | 'mobile' | 'tablet'; label: string; lastActive: string; current: boolean }[] = [
  { id: 's1', device: 'desktop', label: 'Chrome — macOS', lastActive: 'Maintenant', current: true },
  { id: 's2', device: 'mobile', label: 'Safari — iPhone', lastActive: 'Il y a 2 heures', current: false },
  { id: 's3', device: 'desktop', label: 'Firefox — Windows', lastActive: 'Il y a 3 jours', current: false },
]

function DeviceIcon({ device }: { device: 'desktop' | 'mobile' | 'tablet' }) {
  const Icon = device === 'desktop' ? Monitor : device === 'mobile' ? Smartphone : Tablet
  return <Icon className="size-4" />
}

/* --------------------------------- View ---------------------------------- */

export default function SettingsView() {
  const user = useAppStore((s) => s.user)
  const workspace = useAppStore((s) => s.workspace)
  const logout = useAppStore((s) => s.logout)

  const isOwner = workspace?.memberRole === 'OWNER'

  // Profile form
  const [profile, setProfile] = React.useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  })

  // Workspace form
  const [ws, setWs] = React.useState({
    name: workspace?.name ?? '',
    timezone: workspace?.timezone ?? 'Africa/Lome',
  })

  // Notifications state
  const [notifs, setNotifs] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(NOTIF_TYPES.map((n) => [n.key, true])),
  )

  // Password form
  const [password, setPassword] = React.useState({
    current: '',
    next: '',
    confirm: '',
  })

  // 2FA
  const [twoFA, setTwoFA] = React.useState(false)

  // Sync profile form when user changes (e.g., after refresh)
  React.useEffect(() => {
    setProfile({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
    })
  }, [user])

  React.useEffect(() => {
    setWs({
      name: workspace?.name ?? '',
      timezone: workspace?.timezone ?? 'Africa/Lome',
    })
  }, [workspace])

  const saveProfile = () => {
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      toast.error('Le prénom et le nom sont requis.')
      return
    }
    toast.success('Profil mis à jour avec succès.')
  }

  const saveWorkspace = () => {
    if (!ws.name.trim()) {
      toast.error('Le nom du workspace est requis.')
      return
    }
    toast.success('Workspace mis à jour avec succès.')
  }

  const submitPassword = () => {
    if (!password.current || !password.next || !password.confirm) {
      toast.error('Tous les champs sont requis.')
      return
    }
    if (password.next.length < 8) {
      toast.error('Le nouveau mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (password.next !== password.confirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    toast.success('Mot de passe modifié avec succès.')
    setPassword({ current: '', next: '', confirm: '' })
  }

  const deleteWorkspace = () => {
    toast.success('Workspace marqué pour suppression. Vous allez être déconnecté.')
    setTimeout(() => void logout(), 1200)
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-2">
        <SettingsIcon className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Paramètres</h1>
          <p className="text-xs text-muted-foreground">
            Gérez votre profil, votre workspace et vos préférences.
          </p>
        </div>
      </header>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex w-full max-w-2xl overflow-x-auto sm:w-auto">
          <TabsTrigger value="profile">
            <User className="size-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          {!isOwner && (
            <TabsTrigger value="workspace">
              <Building2 className="size-4" />
              <span className="hidden sm:inline">Workspace</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications">
            <Bell className="size-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------ Profile ------------------------------ */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Profil
              </CardTitle>
              <CardDescription>Vos informations personnelles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="first-name" className="text-xs">Prénom</Label>
                  <Input
                    id="first-name"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    placeholder="Awa"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last-name" className="text-xs">Nom</Label>
                  <Input
                    id="last-name"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted/40 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  L&apos;adresse e-mail ne peut pas être modifiée ici. Contactez le support pour
                  toute demande de changement.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={saveProfile}>
                  Mettre à jour le profil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------- Workspace ----------------------------- */}
        {!isOwner && (
          <TabsContent value="workspace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-4 text-primary" />
                  Workspace
                </CardTitle>
                <CardDescription>
                  Configuration générale du workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ws-name" className="text-xs">Nom du workspace</Label>
                  <Input
                    id="ws-name"
                    value={ws.name}
                    onChange={(e) => setWs({ ...ws, name: e.target.value })}
                    placeholder="Mon Entreprise"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tz" className="text-xs">Fuseau horaire</Label>
                  <Select value={ws.timezone} onValueChange={(v) => setWs({ ...ws, timezone: v })}>
                    <SelectTrigger id="tz" className="w-full sm:w-[360px]">
                      <SelectValue placeholder="Sélectionner un fuseau horaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Utilisé pour les rapports, la planification des campagnes et les horodatages.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={saveWorkspace}>
                    Mettre à jour le workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* --------------------------- Notifications --------------------------- */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="size-4 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choisissez les e-mails que vous souhaitez recevoir.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {NOTIF_TYPES.map((n) => (
                <div
                  key={n.key}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.description}</p>
                  </div>
                  <Switch
                    checked={notifs[n.key] ?? false}
                    onCheckedChange={(checked) =>
                      setNotifs((prev) => ({ ...prev, [n.key]: checked }))
                    }
                    aria-label={`Activer les notifications ${n.label}`}
                  />
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={() => toast.success('Préférences enregistrées.')}
                >
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------- Security ----------------------------- */}
        <TabsContent value="security" className="space-y-6">
          {/* Change password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4 text-primary" />
                Mot de passe
              </CardTitle>
              <CardDescription>
                Changez votre mot de passe régulièrement pour sécuriser votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cur-pw" className="text-xs">Mot de passe actuel</Label>
                  <Input
                    id="cur-pw"
                    type="password"
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw" className="text-xs">Nouveau mot de passe</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={password.next}
                    onChange={(e) => setPassword({ ...password, next: e.target.value })}
                    placeholder="Au moins 8 caractères"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conf-pw" className="text-xs">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="conf-pw"
                    type="password"
                    value={password.confirm}
                    onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={submitPassword}>
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-primary" />
                Authentification à deux facteurs
              </CardTitle>
              <CardDescription>
                Ajoutez une couche de sécurité supplémentaire à votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-3">
                <div>
                  <p className="text-sm font-medium">2FA par application</p>
                  <p className="text-xs text-muted-foreground">
                    Bientôt disponible. Activez la 2FA pour renforcer votre sécurité.
                  </p>
                </div>
                <Switch
                  checked={twoFA}
                  onCheckedChange={setTwoFA}
                  disabled
                  aria-label="Activer l'authentification à deux facteurs"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">
                  Bientôt disponible
                </span>{' '}
                — L&apos;activation de la 2FA sera proposée dans une prochaine version.
              </p>
            </CardContent>
          </Card>

          {/* Active sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="size-4 text-primary" />
                Sessions actives
              </CardTitle>
              <CardDescription>
                Appareils actuellement connectés à votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_SESSIONS.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <DeviceIcon device={s.device} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {s.lastActive}
                      </p>
                    </div>
                  </div>
                  {s.current ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Cet appareil
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => toast.success('Session révoquée.')}
                    >
                      Révoquer
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangle className="size-4" />
                Zone de danger
              </CardTitle>
              <CardDescription>
                Actions irréversibles. Procédez avec prudence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Trash2 className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Supprimer ce workspace
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Toutes les campagnes, contacts, modèles et données seront définitivement
                      effacés. Cette action est irréversible.
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button" className="shrink-0">
                      <Trash2 className="size-4" />
                      Supprimer le workspace
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression du workspace ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est{' '}
                        <strong className="text-destructive">irréversible</strong>. Toutes les
                        données associées au workspace «{' '}
                        <strong>{workspace?.name ?? 'Mon Entreprise'}</strong> » seront
                        définitivement supprimées (campagnes, contacts, modèles, automatisations,
                        journaux, etc.). Saisissez la confirmation ci-dessous pour continuer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <ConfirmDeleteInput
                      workspaceName={workspace?.name ?? 'Mon Entreprise'}
                      onConfirm={deleteWorkspace}
                    />
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Footer info row */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Mail className="size-3.5" />
              {user?.email ?? '—'}
            </span>
            <span className="flex items-center gap-2">
              <CreditCard className="size-3.5" />
              {workspace?.planName ?? '—'} · {workspace?.memberRole ?? '—'}
            </span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------------------- Confirm-delete dialog content -------------------- */

function ConfirmDeleteInput({
  workspaceName,
  onConfirm,
}: {
  workspaceName: string
  onConfirm: () => void
}) {
  const [value, setValue] = React.useState('')
  const matches = value.trim() === workspaceName.trim()
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="confirm-name" className="text-xs">
          Pour confirmer, saisissez le nom du workspace : <strong>{workspaceName}</strong>
        </Label>
        <Input
          id="confirm-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={workspaceName}
          aria-label="Confirmer le nom du workspace"
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction
          disabled={!matches}
          onClick={(e) => {
            e.preventDefault()
            if (matches) onConfirm()
          }}
          className="bg-destructive text-white hover:bg-destructive/90"
        >
          Supprimer définitivement
        </AlertDialogAction>
      </AlertDialogFooter>
    </div>
  )
}
