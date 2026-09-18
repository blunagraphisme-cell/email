'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Section = { heading: string; paragraphs: string[]; list?: string[] }

const MENTIONS: Section[] = [
  {
    heading: 'Éditeur',
    paragraphs: [
      'Le site email.oquitogo.com est édité par EmailOqui, société africaine d’édition de logiciels spécialisée dans la gestion et l’automatisation des e-mails pour les entreprises.',
      'EmailOqui a son siège social à Lagos, au Nigeria, et dispose d’agences à Cotonou (Bénin), Lomé (Togo) et Accra (Ghana).',
      'EmailOqui est une plateforme multi-tenant: chaque client dispose d’un espace de travail isolé (workspace) contenant ses propres contacts, campagnes, modèles et automatisations.',
    ],
  },
  {
    heading: 'Responsable de publication',
    paragraphs: [
      'Le responsable de publication est la direction de EmailOqui, joignable via contact@oquitogo.com ou par téléphone au +234 813 8198 3521 (Nigeria) ou +228 22 22 77 58 (Togo). Le siège social est situé à Lagos, Nigeria, avec des agences à Cotonou (Bénin), Lomé (Togo) et Accra (Ghana).',
    ],
  },
  {
    heading: 'Hébergement',
    paragraphs: [
      'Les serveurs de EmailOqui sont hébergés auprès d’un prestataire d’infrastructure cloud. Les données traitées (contacts, campagnes, statistiques) sont stockées sur ces serveurs et accessibles uniquement via le mécanisme d’authentification propre à chaque workspace.',
    ],
  },
  {
    heading: 'Propriété intellectuelle',
    paragraphs: [
      'L’ensemble des contenus présents sur la plateforme (logos, textes, illustrations, design) est la propriété de EmailOqui, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.',
    ],
  },
  {
    heading: 'Responsabilité',
    paragraphs: [
      'EmailOqui met tout en œuvre pour assurer la disponibilité et la sécurité de la plateforme. Toutefois, la responsabilité de EmailOqui ne peut être engagée en cas de défaillance du réseau, du navigateur, ou d’un tiers. EmailOqui n’est pas responsable du contenu des e-mails envoyés par ses clients.',
    ],
  },
]

const PRIVACY: Section[] = [
  {
    heading: 'Données traitées',
    paragraphs: [
      'EmailOqui traite les données nécessaires à la fourniture du service: identifiant (e-mail), mot de passe (haché), nom et prénom du compte utilisateur, nom du workspace, et coordonnées de contacts importés par le client.',
    ],
    list: [
      'Données de compte: e-mail, nom, prénom, mot de passe (haché)',
      'Données de workspace: nom, fuseau horaire, statut',
      'Données de contacts: e-mail, prénom, nom, entreprise, tags',
      'Données d’activité: événements d’e-mail (envoi, ouverture, clic, désabonnement)',
    ],
  },
  {
    heading: 'Finalités',
    paragraphs: [
      'Les données sont traitées aux fins de fourniture du service: envoi d’e-mails, automatisation, statistiques, facturation, support.',
    ],
  },
  {
    heading: 'Sous-traitants',
    paragraphs: [
      'EmailOqui fait appel à des sous-traitants techniques pour l’hébergement et l’acheminement des e-mails. Ces prestataires sont soumis à des accords de confidentialité et n’accèdent pas aux données clients au-delà du strict nécessaire technique.',
    ],
  },
  {
    heading: 'Durée de conservation',
    paragraphs: [
      'Les données de compte et de workspace sont conservées pendant toute la durée d’activité du compte. Les données d’événements d’e-mail (logs) sont conservées selon le plan souscrit:',
    ],
    list: [
      'Plan Starter: 30 jours',
      'Plan Business: 90 jours',
      'Plan Premium: 180 jours',
    ],
  },
  {
    heading: 'Droits des personnes',
    paragraphs: [
      'Conformément aux principes applicables en matière de protection des données (notamment la Nigeria Data Protection Regulation 2023, la loi togolaise n°2018-026 et les réglementations similaires du Bénin et du Ghana), les utilisateurs disposent d’un droit d’accès, de rectification, d’effacement et d’opposition. Ces droits peuvent être exercés via contact@oquitogo.com.',
    ],
  },
  {
    heading: 'Sécurité',
    paragraphs: [
      'Les mots de passe sont hachés (scrypt). Les sessions sont stockées côté serveur via des cookies httpOnly. L’accès aux données d’un workspace est strictement limité aux membres de ce workspace.',
    ],
  },
]

const CGV: Section[] = [
  {
    heading: 'Objet',
    paragraphs: [
      'Les présentes Conditions Générales de Vente (CGV) régissent les modalités d’abonnement et d’utilisation de la plateforme EmailOqui.',
    ],
  },
  {
    heading: 'Offres et tarification',
    paragraphs: [
      'EmailOqui propose trois offres: Starter (20 USD / 3 mois), Business (45 USD / 3 mois) et Premium (80 USD / 3 mois). La durée d’abonnement est de 3 mois calendaires.',
    ],
  },
  {
    heading: 'Paiement',
    paragraphs: [
      'Le paiement s’effectue par carte bancaire (Visa, Mastercard). Le montant correspondant à la période de 3 mois est dû à l’activation de l’abonnement ou à son renouvellement.',
    ],
  },
  {
    heading: 'Activation et renouvellement',
    paragraphs: [
      'À l’inscription, l’abonnement est en attente de paiement. L’envoi d’e-mails est activé après confirmation du paiement. Un lien de renouvellement est généré en fin de période pour prolonger l’abonnement.',
    ],
  },
  {
    heading: 'Limites et quotas',
    paragraphs: [
      'Les quotas quotidiens d’envoi et d’automatisation dépendent du plan souscrit. Tout dépassement est bloqué par la plateforme.',
    ],
    list: [
      'Starter: 1 000 e-mails / jour, 10 000 automatisations',
      'Business: 5 000 e-mails / jour, 50 000 automatisations',
      'Premium: 10 000 e-mails / jour, 100 000 automatisations',
    ],
  },
  {
    heading: 'Réversibilité',
    paragraphs: [
      'Le client peut à tout moment exporter ses données de contacts et de modèles. En cas de résiliation, les données sont supprimées à l’issue de la durée de conservation prévue par le plan.',
    ],
  },
  {
    heading: 'Résiliation',
    paragraphs: [
      'EmailOqui se réserve le droit de suspendre un compte en cas de non-respect des présentes CGV ou d’usage abusif (spam, envoi non consenti).',
    ],
  },
]

const COOKIES: Section[] = [
  {
    heading: 'Utilisation des cookies',
    paragraphs: [
      'EmailOqui utilise des cookies techniques nécessaires au fonctionnement de la plateforme: maintien de la session utilisateur (cookie httpOnly), préférences d’affichage, mémorisation de la dernière vue consultée.',
    ],
  },
  {
    heading: 'Types de cookies',
    paragraphs: [
      'La plateforme n’utilise pas de cookies publicitaires ou de tiers à des fins commerciales. Les seuls cookies présents sont strictement nécessaires au service.',
    ],
    list: [
      'Cookie de session: maintien de l’authentification',
      'Préférences UI: état de la navigation et de la sidebar',
    ],
  },
  {
    heading: 'Gestion',
    paragraphs: [
      'L’utilisateur peut à tout moment effacer ses cookies via son navigateur. Cela entraînera une déconnexion et la perte des préférences d’affichage.',
    ],
  },
]

export function LegalView() {
  return (
    <main className="flex-1">
      <section className="bg-mesh">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Mentions légales</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Cadre légal & politique de confidentialité
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Cette page regroupe les informations légales relatives à la plateforme EmailOqui.
          </p>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="mentions" className="w-full">
            <TabsList className="flex w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="mentions">Mentions légales</TabsTrigger>
              <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
              <TabsTrigger value="cgv">CGV</TabsTrigger>
              <TabsTrigger value="cookies">Cookies</TabsTrigger>
            </TabsList>

            <TabsContent value="mentions" className="mt-6">
              <LegalCard sections={MENTIONS} />
            </TabsContent>
            <TabsContent value="privacy" className="mt-6">
              <LegalCard sections={PRIVACY} />
            </TabsContent>
            <TabsContent value="cgv" className="mt-6">
              <LegalCard sections={CGV} />
            </TabsContent>
            <TabsContent value="cookies" className="mt-6">
              <LegalCard sections={COOKIES} />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}

function LegalCard({ sections }: { sections: Section[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {sections.map((s, i) => (
          <div key={i} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-foreground">{s.heading}</h3>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="mt-1 flex flex-col gap-1">
                {s.list.map((li) => (
                  <li
                    key={li}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {li}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
