'use client'

import * as React from 'react'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

export function LandingCta() {
  const openAuth = useAppStore((s) => s.openAuth)
  const setView = useAppStore((s) => s.setView)

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-md sm:px-12 sm:py-16">
          <div
            className="absolute inset-0 bg-mesh opacity-20 mix-blend-overlay"
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Prêt à automatiser vos e-mails ?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
              Créez votre compte EmailOqui en moins de 5 minutes. Aucune carte requise pour
              configurer votre espace.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => openAuth('signup')}
                className="h-11 px-6"
              >
                Commencer maintenant
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView('pricing')}
                className="h-11 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Voir les offres
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
