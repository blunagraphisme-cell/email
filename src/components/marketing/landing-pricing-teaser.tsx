'use client'

import * as React from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Duration = '3M' | '6M' | '1Y' | '2Y'

const DURATIONS: { key: Duration; label: string; short: string }[] = [
  { key: '3M', label: '3 mois', short: '3 mois' },
  { key: '6M', label: '6 mois', short: '6 mois' },
  { key: '1Y', label: '1 an', short: '1 an' },
  { key: '2Y', label: '2 ans', short: '2 ans' },
]

interface Tier {
  name: 'Starter' | 'Business' | 'Premium'
  tagline: string
  features: string[]
  popular?: boolean
  prices: Record<Duration, { price: string; code: string }>
}

const TIERS: Tier[] = [
  {
    name: 'Starter',
    tagline: 'Pour démarrer et tester le canal e-mail.',
    features: ['1 000 e-mails / jour', '10 000 exécutions automatisation', 'Conservation 30 jours', 'Support ticket'],
    prices: {
      '3M': { price: '20', code: 'STARTER_3M' },
      '6M': { price: '38', code: 'STARTER_6M' },
      '1Y': { price: '74', code: 'STARTER_1Y' },
      '2Y': { price: '120', code: 'STARTER_2Y' },
    },
  },
  {
    name: 'Business',
    tagline: 'Pour les équipes qui automatisent à grande échelle.',
    features: ['5 000 e-mails / jour', '50 000 exécutions', 'Conservation 90 jours', 'Support prioritaire'],
    popular: true,
    prices: {
      '3M': { price: '20', code: 'BUSINESS_3M' },
      '6M': { price: '38', code: 'BUSINESS_6M' },
      '1Y': { price: '74', code: 'BUSINESS_1Y' },
      '2Y': { price: '120', code: 'BUSINESS_2Y' },
    },
  },
  {
    name: 'Premium',
    tagline: 'Volume élevé, rapports et automatisation avancés.',
    features: ['10 000 e-mails / jour', '100 000 exécutions', 'Conservation 180 jours', 'Support prioritaire + rapports'],
    prices: {
      '3M': { price: '20', code: 'PREMIUM_3M' },
      '6M': { price: '38', code: 'PREMIUM_6M' },
      '1Y': { price: '74', code: 'PREMIUM_1Y' },
      '2Y': { price: '120', code: 'PREMIUM_2Y' },
    },
  },
]

export function LandingPricingTeaser() {
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)
  const [duration, setDuration] = React.useState<Duration>('3M')

  return (
    <section id="pricing-teaser" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Offres</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Des forfaits adaptés à votre croissance
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tarification simple par période. Choisissez la durée qui vous convient : 3 mois, 6 mois ou 1 an.
          </p>
        </div>

        {/* Duration selector */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-border bg-muted p-1">
            {DURATIONS.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDuration(d.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => {
            const pricing = t.prices[duration]
            return (
              <Card
                key={t.name}
                className={`relative ${t.popular ? 'border-primary/60 shadow-md' : ''}`}
              >
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Populaire</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t.tagline}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-foreground">{pricing.price}</span>
                    <span className="text-sm text-muted-foreground">USD / {DURATIONS.find((d) => d.key === duration)?.short}</span>
                  </div>
                  <ul className="flex flex-col gap-2 text-sm">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={t.popular ? 'default' : 'outline'}
                    className="mt-2 w-full"
                    onClick={() => openAuth('signup')}
                  >
                    Choisir {t.name}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="link" onClick={() => setView('pricing')} className="text-primary">
            Voir tous les plans et le comparatif détaillé
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
