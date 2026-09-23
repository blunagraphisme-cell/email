'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus, Copy, Trash2, CheckCircle2, Clock, Mail, Loader2, Crown, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  EN_ATTENTE: { label: 'En attente', cls: 'border-foreground/20 bg-muted text-muted-foreground', icon: Clock },
  ACCEPTEE: { label: 'Acceptée', cls: 'border-foreground/30 bg-foreground/10 text-foreground', icon: CheckCircle2 },
  EXPIREE: { label: 'Expirée', cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: AlertCircle },
  ANNULE: { label: 'Annulée', cls: 'border-destructive/30 bg-destructive/10 text-destructive', icon: AlertCircle },
}

export function OwnerView() {
  const workspace = useAppStore((s) => s.workspace)
  const [invitations, setInvitations] = React.useState<Invitation[]>([])
  const [members, setMembers] = React.useState<{ id: string; userId: string; email: string; role: string; status: string; firstName: string | null; lastName: string | null }[]>([])
  const [loading, setLoading] = React.useState(true)
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [newlyCreated, setNewlyCreated] = React.useState<{ inviteUrl: string; email: string; emailSent: boolean; emailError: string | null } | null>(null)

  const fetchInvitations = React.useCallback(async () => {
    setLoading(true)
    try {
      const [invRes, memRes] = await Promise.all([
        fetch('/api/invitations', { cache: 'no-store' }),
        fetch('/api/workspace/members', { cache: 'no-store' }),
      ])
      const invData = await invRes.json()
      const memData = await memRes.json()
      if (invData.success) setInvitations(invData.invitations)
      if (memData.success) setMembers(memData.members)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const handleRemoveMember = async (email: string) => {
    const member = members.find((m) => m.email === email)
    if (!member) return
    if (!confirm(`Retirer ${email} du workspace ? Il perdra accès à son tableau de bord.`)) return
    try {
      const res = await fetch(`/api/workspace/members?userId=${member.userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success(`${email} retiré du workspace.`)
        await fetchInvitations()
      } else {
        toast.error(data.error?.message ?? 'Échec')
      }
    } catch {
      toast.error('Erreur réseau.')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('E-mail invalide.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error?.message ?? 'Erreur lors de l’invitation.')
        return
      }
      setNewlyCreated({ inviteUrl: data.inviteUrl, email: data.invitation.email, emailSent: data.emailSent, emailError: data.emailError })
      setInviteEmail('')
      await fetchInvitations()
      if (data.emailSent) {
        toast.success(`E-mail d'invitation envoyé à ${email}`)
      } else {
        toast.info(`Invitation créée. Copiez le lien et envoyez-le manuellement à ${email}.`)
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/invitations?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        await fetchInvitations()
        toast.success('Invitation annulée.')
      } else {
        toast.error('Échec de l’annulation.')
      }
    } catch {
      toast.error('Erreur réseau.')
    }
  }

  const copyToClipboard = (text: string, label = 'Copié') => {
    navigator.clipboard.writeText(text).then(() => toast.success(label))
  }

  const pendingInvites = invitations.filter((i) => i.status === 'EN_ATTENTE')
  const acceptedMembers = invitations.filter((i) => i.status === 'ACCEPTEE')

  return (
    <main className="flex-1">
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight">Propriétaire du workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invitez le propriétaire de l'entreprise à accéder à son tableau de bord. Il verra uniquement les statistiques et l'abonnement — aucune configuration technique.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          {/* Current owner card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="size-5" />
                Propriétaire actuel
              </CardTitle>
              <CardDescription>
                Le propriétaire a accès au tableau de bord simplifié (statistiques + abonnement).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedMembers.length === 0 ? (
                <div className="flex items-center gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <AlertCircle className="size-4" />
                  Aucun propriétaire n’a encore accepté l’invitation. Invitez-le ci-dessous.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {acceptedMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-border p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-foreground/10 text-foreground">
                          <Crown className="size-4" />
                        </span>
                        <div>
                          <div className="text-sm font-medium">{m.email}</div>
                          <div className="text-xs text-muted-foreground">Acceptée le {new Date(m.acceptedAt ?? m.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-foreground/30 bg-foreground/10 text-foreground text-xs">Propriétaire</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(m.email)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="size-5" />
                Inviter un propriétaire
              </CardTitle>
              <CardDescription>
                Saisissez l’e-mail du propriétaire. Un lien d'invitation unique sera généré (valable 7 jours).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleInvite}>
                <div className="flex-1">
                  <Label htmlFor="invite-email" className="text-xs">E-mail du propriétaire</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="proprietaire@entreprise.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                  Inviter
                </Button>
              </form>

              {/* Newly created invitation — show link once */}
              {newlyCreated && (
                <div className="mt-4 rounded-md border border-foreground/30 bg-foreground/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="size-4 text-foreground" />
                    {newlyCreated.emailSent
                      ? `E-mail envoyé à ${newlyCreated.email}`
                      : `Lien généré pour ${newlyCreated.email}`}
                  </div>
                  {newlyCreated.emailSent ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Le propriétaire recevra un e-mail avec le lien d'invitation. Il peut aussi le copier ci-dessous.
                    </p>
                  ) : (
                    <div className="mt-1 flex flex-col gap-1">
                      <p className="text-xs text-muted-foreground">
                        L'e-mail n'a pas pu être envoyé automatiquement. Copiez ce lien et envoyez-le manuellement.
                      </p>
                      {newlyCreated.emailError && (
                        <p className="text-xs text-destructive">
                          Erreur: {newlyCreated.emailError}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto rounded-md bg-background p-2 text-xs font-mono">
                      {newlyCreated.inviteUrl}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(newlyCreated.inviteUrl, 'Lien copié')}>
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invitations en attente ({pendingInvites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {pendingInvites.map((inv) => {
                    const Status = STATUS_META[inv.status]?.icon ?? Clock
                    return (
                      <div key={inv.id} className="flex items-center justify-between rounded-md border border-border p-3">
                        <div className="flex items-center gap-3">
                          <Mail className="size-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium">{inv.email}</div>
                            <div className="text-xs text-muted-foreground">
                              Expire le {new Date(inv.expiresAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${STATUS_META[inv.status]?.cls}`}>
                            <Status className="mr-1 size-3" />
                            {STATUS_META[inv.status]?.label ?? inv.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(inv.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All invitations history */}
          {invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historique des invitations ({invitations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                          <th className="py-2 pr-3">E-mail</th>
                          <th className="py-2 pr-3">Statut</th>
                          <th className="py-2 pr-3">Créée le</th>
                          <th className="py-2 pr-3">Expire</th>
                          <th className="py-2 pr-3">Acceptée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((inv) => (
                          <tr key={inv.id} className="border-b border-border/60 hover:bg-muted/40">
                            <td className="py-2 pr-3 font-medium">{inv.email}</td>
                            <td className="py-2 pr-3">
                              <Badge variant="outline" className={`text-xs ${STATUS_META[inv.status]?.cls ?? ''}`}>
                                {STATUS_META[inv.status]?.label ?? inv.status}
                              </Badge>
                            </td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{new Date(inv.expiresAt).toLocaleDateString('fr-FR')}</td>
                            <td className="py-2 pr-3 text-xs text-muted-foreground">{inv.acceptedAt ? new Date(inv.acceptedAt).toLocaleDateString('fr-FR') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

export default OwnerView
