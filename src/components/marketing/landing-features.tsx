'use client'

import * as React from 'react'
import {
  Send,
  Calendar,
  BarChart3,
  Users,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const FEATURES: {
  title: string
  description: string
  icon: LucideIcon
  bullets: string[]
}[] = [
  {
    title: 'Gestion des e-mails',
    description:
      'Centralisez toutes vos communications e-mail : campagnes, newsletters, e-mails transactionnels — tout au même endroit.',
    icon: Send,
    bullets: ['Suivi des envois en temps réel', 'Historique des campagnes', 'Statuts clairs (envoyé, livré, ouvert, cliqué)'],
  },
  {
    title: 'Envoi programmé',
    description:
      'Planifiez vos envois à la date et l’heure de votre choix. Vos campagnes partent automatiquement, même quand vous dormez.',
    icon: Calendar,
    bullets: ['Programmation par date et heure', 'Fuseau horaire du workspace', 'Annulation possible avant envoi'],
  },
  {
    title: 'Statistiques détaillées',
    description:
      'Taux de délivrabilité, d’ouverture, de clic, de désabonnement — suivez la performance de chaque campagne.',
    icon: BarChart3,
    bullets: ['Taux calculés automatiquement', 'Vue d’ensemble 7/30 jours', 'Détail par campagne'],
  },
  {
    title: 'Tableau de bord simple',
    description:
      'Une vue simple et claire : combien d’e-mails envoyés, livrés, ouverts, cliqués. Aucune compétence technique requise.',
    icon: Users,
    bullets: ['Interface simplifiée', 'Aucune configuration technique visible', 'Accessible sur mobile et desktop'],
  },
  {
    title: 'Abonnement flexible',
    description:
      'Trois plans (Starter, Business, Premium) × trois durées (3 mois, 6 mois, 1 an). Choisissez ce qui convient à votre activité.',
    icon: ShieldCheck,
    bullets: ['9 offres avec remise sur la durée', 'Renouvellement à usage unique', 'Quotas quotidiens contrôlés'],
  },
  {
    title: 'Accessible partout',
    description:
      'Interface responsive qui fonctionne sur ordinateur, tablette et smartphone. Consultez vos statistiques où que vous soyez.',
    icon: Smartphone,
    bullets: ['Design mobile-first', 'Notifications en temps réel', 'Support par ticket'],
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Fonctionnalités</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tout pour piloter vos communications e-mail
          </h2>
          <p className="mt-4 text-muted-foreground">
            EmailOqui est la plateforme qui permet de gérer, programmer et
            analyser ses e-mails — sans se soucier de la technique.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1.5">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
