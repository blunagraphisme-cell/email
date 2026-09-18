'use client'

import * as React from 'react'
import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const TESTIMONIALS = [
  {
    name: 'Awa Agbode',
    role: 'Responsable CRM',
    company: 'OquiTogo — Lomé, Togo',
    quote:
      'EmailOqui nous a permis d’industrialiser nos newsletters en quelques jours. La délivrabilité est excellente et le tableau de bord clair.',
    initials: 'AA',
  },
  {
    name: 'Tunde Adeyemi',
    role: 'Directeur marketing',
    company: 'Lagos Logistics Co. — Lagos, Nigeria',
    quote:
      'Les automatisations sont intuitives. Nous avons mis en place un parcours de bienvenue qui convertit 30% mieux que nos anciens e-mails.',
    initials: 'TA',
  },
  {
    name: 'Abena Mensah',
    role: 'Cheffe de produit',
    company: 'Accra Mart — Accra, Ghana',
    quote:
      'Statistiques en temps réel, support réactif, et un éditeur d’e-mails enfin pensé pour les équipes. Je recommande sans hésiter.',
    initials: 'AM',
  },
]

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Témoignages</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ils automatisent leurs e-mails avec EmailOqui
          </h2>
          <p className="mt-4 text-muted-foreground">
            Des équipes en Afrique de l’Ouest et au-delà nous font confiance pour leurs campagnes.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name}>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <div className="relative">
                  <Quote className="absolute -top-1 -left-1 size-5 text-primary/30" aria-hidden />
                  <p className="pl-6 text-sm leading-relaxed text-foreground">{t.quote}</p>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.role} — {t.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
