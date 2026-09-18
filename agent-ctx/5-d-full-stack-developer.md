# Task 5-d — full-stack-developer

Build Domain (SPF/DKIM/DMARC) + API Keys + Support + Audit + Owner Dashboard + Settings views for MailOqui.

## Work Log

- Read `worklog.md`, `CONVENTIONS.md` for full context (Task 1 schema, Task 4-a marketing site + auth, Task 4-b dashboard shell + overview).
- Read `src/lib/store.ts` (ViewKey, Role, WorkspaceInfo shape, actions: setView/openAuth/logout/refreshSession).
- Read existing stubs at `src/components/dashboard/views/{domain,apikeys,support,audit,owner-dashboard,settings}.tsx`.
- Read `src/app/page.tsx` and `src/components/dashboard/shell/dashboard-shell.tsx` to confirm the routing contract: `owner-dashboard` is rendered outside the shell by `page.tsx` when `view === 'owner-dashboard'`; all other developer views are rendered inside the shell via `VIEW_MAP`.
- Read shadcn components: `card`, `button`, `input`, `label`, `textarea`, `dialog`, `alert-dialog`, `table`, `tabs`, `select`, `switch`, `progress`, `badge`, `skeleton`, `chart`, `sonner` to confirm export shape & APIs.
- Read API routes I had to consume: `/api/domain` (GET/POST), `/api/apikeys` (GET/POST/DELETE), `/api/support` (GET/POST), `/api/audit?limit=` (GET), `/api/owner/stats` (GET) — confirmed response shapes and the simulated verification (domain ending with `oquitogo.com` or `mailoqui.com` → VERIFIE).
- Read `src/components/dashboard/shell/sidebar.tsx` to reuse the brand mark and to keep the `previewRole` banner consistent with the developer shell.
- Read `src/components/dashboard/views/overview.tsx` to mirror the chart conventions (ChartContainer, ChartTooltip, ChartLegend, defs gradients, fmt helpers).

### Files written (overwrote stubs)

1. **`src/components/dashboard/views/domain.tsx`** — Domain config + SPF/DKIM/DMARC cards
   - GET /api/domain on mount; loading skeleton; empty state ("Aucun domaine configuré").
   - Input + "Vérifier" button → POST /api/domain; regex `^([a-z0-9-]+\.)+[a-z]{2,}$` for client-side format validation.
   - Badges (NON_CONFIGURE gris, EN_VERIFICATION ambre, VERIFIE vert, ERREUR rouge) via `statusMeta()`.
   - When verified: green pill + last-checked date + "DNS détectés" message.
   - When error: red pill + `errors` from the API ("DNS introuvable…").
   - Three DNS cards (grid md:grid-cols-3): SPF `v=spf1 include:_spf.mailoqui.com ~all`, DKIM `mailoqui._domainkey` with the long `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...` value, DMARC `_dmarc TXT` `v=DMARC1; p=quarantine; rua=mailto:dmarc@mailoqui.com`.
   - Each card has a shadcn Table with Type / Hôte / Valeur + a copy-to-clipboard button (navigator.clipboard + sonner toast).
   - Note "Le système ne considère pas un domaine comme vérifié tant que les enregistrements DNS ne sont pas détectés techniquement." + "Relancer la vérification" button.
   - Footer note card with Mail icon for guidance.

2. **`src/components/dashboard/views/apikeys.tsx`** — API keys management
   - Security banner (amber) "Les clés API… ne sont jamais visibles par le propriétaire (Owner)." — white-label rule preserved.
   - Table (Nom, Préfixe `moq_live_xxxx…`, Statut [Actif vert / Révoqué rouge], Dernière utilisation, Création, Actions).
   - Empty state with CTA "Générer une clé".
   - "Générer une clé" Dialog: name input → POST /api/apikeys → on success, displays the raw key ONCE with a warning ("Copiez cette clé maintenant, elle ne sera plus jamais affichée."), a copy button, and a "J'ai copié ma clé" close button. Dialog state machine: create → reveal → close (clears raw key after 200ms to avoid flicker).
   - Revoke AlertDialog with destructive styling + "Révoquer définitivement" action; calls DELETE /api/apikeys?id=…
   - API documentation card (no real V1 impl): three example curl blocks for `/api/v1/campaigns`, `/api/v1/contacts`, `/api/v1/analytics` with method badges and code snippets. (Per spec: mock docs only.)

3. **`src/components/dashboard/views/support.tsx`** — Tickets
   - GET /api/support on mount; status filter Tabs (Tous / Ouverts / En cours / Résolus / Fermés).
   - Ticket list as clickable cards: subject, category badge (TECHNIQUE vert, FACTURATION ambre, COMPTE violet, AUTRE gris), priority badge (BASSE gris, NORMALE vert, HAUTE orange, URGENTE rouge), status badge (OUVERT ambre, EN_COURS sky, RESOLU vert, FERME gris), created/updated timestamps.
   - Empty state CTA.
   - "Nouveau ticket" Dialog: sujet, catégorie Select, priorité Select, message Textarea → POST /api/support → toast + reload.
   - Click on ticket → detail Dialog with the original message + a simulated support reply (from "Support MailOqui", with a green shield icon) + a "fermé" notice if applicable.

4. **`src/components/dashboard/views/audit.tsx`** — Audit logs
   - GET /api/audit?limit=50 on mount; status filter Select with all 12 actions from the spec (ALL + 11 named actions).
   - Table: Date (formatted FR), Utilisateur (firstName+lastName+email), Action (colored pill with Lucide icon per action type), Entité (entityType + truncated entityId), Détails (collapsible <details> showing `JSON.stringify(metadata, null, 2)` in a code block).
   - Pagination: "Charger plus" button increments limit by 50 up to 200 (only when filter is ALL).
   - Export CSV button: builds the CSV in-memory, prepends a UTF-8 BOM (`\uFEFF`), downloads via Blob + temp anchor; shows toast "Export en cours…" then "Export téléchargé.".
   - Empty state with ScrollText icon.

5. **`src/components/dashboard/views/owner-dashboard.tsx`** — Owner dashboard (read-only)
   - Top bar: sticky, backdrop-blur, BrandMark + workspace name + user name + Déconnexion button (calls store.logout).
   - Horizontal nav (Dashboard / Statistiques / Abonnement / Support) — internal local state `tab` for the first three, and the Support item calls `setView('support')` per spec. Min-height 44px for touch targets.
   - Preview banner preserved for Developer preview (`previewRole === 'OWNER'`) — "Aperçu du dashboard Owner — lecture seule" + Quitter button.
   - GET /api/owner/stats on mount; loading skeletons.
   - **Dashboard tab**: 4 KPI cards (Envoyés / Délivrés / Ouvertures / Clics) using chart-1..4 colors; AreaChart recharts with 4 series (SENT/DELIVERED/OPENED/CLICKED) + 4 gradient fills + ChartTooltip + ChartLegend + day-formatted XAxis; Subscription card (plan name, status badge, expiry date, quota progress, "Renouveler" button when EXPIRANT_BIENTO or EXPIRE → setView('renew')); Performance card (3 BigStat: délivrabilité, taux ouverture, taux clic); Recent campaigns card (3 latest campaigns with status, sentAt, recipientCount, mockOpenRate deterministic per id).
   - **Statistiques tab**: 4 KPI cards + an expanded full-width AreaChart.
   - **Abonnement tab**: dedicated subscription card with renewal CTA.
   - **Support CTA encart**: card "Besoin d'aide? Ouvrez un ticket" → setView('support') (per spec). Hidden on the Abonnement tab and on empty/loading states.
   - Empty state: "Bienvenue sur MailOqui" with Mail icon and "Contacter le support" CTA when `sent === 0`.
   - Sticky footer `mt-auto` ("MailOqui — mail.oquitogo.com" + v0.1.0).
   - Wrapper is `min-h-screen flex flex-col`. Responsive: cards collapse to 1 col on mobile, chart is full-width.
   - **No mention of SPF/DKIM/DMARC, API keys, or audit logs anywhere in the Owner UI** — per spec UX rule.

6. **`src/components/dashboard/views/settings.tsx`** — Settings
   - Tabs: Profil / Workspace (hidden when `memberRole === 'OWNER`) / Notifications / Sécurité.
   - **Profil**: firstName + lastName + email (disabled — "ne peut pas être modifiée ici"), "Mettre à jour le profil" → toast.success. Syncs from store.user on mount.
   - **Workspace**: name + timezone Select (16 TZs incl. Africa/Lome, Europe/Paris, Africa/Lagos, …), "Mettre à jour le workspace" → toast.
   - **Notifications**: 7 switches (Invitation, Paiement, Activation, Expiration, Quota, Domaine, Ticket), each with description; "Enregistrer" → toast.
   - **Sécurité**: change password (3 fields, validation min 8 + match, toast); 2FA switch DISABLED with "Bientôt disponible" pill; active sessions (3 mock entries: Chrome/macOS current, Safari/iPhone, Firefox/Windows) with revoke buttons; **Zone de danger** card (destructive border): "Supprimer le workspace" AlertDialog with a typed confirmation field (user must type the workspace name to enable the destructive action button).
   - Footer info row: email + plan + memberRole.

## Stage Summary

### Files overwritten (stubs → full implementations)
- `src/components/dashboard/views/domain.tsx`
- `src/components/dashboard/views/apikeys.tsx`
- `src/components/dashboard/views/support.tsx`
- `src/components/dashboard/views/audit.tsx`
- `src/components/dashboard/views/owner-dashboard.tsx`
- `src/components/dashboard/views/settings.tsx`

### Decisions clés
- **White-label preserved**: aucune mention de Resend dans l'UI; bandeau de sécurité apikeys rappelle que les Owner ne voient jamais les clés; le dashboard Owner n'expose ni SPF/DKIM/DMARC, ni clés API, ni journaux d'audit.
- **Couleurs**: palette ambre/corail (primary) + accents emerald/amber/sky/violet/orange/destructive pour badges selon le type. Aucun bleu/indigo comme couleur principale.
- **Toast**: `sonner` partout (déjà monté par 4-a).
- **Fetch**: tous relatifs (`/api/...`), `cache: 'no-store'`, try/catch silencieux avec fallback vers état vide.
- **État de chargement**: Skeleton shadcn pendant le fetch, empty states avec icône + CTA quand la liste est vide.
- **Confirmations**: AlertDialog pour la révocation de clé et la suppression de workspace (avec champ de confirmation typé pour le workspace).
- **Export CSV**: construit en mémoire, BOM UTF-8 pour Excel, téléchargement via Blob + ancre temporaire.
- **Charts**: ChartContainer/ChartTooltip/ChartLegend (shadcn) + AreaChart recharts avec defs gradients, exactement comme dans `overview.tsx`.
- **Owner navigation**: nav horizontale (pas de sidebar), 3 onglets internes (dashboard/stats/subscription) + Support qui sort vers `setView('support')` (route du shell developer — `requireAuth`, donc accessible aux Owners).
- **Sticky footer**: wrapper `min-h-screen flex flex-col` + footer `mt-auto` partout (owner-dashboard standalone + au sein du shell developer via le footer existant).
- **Responsive**: mobile-first, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, nav horizontale scrollable, touch targets ≥ 44px.

### Validation
- `bun run lint` → exit 0, aucune erreur sur les nouveaux fichiers.
- `npx tsc --noEmit` → aucune erreur sur les nouveaux fichiers (les erreurs résiduelles sont toutes dans `src/app/api/*` et `src/lib/auth.ts` pré-existants et hors scope).
- Dev server: `GET / 200 in 78ms`, `GET /api/auth/me 401` (non authentifié — attendu).

### Aucune modification de
- `src/app/page.tsx`, `src/lib/store.ts`, `src/lib/auth.ts`, `src/lib/db.ts`, `prisma/schema.prisma`, `src/app/api/*`, `src/components/marketing/*`, `src/components/auth/*`, `src/components/dashboard/shell/*`, `src/components/email-editor/*`.
- Aucun stub tiers écrasé (campaigns, campaign-new, campaign-detail, templates, contacts, lists, automations, stats, subscription, renew-view, overview — intouchés).
