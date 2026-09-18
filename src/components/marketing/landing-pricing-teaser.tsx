'use client'

import * as React from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PLANS = [
  {
    code: 'STARTER',
    name: 'Starter',
    price: '20',
    period: '3 mois',
    tagline: 'Pour démarrer et tester le canal e-mail.',
    features: ['1 000 e-mails / jour', '10 000 exécutions automatisation', 'Conservation 30 jours', 'Support ticket'],
  },
  {
    code: 'BUSINESS',
    name: 'Business',
    price: '45',
    period: '3 mois',
    tagline: 'Pour les équipes qui automatisent à grande échelle.',
    features: ['5 000 e-mails / jour', '50 000 exécutions', 'Conservation 90 jours', 'Support prioritaire'],
    popular: true,
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    price: '80',
    period: '3 mois',
    tagline: 'Volume élevé, rapports et automatisation avancés.',
    features: ['10 000 e-mails / jour', '100 000 exécutions', 'Conservation 180 jours', 'Support prioritaire + rapports'],
  },
]

export function LandingPricingTeaser() {
  const setView = useAppStore((s) => s.setView)
  const openAuth = useAppStore((s) => s.openAuth)

  return (
    <section id="pricing-teaser" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Offres</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Des forfaits adaptés à votre croissance
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tarification simple, par période de 3 mois calendaires. Sans engagement de durée au-delà.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card
              key={p.code}
              className={`relative ${p.popular ? 'border-primary/60 shadow-md' : ''}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Populaire</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground">{p.price}</span>
                  <span className="text-sm text-muted-foreground">USD / {p.period}</span>
                </div>
                <ul className="flex flex-col gap-2 text-sm">
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
