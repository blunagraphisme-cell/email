'use client'

import * as React from 'react'
import { Mail, Phone, MapPin, Send, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const AGENCIES = [
  {
    city: 'Lagos',
    country: 'Nigeria',
    role: 'Siège social',
    phone: '+234 813 8198 3521',
    phoneHref: 'tel:+23481381983521',
  },
  {
    city: 'Cotonou',
    country: 'Bénin',
    role: 'Agence',
    phone: null,
    phoneHref: null,
  },
  {
    city: 'Lomé',
    country: 'Togo',
    role: 'Agence',
    phone: '+228 22 22 77 58',
    phoneHref: 'tel:+22822227758',
  },
  {
    city: 'Accra',
    country: 'Ghana',
    role: 'Agence',
    phone: null,
    phoneHref: null,
  },
]

const EMAIL = 'contact@oquitogo.com'

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
            Une question sur nos offres, une intégration, ou un besoin spécifique ? Notre équipe,
            présente au Nigeria, au Bénin, au Togo et au Ghana, vous répond sous 24h ouvrées.
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
                <div className="flex items-start gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-5" />
                  </span>
                  <div className="flex flex-col">
                    <div className="text-xs uppercase text-muted-foreground">E-mail</div>
                    <a
                      href={`mailto:${EMAIL}`}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="text-xs uppercase text-muted-foreground">Téléphone</div>
                    <a
                      href="tel:+23481381983521"
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      Nigeria : +234 813 8198 3521
                    </a>
                    <a
                      href="tel:+22822227758"
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      Togo : +228 22 22 77 58
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </span>
                  <div className="flex flex-col">
                    <div className="text-xs uppercase text-muted-foreground">Siège social</div>
                    <div className="text-sm font-medium text-foreground">Lagos, Nigeria</div>
                    <div className="text-xs text-muted-foreground">
                      Agences à Cotonou (Bénin), Lomé (Togo), Accra (Ghana)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nos agences en Afrique de l'Ouest</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {AGENCIES.map((a) => (
                  <div
                    key={a.city}
                    className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <MapPin className="size-4" />
                    </span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{a.city}</span>
                        <Badge
                          variant={a.role === 'Siège social' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {a.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{a.country}</div>
                      {a.phone ? (
                        <a
                          href={a.phoneHref!}
                          className="mt-1 text-xs font-medium text-foreground hover:text-primary"
                        >
                          {a.phone}
                        </a>
                      ) : (
                        <div className="mt-1 text-xs text-muted-foreground/70">
                          Contact via le siège
                        </div>
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
                  Fuseaux horaires : Africa/Lagos (WAT, GMT+1) · Africa/Lome (GMT+0) · Africa/Accra
                  (GMT+0) · Africa/Porto-Novo (WAT, GMT+1)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
