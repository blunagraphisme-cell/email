'use client'

import * as React from 'react'
import {
  Send,
  Users,
  Workflow,
  LayoutTemplate,
  BarChart3,
  ShieldCheck,
  Code2,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Feature = {
  icon: LucideIcon
  title: string
  description: string
  bullets: string[]
  variables?: string[]
}

const FEATURES: Feature[] = [
  {
    icon: Send,
    title: 'Campagnes',
    description:
      'Toute la chaîne de création à l’envoi: brouillon, programmation, test, envoi immédiat ou différé.',
    bullets: [
      'Création par éditeur de blocs ou template',
      'Programmation à date et heure précises',
      'Envoi immédiat sur segment ou liste',
      'Test sur votre propre adresse avant envoi',
    ],
  },
  {
    icon: Users,
    title: 'Contacts & segmentation',
    description:
      'Importez et organisez vos contacts par listes, segments et tags pour des envois ciblés.',
    bullets: [
      'Import CSV / saisie manuelle',
      'Listes colorées et nommées',
      'Segments dynamiques (TAG, OPEN, CLICK, ACTIVITY)',
      'Statuts: ACTIF, DESABONNE, BOUNCE, SUPPRIME',
    ],
  },
  {
    icon: Workflow,
    title: 'Automatisations',
    description:
      'Construisez des workflows visuels en enchaînant déclencheurs, conditions, attentes et envois.',
    bullets: [
      'Triggers: nouveau contact, ouverture, inactivité',
      'Étapes: wait, send, condition',
      'Mise en pause / reprise',
      'Compteur d’exécutions par automation',
    ],
  },
  {
    icon: LayoutTemplate,
    title: 'Éditeur d’e-mails',
    description:
      'Un éditeur par blocs pensé pour les équipes, avec variables et aperçu en temps réel.',
    bullets: [
      'Blocs: titre, texte, image, bouton, liste',
      'Variables {{prenom}}, {{nom}}, {{email}}, {{entreprise}}',
      'Catégories: Newsletter, Promotion, Bienvenue, Transactionnel',
      'Miniatures et catégories',
    ],
    variables: ['{{prenom}}', '{{nom}}', '{{email}}', '{{entreprise}}'],
  },
  {
    icon: BarChart3,
    title: 'Statistiques',
    description:
      'Mesurez chaque campagne et la tendance globale sur 30 jours pour ajuster votre stratégie.',
    bullets: [
      'Taux de délivrabilité, ouverture, clic',
      'Bounce, désabonnement, plainte',
      'Vue d’ensemble 30 jours',
      'Détail par campagne en temps réel',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Domaine sécurisé',
    description:
      'Configuration et suivi SPF, DKIM et DMARC pour une délivrabilité optimale.',
    bullets: [
      'Statut SPF, DKIM, DMARC en temps réel',
      'Vérification et alertes d’erreur',
      'Domaine rattaché au workspace',
      'Dernière vérification horodatée',
    ],
  },
  {
    icon: Code2,
    title: 'API & webhooks',
    description:
      'Intégrez MailOqui à votre stack: gestion des contacts, envoi d’e-mails transactionnels, événements.',
    bullets: [
      'Clés API révocables et préfixées',
      'Quotas journaliers et limites par plan',
      'Webhooks SENT, DELIVERED, OPENED, CLICKED, BOUNCE, UNSUBSCRIBE',
      'Idempotence par eventId',
    ],
  },
  {
    icon: Building2,
    title: 'Multi-tenant & permissions',
    description:
      'Chaque workspace est isolé, avec rôles Developer (écriture) et Owner (lecture / prévisualisation).',
    bullets: [
      'Isolation complète des données par workspace',
      'Rôles: Developer, Owner',
      'Invitations et appartenance active',
      'Logs d’audit par workspace',
    ],
  },
]

export function FeaturesView() {
  const openAuth = useAppStore((s) => s.openAuth)

  return (
    <main className="flex-1">
      {/* Hero secondaire */}
      <section className="bg-mesh">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Fonctionnalités
          </p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Tout ce qu’il faut pour réussir vos e-mails
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            De la création d’un template à l’analyse de la performance, MailOqui couvre la chaîne
            complète de votre marketing par e-mail — sans dépendre d’un prestataire visible côté
            client.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => openAuth('signup')} className="h-11">
              Démarrer maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* Sections détaillées */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-5" />
                    </span>
                    <CardTitle className="text-xl">{f.title}</CardTitle>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-2 text-sm">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-foreground">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {f.variables && (
                    <div className="flex flex-wrap gap-2">
                      {f.variables.map((v) => (
                        <code
                          key={v}
                          className="rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs text-foreground"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
