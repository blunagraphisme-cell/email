'use client'

import * as React from 'react'
import {
  Send,
  Workflow,
  LayoutTemplate,
  BarChart3,
  ShieldCheck,
  Code2,
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
    title: 'Campagnes',
    description:
      'Créez, programmez et envoyez des campagnes en quelques minutes, avec ou sans template.',
    icon: Send,
    bullets: ['Envoyez immédiatement ou programmez', 'Test A/B sur les objets', 'Prévisualisation en direct'],
  },
  {
    title: 'Automatisations',
    description:
      'Construisez des workflows visuels pour relancer, accueillir et réengager vos contacts sans effort.',
    icon: Workflow,
    bullets: ['Triggers: nouveau contact, ouverture, inactivité', 'Étapes: attendre, envoyer, condition', 'Exécutions mesurées'],
  },
  {
    title: 'Templates',
    description:
      'Bibliothèque de modèles réutilisables par catégorie: newsletter, promo, bienvenue, transactionnel.',
    icon: LayoutTemplate,
    bullets: ['Catégories prédéfinies', 'Variables {{prenom}}, {{nom}}', 'Aperçu miniature'],
  },
  {
    title: 'Statistiques',
    description:
      'Suivez la délivrabilité, les ouvertures, les clics, les rebonds et les désabonnements en temps réel.',
    icon: BarChart3,
    bullets: ['Vue d’ensemble 30 jours', 'Détail par campagne', 'Tendance des conversions'],
  },
  {
    title: 'Domaine sécurisé',
    description:
      'Configurez SPF, DKIM et DMARC pour une délivrabilité optimale et une réputation d’envoi saine.',
    icon: ShieldCheck,
    bullets: ['Vérification SPF / DKIM / DMARC', 'Statut en temps réel', 'Alertes de configuration'],
  },
  {
    title: 'API & webhooks',
    description:
      'Intégrez EmailOqui à votre stack via une API REST documentée et des webhooks d’événements.',
    icon: Code2,
    bullets: ['Clés API révocables', 'Webhooks SENT / DELIVERED / OPENED', 'Quotas journaliers'],
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Fonctionnalités</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tout ce qu’il vous faut pour réussir vos e-mails
          </h2>
          <p className="mt-4 text-muted-foreground">
            Une plateforme complète qui couvre l’intégralité du cycle: création, envoi, suivi,
            automatisation, sécurité.
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
