# Task 4-a — full-stack-developer — Work record

## Objectif
Construire le site public marketing de MailOqui (route `/`) + la modale d'authentification.

## Fichiers créés
- `src/components/marketing/marketing-site.tsx` — composant principal, routeur de vues via `activeView`, layout sticky `min-h-screen flex flex-col`, footer en `mt-auto`.
- `src/components/marketing/site-header.tsx` — header sticky + backdrop-blur, logo MailOqui ambre, nav desktop (Fonctionnalités / Tarifs / Contact), boutons "Se connecter" + "Commencer", menu hamburger mobile (Sheet shadcn).
- `src/components/marketing/site-footer.tsx` — 4 colonnes (Produit, Entreprise, Légal, Suivez-nous) + mention `mail.oquitogo.com`. Aucune mention de Resend / fournisseur technique (white-label).
- `src/components/marketing/landing-hero.tsx` — hero `bg-mesh`, titre "Automatisez votre marketing par e-mail.", CTA "Voir nos offres" + "Commencer maintenant", mock dashboard CSS (KPI, mini-chart, activité récente). Bande stats (10 000+ / 99.2% / 4.8/5 / 180+).
- `src/components/marketing/landing-features.tsx` — 6 cards (Campagnes, Automatisations, Templates, Statistiques, Domaine sécurisé, API & webhooks).
- `src/components/marketing/landing-how.tsx` — 3 étapes (Créez, Programmez, Analysez).
- `src/components/marketing/landing-pricing-teaser.tsx` — 3 plans (Starter 20 / Business 45 popular / Premium 80) + lien "Voir tous les plans".
- `src/components/marketing/landing-testimonials.tsx` — 3 témoignages (Awa Agbode / Komlan Mensah / Afi Kossi).
- `src/components/marketing/landing-faq.tsx` — 5 questions en Accordion shadcn.
- `src/components/marketing/landing-cta.tsx` — bandeau CTA final ambre "Prêt à automatiser vos e-mails ?".
- `src/components/marketing/features-view.tsx` — page Fonctionnalités détaillée (8 sections avec icônes Lucide, bullets, variables d'éditeur `{{prenom}}` etc.).
- `src/components/marketing/pricing-view.tsx` — page Tarifs (3 cards + tableau comparatif shadcn Table).
- `src/components/marketing/contact-view.tsx` — formulaire (nom/email/entreprise/message) + coordonnées (support@mailoqui.com, +228 90 00 00 00, Lomé Togo). Toast succès. Pas de backend.
- `src/components/marketing/legal-view.tsx` — Tabs (Mentions légales / Confidentialité / CGV / Cookies). Mentionne éditeur, hébergement, sous-traitants génériques, droits RGPD-like, durée de conservation par plan (30/90/180 j).
- `src/components/auth/auth-modal.tsx` — Dialog shadcn + Tabs (Connexion / Inscription / Mot de passe oublié). Login → POST /api/auth/login puis refreshSession + setView (dashboard ou owner-dashboard selon role). Signup → POST /api/auth/signup puis setUser/setWorkspace/closeAuth/setView('dashboard') + POST /api/seed/demo + refreshSession. Loading spinner, désactivation du bouton pendant la requête, toast sonner. Lien "Mot de passe oublié ?" bascule sur l'onglet forgot (toast "Lien envoyé si le compte existe"). Bloc démo en bas du login: "admin@mailoqui.com / MailOqui2026!" (Platform Admin) + bouton "Créer un compte de démo" pré-remplit un email aléatoire + workspace "Mon Entreprise".

## Décisions clés
- **Pas d'image générée** pour le hero : mock dashboard CSS (KPI + bar chart + activité récente) pour rapidité et identité SaaS.
- **Tous les composants sont `'use client'`** car ils consomment le store Zustand `useAppStore`.
- **Navigation via store** : tous les boutons de navigation appellent `useAppStore.getState().setView(...)` ou `useAppStore.getState().openAuth('login' | 'signup')` conformément à CONVENTIONS.md.
- **Sticky footer** : `MarketingSite` wrapper en `flex min-h-screen flex-col`, le footer en `mt-auto` (obligation CONVENTIONS).
- **White-label** : aucune mention de Resend ni d'un fournisseur d'envoi spécifique. Le blog du footer renvoie vers `#` (placeholders). mail.oquitogo.com est mentionné comme domaine.
- **Tabs auth** : 3 états internes `login` / `signup` / `forgot` synchronisés avec `authMode` du store à l'ouverture.
- **Plan code Select** utilise `STARTER` / `BUSINESS` / `PREMIUM` (valeurs acceptées par `/api/auth/signup`).
- **Pas de backend contact** : la page Contact fait uniquement un toast (pas de POST API).
- **Couleurs** : `bg-primary`, `text-primary`, `text-primary-foreground`, `bg-mesh` (mesh gradient hero/CTA). Aucune bleu/indigo.

## Validation
- `bun run lint` : **0 erreur / 0 warning sur les fichiers créés**. Les 1 erreur + 1 warning restants sont sur des fichiers protégés (`src/lib/auth.ts` et `src/components/dashboard/shell/dashboard-shell.tsx`) — hors scope.
- `tsc --noEmit --skipLibCheck` : 0 erreur sur `src/components/marketing/*` et `src/components/auth/*`. Les erreurs TS restantes sont sur `src/lib/auth.ts` + `src/app/api/*` (Prisma narrowing, pré-existant, hors scope).
- Dev server : `GET / 200` après création des fichiers dashboard par l'agent parallèle (la route `/` compile et s'affiche).

## Note pour l'agent suivant
- Le composant `MarketingSite` est déjà câblé dans `src/app/page.tsx` (non modifié) pour `activeView='landing' | 'features' | 'pricing' | 'contact' | 'legal'`.
- L'auth modal est monté en overlay dans `src/app/page.tsx` (déjà présent).
- Aucune route Next.js créée (conforme à la règle monopage).
