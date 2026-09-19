'use client'

import * as React from 'react'
import { Check, CreditCard, Info } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Duration = '3M' | '6M' | '1Y'

const DURATIONS: { key: Duration; label: string; short: string }[] = [
  { key: '3M', label: '3 mois', short: '3 mois' },
  { key: '6M', label: '6 mois', short: '6 mois' },
  { key: '1Y', label: '1 an', short: '1 an' },
]

type Plan = {
  name: string
  tagline: string
  popular?: boolean
  features: string[]
  highlightFeatures: { label: string; value: string }[]
  prices: Record<Duration, { price: string; period: string }>
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    tagline: 'Idéal pour démarrer et tester le canal e-mail.',
    features: [
      '1 000 e-mails / jour',
      '10 000 exécutions d’automatisation',
      'Conservation 30 jours',
      'Programmation de campagnes',
      'Statistiques essentielles',
      'Support par ticket',
    ],
    highlightFeatures: [
      { label: 'E-mails / jour', value: '1 000' },
      { label: 'Automatisations', value: '10 000' },
      { label: 'Conservation', value: '30 jours' },
      { label: 'Support', value: 'Ticket' },
    ],
    prices: {
      '3M': { price: '20', period: '3 mois' },
      '6M': { price: '38', period: '6 mois' },
      '1Y': { price: '72', period: '1 an' },
    },
  },
  {
    name: 'Business',
    tagline: 'Pour les équipes qui automatisent à grande échelle.',
    popular: true,
    features: [
      '5 000 e-mails / jour',
      '50 000 exécutions d’automatisation',
      'Conservation 90 jours',
      'Statistiques avancées',
      'Support prioritaire',
      'Toutes les fonctionnalités Starter',
    ],
    highlightFeatures: [
      { label: 'E-mails / jour', value: '5 000' },
      { label: 'Automatisations', value: '50 000' },
      { label: 'Conservation', value: '90 jours' },
      { label: 'Support', value: 'Prioritaire' },
    ],
    prices: {
      '3M': { price: '45', period: '3 mois' },
      '6M': { price: '85', period: '6 mois' },
      '1Y': { price: '162', period: '1 an' },
    },
  },
  {
    name: 'Premium',
    tagline: 'Volume élevé, rapports et automatisation avancés.',
    features: [
      '10 000 e-mails / jour',
      '100 000 exécutions d’automatisation',
      'Conservation 180 jours',
      'Programmation avancée',
      'Rapports avancés',
      'Support prioritaire',
    ],
    highlightFeatures: [
      { label: 'E-mails / jour', value: '10 000' },
      { label: 'Automatisations', value: '100 000' },
      { label: 'Conservation', value: '180 jours' },
      { label: 'Support', value: 'Prioritaire' },
    ],
    prices: {
      '3M': { price: '80', period: '3 mois' },
      '6M': { price: '150', period: '6 mois' },
      '1Y': { price: '288', period: '1 an' },
    },
  },
]

const COMPARISON: { label: string; starter: string; business: string; premium: string }[] = [
  { label: 'E-mails par jour', starter: '1 000', business: '5 000', premium: '10 000' },
  { label: 'Exécutions d’automatisation', starter: '10 000', business: '50 000', premium: '100 000' },
  { label: 'Conservation des données', starter: '30 jours', business: '90 jours', premium: '180 jours' },
  { label: 'Programmation de campagnes', starter: 'Oui', business: 'Oui', premium: 'Avancée' },
  { label: 'Statistiques essentielles', starter: 'Oui', business: 'Oui', premium: 'Oui' },
  { label: 'Statistiques avancées', starter: '—', business: 'Oui', premium: 'Oui' },
  { label: 'Rapports avancés', starter: '—', business: '—', premium: 'Oui' },
  { label: 'Support', starter: 'Ticket', business: 'Prioritaire', premium: 'Prioritaire' },
  { label: 'API & webhooks', starter: 'Oui', business: 'Oui', premium: 'Oui' },
  { label: 'Domaine sécurisé SPF/DKIM/DMARC', starter: 'Oui', business: 'Oui', premium: 'Oui' },
  { label: 'Durée', starter: '3 / 6 / 12 mois', business: '3 / 6 / 12 mois', premium: '3 / 6 / 12 mois' },
]

export function PricingView() {
  const openAuth = useAppStore((s) => s.openAuth)
  const [duration, setDuration] = React.useState<Duration>('3M')

  return (
    <main className="flex-1">
      <section className="bg-mesh">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Tarifs</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choisissez l’offre adaptée à votre activité
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tarification simple et transparente. Choisissez la durée : 3 mois, 6 mois ou 1 an.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Duration selector */}
          <div className="mb-10 flex justify-center">
            <div className="inline-flex rounded-lg border border-border bg-muted p-1">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDuration(d.key)}
                  className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${
                    duration === d.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => {
              const pricing = p.prices[duration]
              return (
                <Card
                  key={p.name}
                  className={`relative flex flex-col ${p.popular ? 'border-primary/60 shadow-md' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Populaire</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{p.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-5">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-foreground">{pricing.price}</span>
                      <span className="text-sm text-muted-foreground">USD / {pricing.period}</span>
                    </div>

                  <dl className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                    {p.highlightFeatures.map((h) => (
                      <div key={h.label} className="text-center">
                        <dt className="text-[10px] uppercase text-muted-foreground">{h.label}</dt>
                        <dd className="text-sm font-bold text-foreground">{h.value}</dd>
                      </div>
                    ))}
                  </dl>

                  <ul className="flex flex-1 flex-col gap-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={p.popular ? 'default' : 'outline'}
                    className="mt-2 w-full"
                    onClick={() => openAuth('signup')}
                  >
                    Choisir {p.name}
                  </Button>
                </CardContent>
              </Card>
              )
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            Tarifs par période (3 mois, 6 mois ou 1 an). Remise sur les durées longues. Paiement par carte.
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Comparatif détaillé
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            Comparez les fonctionnalités et limites de chaque plan.
          </p>

          <div className="mt-10 overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Fonctionnalité</TableHead>
                  <TableHead className="text-center">Starter</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center gap-1.5">
                      Business
                      <Badge className="bg-primary/15 text-primary">Populaire</Badge>
                    </span>
                  </TableHead>
                  <TableHead className="text-center">Premium</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {row.starter}
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold text-foreground">
                      {row.business}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {row.premium}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              Paiement sécurisé par carte bancaire.
            </div>
            <Button onClick={() => openAuth('signup')} className="h-11">
              Créer mon compte
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
