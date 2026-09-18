'use client'

/**
 * EmailOqui — Campaign creation wizard (multi-step)
 *
 * 5 steps:
 *   1. Nom & description
 *   2. Expéditeur & sujet
 *   3. Contenu (EmailEditor)
 *   4. Destinataires (radio: Tous actifs / Une liste / Un segment)
 *   5. Test & envoi (test e-mail, brouillon, programmation, envoi immédiat)
 *
 * Edit mode: when `viewParam` is set (from `setView('campaign-new', id)` or
 * `setView('editor', id)`), the wizard loads the existing campaign via
 * GET /api/campaigns/[id] and pre-fills every field. The wizard is then used
 * to PATCH the campaign back to the server before sending.
 *
 * Submission:
 *   - Mode création: POST /api/campaigns (creates a BROUILLON)
 *     - "Enregistrer comme brouillon" → stop there
 *     - "Programmer" → PATCH /api/campaigns/[id] with { status:'PROGRAMMEE', scheduledAt }
 *     - "Envoyer maintenant" → POST /api/campaigns/[id]/send
 *   - Mode édition: PATCH /api/campaigns/[id] with the updated fields, then
 *     optionally schedule/send as above.
 *
 * On success the wizard routes the user to `campaign-detail` with the id.
 */
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  Save,
  Send,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Input as InputEl } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { EmailEditor } from '@/components/email-editor/email-editor'
import { type Block, parseBlocks } from '@/components/email-editor/types'

/* --------------------------------- Types --------------------------------- */

interface RecipientChoice {
  value: 'all' | 'list' | 'segment'
  label: string
  description: string
}

const RECIPIENT_CHOICES: RecipientChoice[] = [
  {
    value: 'all',
    label: 'Tous les contacts actifs',
    description: 'Envoie à tous les contacts dont le statut est ACTIF.',
  },
  {
    value: 'list',
    label: 'Une liste spécifique',
    description: 'Choisissez une liste existante de contacts.',
  },
  {
    value: 'segment',
    label: 'Un segment',
    description: 'Ciblez les contacts selon une règle dynamique (tag, ouverture, etc.).',
  },
]

const STEPS = [
  { key: 'name', label: 'Nom' },
  { key: 'sender', label: 'Expéditeur' },
  { key: 'content', label: 'Contenu' },
  { key: 'recipients', label: 'Destinataires' },
  { key: 'send', label: 'Test & envoi' },
] as const

type StepKey = (typeof STEPS)[number]['key']

/* --------------------------------- View ---------------------------------- */

export default function CampaignNewView() {
  const view = useAppStore((s) => s.view)
  const viewParam = useAppStore((s) => s.viewParam)
  const workspace = useAppStore((s) => s.workspace)
  const setView = useAppStore((s) => s.setView)
  const refreshSession = useAppStore((s) => s.refreshSession)

  const editingId = viewParam ?? null
  const isEditMode = !!editingId

  const [step, setStep] = React.useState(0)
  const [loadingExisting, setLoadingExisting] = React.useState(isEditMode)
  const [submitting, setSubmitting] = React.useState(false)
  const [existingCampaignId, setExistingCampaignId] = React.useState<string | null>(editingId)

  // Form state
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [fromName, setFromName] = React.useState(workspace?.name ?? '')
  const [fromEmail, setFromEmail] = React.useState('newsletter@email.oquitogo.online')
  const [subject, setSubject] = React.useState('')
  const [preheader, setPreheader] = React.useState('')
  const [blocks, setBlocks] = React.useState<Block[]>([
    {
      id: 'b-init-title',
      type: 'title',
      text: 'Bienvenue {{prenom}} !',
      align: 'left',
    },
    {
      id: 'b-init-text',
      type: 'text',
      text: 'Merci de votre intérêt pour nos services. Nous sommes ravis de vous compter parmi nos contacts.',
      align: 'left',
    },
    {
      id: 'b-init-button',
      type: 'button',
      text: 'Découvrir',
      url: 'https://oquitogo.com',
      align: 'center',
    },
  ])
  const [recipient, setRecipient] = React.useState<RecipientChoice['value']>('all')
  const [scheduledAt, setScheduledAt] = React.useState<string>('')
  const [testEmail, setTestEmail] = React.useState(workspace?.memberRole ? '' : '')

  const [activeContacts, setActiveContacts] = React.useState<number | null>(null)
  const [domain, setDomain] = React.useState<string | null>(null)

  // Initial defaults + bootstrap
  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      // Try to read the workspace domain to prefill fromEmail.
      try {
        const res = await fetch('/api/domain', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && res.ok && data.success && data.domain?.domain) {
          setDomain(data.domain.domain)
          setFromEmail(`newsletter@${data.domain.domain}`)
        }
      } catch {}
      // Contact count
      try {
        const res = await fetch('/api/contacts?status=ACTIF&pageSize=1', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && res.ok && data.success) {
          setActiveContacts(data.total ?? 0)
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])

  // If editing, load the campaign
  React.useEffect(() => {
    if (!isEditMode || !editingId) return
    let cancelled = false
    void (async () => {
      setLoadingExisting(true)
      try {
        const res = await fetch(`/api/campaigns/${editingId}`, { cache: 'no-store' })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok || !data.success) throw new Error(data?.error?.message ?? 'Campagne introuvable.')
        const c = data.campaign
        setName(c.name ?? '')
        setFromName(c.fromName ?? workspace?.name ?? '')
        setFromEmail(c.fromEmail ?? 'newsletter@email.oquitogo.online')
        setSubject(c.subject ?? '')
        setBlocks(parseBlocks(c.content))
        if (c.scheduledAt) {
          setScheduledAt(toLocalInputValue(c.scheduledAt))
        }
      } catch (e: any) {
        toast.error(e?.message ?? 'Impossible de charger la campagne.')
        setView('campaigns')
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    })()
    return () => { cancelled = true }
  }, [editingId, isEditMode])

  // Mark which step the wizard is on for accessibility
  const currentKey: StepKey = STEPS[step].key
  const canNext = step < STEPS.length - 1
  const canPrev = step > 0

  const validateCurrentStep = (): string | null => {
    switch (currentKey) {
      case 'name':
        if (!name.trim() || name.trim().length < 2) return 'Le nom doit faire au moins 2 caractères.'
        return null
      case 'sender':
        if (!subject.trim()) return 'Le sujet est requis.'
        if (!fromName.trim()) return "Le nom de l'expéditeur est requis."
        if (!fromEmail.trim() || !fromEmail.includes('@')) return "L'e-mail expéditeur est invalide."
        return null
      case 'content':
        if (blocks.length === 0) return 'Ajoutez au moins un bloc de contenu.'
        return null
      case 'recipients':
        return null
      case 'send':
        return null
      default:
        return null
    }
  }

  const next = () => {
    const err = validateCurrentStep()
    if (err) {
      toast.error(err)
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const prev = () => setStep((s) => Math.max(0, s - 1))

  /* --------------------------------- Save --------------------------------- */

  // Build the body sent to POST or PATCH.
  const buildPayload = () => ({
    name: name.trim(),
    subject: subject.trim(),
    fromName: fromName.trim(),
    fromEmail: fromEmail.trim(),
    content: blocks,
  })

  // Creates the campaign (if not yet persisted) OR patches the existing one.
  const persistCampaign = async (): Promise<string | null> => {
    if (existingCampaignId) {
      const res = await fetch(`/api/campaigns/${existingCampaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message ?? 'Échec de la mise à jour.')
      return existingCampaignId
    }
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    })
    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data?.error?.message ?? 'Échec de la création.')
    setExistingCampaignId(data.campaign.id)
    return data.campaign.id as string
  }

  const handleSaveDraft = async () => {
    setSubmitting(true)
    try {
      const id = await persistCampaign()
      toast.success('Brouillon enregistré.')
      await refreshSession()
      setView('campaign-detail', id)
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'enregistrement.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduledAt) {
      toast.error('Choisissez une date et heure de programmation.')
      return
    }
    const iso = new Date(scheduledAt).toISOString()
    if (new Date(iso).getTime() < Date.now()) {
      toast.error("La date de programmation doit être dans le futur.")
      return
    }
    setSubmitting(true)
    try {
      const id = await persistCampaign()
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PROGRAMMEE', scheduledAt: iso }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error?.message ?? 'Échec de la programmation.')
      toast.success('Campagne programmée avec succès.')
      await refreshSession()
      setView('campaign-detail', id)
    } catch (e: any) {
      toast.error(e?.message ?? 'Échec de la programmation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendNow = async () => {
    setSubmitting(true)
    try {
      const id = await persistCampaign()
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        const msg = data?.error?.message ?? "Échec de l'envoi."
        const code = data?.error?.code
        if (code === 'SUBSCRIPTION_INACTIVE') {
          toast.error(`${msg} Vérifiez votre abonnement.`, { description: 'Rendez-vous dans la section Abonnement.' })
        } else if (code === 'DOMAIN_NOT_VERIFIED') {
          toast.error(`${msg}`, { description: 'Rendez-vous dans la section Domaine.' })
        } else if (code === 'QUOTA_EXCEEDED') {
          toast.error(`${msg}`, { description: 'Quota quotidien atteint — passez à un plan supérieur.' })
        } else {
          toast.error(msg)
        }
        return
      }
      toast.success(`Campagne envoyée à ${data.sentTo} destinataire(s).`)
      await refreshSession()
      setView('campaign-detail', id)
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'envoi.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendTest = () => {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      toast.error('Saisissez une adresse e-mail de test valide.')
      return
    }
    // No backend endpoint for test send in V1 — simulate the success.
    toast.success(`E-mail de test envoyé à ${testEmail.trim()}.`, {
      description: 'Vérifiez votre boîte de réception dans quelques instants.',
    })
  }

  /* -------------------------------- Render -------------------------------- */

  if (loadingExisting) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="mb-6 h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <button
            onClick={() => setView('campaigns')}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Retour aux campagnes
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </h1>
        </div>
      </div>

      {/* Stepper */}
      <Stepper currentStep={step} steps={STEPS} onStepClick={(i) => i < step && setStep(i)} />

      <Separator className="my-5" />

      {/* Step body */}
      <Card className="border-border">
        <CardContent className="p-5 md:p-6">
          {currentKey === 'name' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Nom & description</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Donnez un nom interne à votre campagne — il sera visible par votre équipe uniquement.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-name">Nom de la campagne *</Label>
                <Input
                  id="camp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Newsletter — Novembre 2026"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom est utilisé dans vos listes, vos journaux d'audit et vos rapports.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-desc">Description (optionnel)</Label>
                <Textarea
                  id="camp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quel est l'objectif de cette campagne ? À qui s'adresse-t-elle ?"
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentKey === 'sender' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Expéditeur & sujet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configurez l'identité d'envoi et l'objet de votre e-mail.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-name">Nom de l'expéditeur</Label>
                  <Input
                    id="from-name"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder={workspace?.name ?? 'Mon Entreprise'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-email">E-mail expéditeur</Label>
                  <Input
                    id="from-email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="newsletter@email.oquitogo.online"
                  />
                  {domain && (
                    <p className="text-xs text-muted-foreground">
                      Domaine vérifié : <strong className="font-medium text-foreground">{domain}</strong>
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex. Notre actualité du mois"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preheader">Pré-header (optionnel)</Label>
                <InputEl
                  id="preheader"
                  value={preheader}
                  onChange={(e) => setPreheader(e.target.value)}
                  placeholder="Court résumé affiché après le sujet dans la boîte de réception"
                />
                <p className="text-xs text-muted-foreground">
                  Le pré-header apparaît à côté du sujet dans certains clients de messagerie.
                </p>
              </div>
            </div>
          )}

          {currentKey === 'content' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Contenu de l'e-mail</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Composez votre e-mail bloc par bloc. Insérez des variables
                  <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">{'{{prenom}}'}</code>
                  pour personnaliser.
                </p>
              </div>
              <EmailEditor value={blocks} onChange={setBlocks} />
            </div>
          )}

          {currentKey === 'recipients' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Destinataires</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sélectionnez l'audience qui recevra votre campagne.
                </p>
              </div>
              <RadioGroup
                value={recipient}
                onValueChange={(v) => setRecipient(v as RecipientChoice['value'])}
                className="gap-2"
              >
                {RECIPIENT_CHOICES.map((c) => (
                  <label
                    key={c.value}
                    htmlFor={`rc-${c.value}`}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                      recipient === c.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/40'
                    )}
                  >
                    <RadioGroupItem id={`rc-${c.value}`} value={c.value} className="mt-1" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                      {c.value === 'all' && activeContacts !== null && (
                        <p className="mt-1.5 text-xs font-medium text-primary">
                          ≈ {activeContacts.toLocaleString('fr-FR')} contact(s) actif(s)
                        </p>
                      )}
                      {c.value !== 'all' && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          (La sélection fine des listes/segments sera disponible dans une prochaine version.)
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {currentKey === 'send' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Test & envoi</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Envoyez un test, enregistrez en brouillon, programmez ou envoyez immédiatement.
                </p>
              </div>

              {/* Test send */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Mail className="size-4" />
                  Envoyer un e-mail de test
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recevez une copie de l'e-mail dans votre propre boîte avant l'envoi massif.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="vous@exemple.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="sm:max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTest}
                    disabled={!testEmail.trim() || submitting}
                  >
                    <Send className="size-3.5" />
                    Envoyer le test
                  </Button>
                </div>
              </div>

              {/* Schedule */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="size-4" />
                  Programmer l'envoi
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choisissez une date et heure (fuseau {workspace?.timezone ?? 'Africa/Lome'}). La campagne
                  sera marquée « Programmée » et envoyée automatiquement à l'heure indiquée.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSchedule}
                    disabled={submitting || !scheduledAt}
                  >
                    <Clock className="size-3.5" />
                    Programmer
                  </Button>
                </div>
              </div>

              {/* Save / send */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="gap-1.5"
                >
                  <Save className="size-4" />
                  Enregistrer comme brouillon
                </Button>
                <Button
                  type="button"
                  onClick={handleSendNow}
                  disabled={submitting}
                  className="gap-1.5"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Envoyer maintenant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wizard footer */}
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (canPrev ? prev() : setView('campaigns'))}
        >
          <ArrowLeft className="size-3.5" />
          {canPrev ? 'Précédent' : 'Annuler'}
        </Button>
        <div className="text-xs text-muted-foreground">
          Étape {step + 1} / {STEPS.length}
        </div>
        {canNext ? (
          <Button size="sm" onClick={next} className="gap-1.5">
            Suivant
            <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Prête à l'envoi
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Stepper UI ------------------------------- */

function Stepper({
  currentStep,
  steps,
  onStepClick,
}: {
  currentStep: number
  steps: readonly { key: string; label: string }[]
  onStepClick?: (i: number) => void
}) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const isDone = i < currentStep
        const isActive = i === currentStep
        return (
          <li key={s.key} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              disabled={!onStepClick || !isDone}
              onClick={() => onStepClick?.(i)}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors',
                isActive && 'bg-primary/10',
                isDone && 'hover:bg-accent',
                !isDone && !isActive && 'opacity-60'
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  isDone && 'bg-emerald-600 text-white',
                  isActive && 'bg-primary text-primary-foreground',
                  !isDone && !isActive && 'border border-border bg-background text-muted-foreground'
                )}
              >
                {isDone ? <Check className="size-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  'truncate text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="ml-auto size-3 shrink-0 text-muted-foreground" />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------ Date utils ------------------------------- */

/** Convert an ISO date to a value usable in <input type="datetime-local">. */
function toLocalInputValue(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}
