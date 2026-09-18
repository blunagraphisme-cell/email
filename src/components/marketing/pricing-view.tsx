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

type Plan = {
  code: string
  name: string
  price: string
  period: string
  tagline: string
  popular?: boolean
  features: string[]
  highlightFeatures: { label: string; value: string }[]
}

const PLANS: Plan[] = [
  {
    code: 'STARTER',
    name: 'Starter',
    price: '20',
    period: '3 mois',
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
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    price: '45',
    period: '3 mois',
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
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    price: '80',
    period: '3 mois',
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
  { label: 'Durée', starter: '3 mois calendaires', business: '3 mois calendaires', premium: '3 mois calendaires' },
]

export function PricingView() {
  const openAuth = useAppStore((s) => s.openAuth)

  return (
    <main className="flex-1">
      <section className="bg-mesh">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Tarifs</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choisissez l’offre adaptée à votre activité
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tarification simple et transparente, par période de 3 mois calendaires.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <Card
                key={p.code}
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
                    <span className="text-4xl font-bold text-foreground">{p.price}</span>
                    <span className="text-sm text-muted-foreground">USD / {p.period}</span>
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
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5" />
            Tous les plans: durée 3 mois calendaires. Paiement par carte.
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
