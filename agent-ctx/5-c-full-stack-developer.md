# Agent Record — Task 5-c

**Task ID:** 5-c
**Agent:** full-stack-developer
**Task:** Build Statistics (detailed, rates, charts) + Subscription (plan, renew, payment sim) + RenewView

## Scope
3 fichiers stubs à écraser (les stubs 4-b):
- `src/components/dashboard/views/stats.tsx`
- `src/components/dashboard/views/subscription.tsx`
- `src/components/dashboard/views/renew-view.tsx`

## APIs consommées
- `GET /api/stats/overview?days=N` → `{ stats, trend }` (statistiques agrégées sur N jours)
- `GET /api/campaigns` → `{ campaigns: [...] }` (liste avec stats par campagne)
- `GET /api/subscription` → `{ subscription, plan }` (abonnement courant + plan actif)
- `POST /api/subscription { planCode, operationType: 'RENEW' }` → `{ linkId, token, expiresAt, planCode, planName, amount, currency }` (Developer only — génère un lien de renouvellement 24h)
- `POST /api/subscription/confirm { planCode, amount, cardLast4 }` → `{ payment, subscription, plan }` (Developer only — vérifie le prix côté serveur, active/renouvelle l'abonnement)

## Plans (cahier des charges section 7)
- STARTER: 20 USD / 3 mois — 1 000 e-mails/jour, 10 000 execs, 30 jours, stats essentielles, support ticket.
- BUSINESS: 45 USD / 3 mois — 5 000 e-mails/jour, 50 000 execs, 90 jours, stats avancées, support prioritaire.
- PREMIUM: 80 USD / 3 mois — 10 000 e-mails/jour, 100 000 execs, 180 jours, programmation avancée, rapports avancés, support prioritaire.

## Décisions clés
1. **Montant paiement toujours depuis le serveur** — la section "Paiement par carte" affiche `data.plan.price` (renvoyé par `GET /api/subscription`). Aucun montant frontend n'est codé en dur pour les transactions. Les prix hardcoded dans `PLANS[]` (section "Changer de plan") servent uniquement à l'affichage, pas à la transaction.
2. **cardLast4** extrait côté client du numéro saisi (jamais le PAN complet envoyé — confirm reçoit uniquement les 4 derniers chiffres).
3. **Sections Renouvellement + Paiement gated** par `workspace.memberRole === 'DEVELOPER'` (cohérent avec `requireDeveloper` côté serveur).
4. **Token extraction tolérante** dans renew-view: accepte bare token OU URL complète `https://mail.oquitogo.com/renew/<token>`.
5. **Patterns réutilisés de OverviewView (4-b)** pour cohérence visuelle (KpiCard, AreaChart gradients idempotents, ChartContainer/ChartTooltip/ChartLegend de shadcn).
6. **White-label**: aucune mention de Resend nulle part.
7. **Palette**: ambre/corail via `--primary`, `--chart-1..5`, `--destructive`, `--emerald-500` pour quota sain (pas d'indigo/bleu).
8. **Footer sticky** dans renew-view (`mt-auto` sur footer, layout `min-h-screen flex flex-col`). stats/subscription sont dans le shell (footer déjà présent dans `dashboard-shell.tsx`).

## Validation
- `bun run lint`: exit 0 sur les 3 fichiers (les erreurs résiduelles sont dans `campaign-new.tsx`, `templates.tsx`, `email-preview.tsx` — fichiers d'autres agents, hors scope).
- `npx tsc --noEmit`: 0 erreur sur les 3 fichiers (les erreurs pré-existantes dans `src/lib/auth.ts` et `src/app/api/*` ne sont pas touchées).
- Dev server: `✓ Compiled` successif sans erreur après création des 3 fichiers.
- Fichiers NON modifiés (interdits): `src/app/page.tsx`, `src/lib/*`, `prisma/schema.prisma`, `src/app/api/*`, `src/components/marketing/*`, `src/components/auth/*`, `src/components/dashboard/shell/*`, `src/components/email-editor/*`, et les stubs des autres vues (campaigns/campaign-new/campaign-detail/templates/contacts/lists/automations/domain/apikeys/support/audit/settings/owner-dashboard/overview).
