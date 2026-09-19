'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ = [
  {
    q: 'Puis-je changer de plan en cours d’abonnement ?',
    a: 'Oui. Vous pouvez changer de plan à tout moment depuis votre espace « Abonnement ». La durée de 3 mois calendaires reste calculée à partir de la date d’activation. Le nouveau plan s’applique immédiatement et un nouveau lien de renouvellement est généré.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Tous les plans sont payables par carte bancaire (Visa, Mastercard). Le paiement est à effectuer pour la durée complète de 3 mois au moment du renouvellement.',
  },
  {
    q: 'Mes données sont-elles isolées des autres clients ?',
    a: 'Oui. EmailOqui est multi-tenant: chaque workspace a ses propres contacts, campagnes, templates, automatisations et statistiques. Aucune donnée n’est partagée entre espaces de travail, et les permissions sont gérées par rôle (Developer, Owner).',
  },
  {
    q: 'Puis-je essayer EmailOqui avant de m’abonner ?',
    a: 'Vous pouvez créer un compte et configurer votre domaine immédiatement. À l’inscription, votre abonnement est en attente de paiement. Vous pouvez ensuite choisir un plan Starter, Business ou Premium pour activer votre envoi d’e-mails.',
  },
  {
    q: 'Combien d’e-mails puis-je envoyer ?',
    a: 'La limite quotidienne dépend du plan: 1 000 (Starter), 5 000 (Business) ou 10 000 (Premium). Le quota d’automatisations est respectivement 10 000, 50 000 et 100 000 exécutions sur la durée.',
  },
]

export function LandingFaq() {
  return (
    <section id="faq" className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Questions fréquentes
          </h2>
          <p className="mt-4 text-muted-foreground">
            Vous ne trouvez pas votre réponse ? Contactez-nous via la page Contact.
          </p>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium text-foreground">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
