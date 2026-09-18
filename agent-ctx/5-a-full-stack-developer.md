# Task 5-a — full-stack-developer

Build Campaigns module (list, wizard, detail, send) + Templates + email editor.

## Work Log
- Read `/home/z/my-project/worklog.md` (Task 1 + 4-a + 4-b entries) and `CONVENTIONS.md` to absorb project rules (single SPA route `/`, store Zustand `view`/`viewParam`/`workspace`, fetch relative only, amber/coral palette, no indigo/blue, shadcn/ui set already complete).
- Read `src/lib/store.ts`, `src/components/dashboard/shell/dashboard-shell.tsx` (to confirm `VIEW_MAP` mapping incl. `editor → CampaignNewView` alias), `src/components/dashboard/views/overview.tsx` (to mirror chart usage + KPI card pattern), `src/components/dashboard/views/{campaigns,campaign-new,campaign-detail,templates}.tsx` stubs (to be overwritten), `src/lib/api.ts`, `src/lib/utils.ts`, `src/app/api/campaigns/route.ts`, `src/app/api/campaigns/[id]/route.ts`, `src/app/api/campaigns/[id]/send/route.ts`, `src/app/api/templates/route.ts`, `src/app/api/contacts/route.ts`, `src/app/api/seed/demo/route.ts` (to confirm API contract + response shapes), `prisma/schema.prisma` (Campaign / Template / EmailEvent models), `src/app/globals.css` (palette tokens), shadcn UI components actually used (`button`, `card`, `badge`, `input`, `textarea`, `label`, `table`, `tabs`, `select`, `radio-group`, `dialog`, `alert-dialog`, `dropdown-menu`, `separator`, `skeleton`, `popover`, `scroll-area`, `tooltip`), `agent-ctx/4-b-full-stack-developer.md` for previous conventions.
- Created `src/components/email-editor/types.ts` — `BlockType`, `Block`, `SampleData`, `VARIABLE_TOKENS`, `DEFAULT_SAMPLE_DATA`, helpers `makeBlockId`, `createBlock(type)` factory, `substituteVariables(text, data)`, `parseBlocks(raw)` validator/normalizer for safe ingestion of API payloads.
- Created `src/components/email-editor/email-preview.tsx` — controlled `EmailPreview` rendering blocks to HTML inside a `max-w-2xl` white card with amber MailOqui header (workspace name + mail.oquitogo.com) and unsubscribe footer. Substitutes `{{prenom}}`, `{{nom}}`, `{{email}}`, `{{entreprise}}` with sampleData (default Awa/Agbode/awa@example.com/OquiTogo). Renders title, text, button (with bg/color pickers), image (`<img>` with alt + caption), divider, list (ul).
- Created `src/components/email-editor/email-editor.tsx` — visual block editor. Left toolbar = palette (Titre/Texte/Bouton/Image/Séparateur/Liste) + "Variable" dropdown + Edit/Aperçu toggle. Block list with reordering (up/down), inline editing (input/textarea/color pickers/align buttons), per-row delete. Empty state. Variable insertion via focused input (uses `document.activeElement` + `setSelectionRange` to place the token at caret). `previewOnly` / `hidePreviewToggle` props for read-only or embedded use cases.
- Overwrote `src/components/dashboard/views/campaigns.tsx` — list view: header with "Nouvelle campagne" + refresh button; 6 summary cards (Total / Brouillons / Programmées / En cours / Envoyées / Annulées+Échouées) with colored dot indicators; Tabs filter (Toutes / Brouillons / Programmées / En cours / Envoyées / Annulées); search input (name+subject); shadcn Table (Nom, Sujet, Statut, Destinataires, Taux ouverture, Taux clic, Date envoi/programmation, Actions). StatusBadge uses solid bg-amber-500 / bg-emerald-600 / bg-red-500 / bg-slate-500 with text-white (per spec, no indigo). Action menu = Voir / Dupliquer / Supprimer (AlertDialog confirmation). Row click → `setView('campaign-detail', id)`. Loading skeletons + empty state CTA + window focus auto-refresh.
- Overwrote `src/components/dashboard/views/campaign-new.tsx` — 5-step wizard:
  1. Nom + description (textarea),
  2. Expéditeur (fromName default = workspace.name) + fromEmail (default = `newsletter@mailoqui.com`, auto-detected from `GET /api/domain`) + subject (required) + preheader (optional),
  3. Contenu → `<EmailEditor>` (full palette + variable insertion),
  4. Destinataires → RadioGroup (Tous actifs / Une liste / Un segment) with estimated count fetched from `/api/contacts?status=ACTIF&pageSize=1`,
  5. Test & envoi → test e-mail toast, schedule (`<input type="datetime-local">` + Programmer button), Save draft, Send now.
  
  Stepper at top (numbered circles + labels + chevrons + clickable past steps). Wizard supports **edit mode**: when `viewParam` is set (from `setView('campaign-new', id)` or `setView('editor', id)`), it loads `GET /api/campaigns/[id]`, pre-fills name/fromName/fromEmail/subject/blocks/scheduledAt, then on submit PATCHes the existing campaign (instead of POSTing a new one). For "Envoyer maintenant" → POST `/api/campaigns/[id]/send` with rich error mapping (SUBSCRIPTION_INACTIVE / DOMAIN_NOT_VERIFIED / QUOTA_EXCEEDED / INCOMPLETE_CAMPAIGN). On success → `setView('campaign-detail', id)` + `refreshSession()`.
- Overwrote `src/components/dashboard/views/campaign-detail.tsx` — detail view: back link + header (name + status badge + action buttons depending on status):
  - BROUILLON: Modifier (→ `setView('editor', id)`), Programmer (→ editor), Envoyer (POST send), Dupliquer, Supprimer
  - PROGRAMMEE: Annuler la programmation (PATCH status=BROUILLON, scheduledAt=null), Supprimer
  - EN_COURS: badge "Envoi en cours…" with spinner
  - ENVOYEE: Voir les stats (smooth scroll), Dupliquer, Supprimer
  
  Détails card (expéditeur, sujet, destinataires, créée le, programmée pour, envoyée le). Stats card (only if ENVOYEE) with 6 KPI cards (Envoyés, Délivrés + délivrabilité %, Ouvertures + taux %, Clics + taux %, Bounces + taux %, Désabonnements + taux %) + vertical BarChart (recharts) of event distribution with per-bar Cell colors. Aperçu de l'e-mail card rendering `<EmailPreview>`. Événements récents card with shadcn Table (e-mail, type badge coloré, date + relative "il y a X"). Delete confirmation via AlertDialog. Hooks order fixed: `useRef` (statsRef) moved before early returns to comply with rules-of-hooks.
- Overwrote `src/components/dashboard/views/templates.tsx` — gallery view: header + refresh + "Nouveau modèle" button; Tabs filter by category (Toutes / Newsletter / Promotion / Bienvenue / Transactionnel / Evenement / Information); responsive grid (1/2/3/4 cols) of TemplateCards. Each card: thumbnail (gradient from category palette or template.thumbnail), name, category badge, bloc count, "Aperçu" / "Utiliser" / "Supprimer" buttons. Preview Dialog rendering `EmailPreview` (compact mode) with "Utiliser ce modèle" CTA. Create Dialog with name + category Select + `<EmailEditor>` (hidePreviewToggle) + Save button. Delete confirmation via AlertDialog (simulated client-side removal since the templates route does not expose DELETE in V1; a code comment explains how to swap to a real DELETE once added). "Utiliser" creates a new campaign via POST /api/campaigns with the template's parsed content + routes to `campaign-new` with the new id.
- Lint initial run flagged 4 issues:
  1. unused `eslint-disable` directive in `campaign-new.tsx` (react-hooks/exhaustive-deps already off in eslint.config.mjs) → removed directive.
  2. unused `eslint-disable` directive in `email-preview.tsx` (`@next/next/no-img-element` is not active) → removed directive.
  3 & 4. `react-hooks/rules-of-hooks` errors in `templates.tsx` — the function name `useTemplate` started with `use` so ESLint treated it as a hook called inside a callback → renamed to `startCampaignFromTemplate`.
  
  Final `bun run lint`: exit 0, 0 errors, 0 warnings.
- `npx tsc --noEmit` on the new files: 0 errors. (All TS errors reported are in pre-existing files outside this task's scope: `src/app/api/*` and `src/lib/auth.ts` from Task 1, untouched here.)
- Dev server log: shows successful incremental compilations (`✓ Compiled in Xms`) after each file write — the views load cleanly inside the existing dashboard shell.

## Files created
- `src/components/email-editor/types.ts`
- `src/components/email-editor/email-preview.tsx`
- `src/components/email-editor/email-editor.tsx`

## Files overwritten (stubs replaced with full implementations)
- `src/components/dashboard/views/campaigns.tsx`
- `src/components/dashboard/views/campaign-new.tsx`
- `src/components/dashboard/views/campaign-detail.tsx`
- `src/components/dashboard/views/templates.tsx`

## Stage Summary
- MailOqui Campagnes module fully built and wired into the dashboard shell via the existing `VIEW_MAP` (campaigns / campaign-new / campaign-detail / editor / templates). All flows tested compile-time:
  - List → filters, search, table, actions (Voir / Dupliquer / Supprimer) + window-focus auto-refresh.
  - Wizard → 5-step Stepper + edit mode (loads via GET, PATCHes on save).
  - Send → POST `/api/campaigns/[id]/send` with full error mapping for the 4 documented 4xx codes.
  - Schedule → PATCH `{status:'PROGRAMMEE', scheduledAt}` after persist.
  - Detail → KPI cards + recharts BarChart + EmailPreview + recent events table.
  - Templates → gallery + preview Dialog + create Dialog (with embedded EmailEditor) + "Utiliser" creates a new campaign.
  - EmailEditor → block palette (6 types), inline editing, reordering, variable insertion at caret, preview toggle.
- Decisions: (1) kept all colors strictly within the amber/coral/emerald/red/slate palette required by the spec (NO indigo/blue); (2) test send simulated client-side (no API exists in V1) with explicit toast; (3) schedule uses native `<input type="datetime-local">` wrapped in our styling for reliability without a custom popover; (4) templates DELETE is simulated client-side with a code comment pointing at the future endpoint; (5) hooks order in campaign-detail adjusted (useRef moved before early returns).
- No modification to: `src/app/page.tsx`, `src/lib/*`, `prisma/schema.prisma`, `src/app/api/*`, `src/components/marketing/*`, `src/components/auth/*`, `src/components/dashboard/shell/*`, or any other view stub (`contacts.tsx`, `lists.tsx`, `automations.tsx`, `stats.tsx`, `subscription.tsx`, `domain.tsx`, `apikeys.tsx`, `support.tsx`, `audit.tsx`, `settings.tsx`, `owner-dashboard.tsx`, `renew-view.tsx`, `overview.tsx`).
- `bun run lint` passes (exit 0). TypeScript clean on the new files. Next.js dev server compiles cleanly.
