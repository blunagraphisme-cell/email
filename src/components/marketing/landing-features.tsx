'use client'

import * as React from 'react'
import {
  BarChart3,
  Code2,
  CreditCard,
  Users,
  ShieldCheck,
  Zap,
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
    title: 'Reporting temps réel',
    description:
      'Centralisez les événements de vos envois e-mail : envoyés, délivrés, ouverts, cliqués, rebonds, désabonnements.',
    icon: BarChart3,
    bullets: ['Taux de délivrabilité, ouverture, clic', 'Tendances sur 7/30 jours', 'Détail par campagne'],
  },
  {
    title: 'Intégration API simple',
    description:
      'Votre backend reçoit les événements de votre infrastructure d\'envoi et les pousse vers EmailOqui via une API REST.',
    icon: Code2,
    bullets: ['POST /api/v1/events — batch jusqu\'à 1000', 'Idempotent (déduplication par event_id)', 'Exemples cURL, Node.js, Python'],
  },
  {
    title: 'Gestion d\'abonnement',
    description:
      'Trois plans (Starter, Business, Premium) × trois durées (3 mois, 6 mois, 1 an). Paiement par carte, renouvellement sécurisé.',
    icon: CreditCard,
    bullets: ['9 offres avec remise sur la durée', 'Activation après confirmation serveur', 'Liens de renouvellement à usage unique'],
  },
  {
    title: 'Tableau de bord Owner',
    description:
      'Le propriétaire voit une vue simplifiée : KPIs, performances, abonnement. Aucune configuration technique exposée.',
    icon: Users,
    bullets: ['Vue read-only pour le client final', 'Pas de clés API, DNS, webhooks visibles', 'Responsive mobile-first'],
  },
  {
    title: 'Multi-tenant isolé',
    description:
      'Chaque workspace est strictement isolé. Les données d\'un client ne sont jamais accessibles depuis un autre workspace.',
    icon: ShieldCheck,
    bullets: ['Isolation par workspace_id', 'Permissions serveur (Developer vs Owner)', 'Journaux d\'audit complets'],
  },
  {
    title: 'White-label total',
    description:
      'Le fournisseur technique d\'envoi reste invisible. Le propriétaire ne voit que la marque EmailOqui — jamais l\'infra sous-jacente.',
    icon: Zap,
    bullets: ['Aucune mention du prestataire d\'envoi', 'Emails système brandés EmailOqui', 'Domaine email.oquitogo.online'],
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Fonctionnalités</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Une couche de reporting et d'abonnement
          </h2>
          <p className="mt-4 text-muted-foreground">
            Votre application gère l'envoi. EmailOqui gère les statistiques, l'abonnement et le
            tableau de bord du propriétaire.
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
