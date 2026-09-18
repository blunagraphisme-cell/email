'use client'

import * as React from 'react'
import { PenLine, CalendarClock, BarChart3 } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    title: 'Créez',
    description:
      'Importez vos contacts, choisissez un template ou partez de zéro avec l’éditeur de blocs.',
    icon: PenLine,
  },
  {
    n: '02',
    title: 'Programmez',
    description:
      'Choisissez l’heure d’envoi, configurez vos automatisations, et laissez la plateforme travailler.',
    icon: CalendarClock,
  },
  {
    n: '03',
    title: 'Analysez',
    description:
      'Suivez la délivrabilité, les ouvertures et les clics en temps réel, ajustez vos prochaines campagnes.',
    icon: BarChart3,
  },
]

export function LandingHow() {
  return (
    <section id="how" className="bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Comment ça marche</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trois étapes pour vos premières campagnes
          </h2>
          <p className="mt-4 text-muted-foreground">
            De l’inscription au premier envoi, EmailOqui vous accompagne à chaque étape.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="relative rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <span className="text-3xl font-bold text-primary/40">{s.n}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              {i < STEPS.length - 1 && (
                <span
                  className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-primary/30 sm:block"
                  aria-hidden
                >
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
