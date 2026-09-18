'use client'

import * as React from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const CONTACTS = [
  { icon: Mail, label: 'E-mail', value: 'support@mailoqui.com', href: 'mailto:support@mailoqui.com' },
  { icon: Phone, label: 'Téléphone', value: '+228 90 00 00 00', href: 'tel:+22890000000' },
  { icon: MapPin, label: 'Adresse', value: 'Lomé, Togo' },
]

export function ContactView() {
  const [submitting, setSubmitting] = React.useState(false)
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const onChange = (key: keyof typeof form, value: string) =>
    setForm((s) => ({ ...s, [key]: value }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Merci de remplir les champs obligatoires.')
      return
    }
    setSubmitting(true)
    // No backend required — simulate latency for UX feedback
    await new Promise((r) => setTimeout(r, 600))
    setSubmitting(false)
    setForm({ name: '', email: '', company: '', message: '' })
    toast.success('Message envoyé — nous vous répondrons sous 24h.')
  }

  return (
    <main className="flex-1">
      <section className="bg-mesh">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Contact</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Parlons de votre projet e-mail
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Une question sur nos offres, une intégration, ou un besoin spécifique ? Notre équipe
            vous répond sous 24h ouvrées.
          </p>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => onChange('name', e.target.value)}
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => onChange('email', e.target.value)}
                      placeholder="vous@exemple.com"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => onChange('company', e.target.value)}
                    placeholder="Nom de votre entreprise"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => onChange('message', e.target.value)}
                    placeholder="Décrivez votre besoin…"
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="h-11 self-start">
                  {submitting ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Coordonnées */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Coordonnées</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {CONTACTS.map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <c.icon className="size-5" />
                    </span>
                    <div className="flex flex-col">
                      <div className="text-xs uppercase text-muted-foreground">{c.label}</div>
                      {c.href ? (
                        <a
                          href={c.href}
                          className="text-sm font-medium text-foreground hover:text-primary"
                        >
                          {c.value}
                        </a>
                      ) : (
                        <div className="text-sm font-medium text-foreground">{c.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horaires</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Lundi — Vendredi</span>
                  <span className="text-foreground">08:00 — 18:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Samedi</span>
                  <span className="text-foreground">09:00 — 13:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dimanche</span>
                  <span className="text-foreground">Fermé</span>
                </div>
                <p className="mt-2 text-xs">
                  Fuseau horaire: Africa/Lome (GMT+0)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
