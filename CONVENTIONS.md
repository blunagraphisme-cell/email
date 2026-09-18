# MailOqui — Conventions partagées (CONVENTIONS.md)

Lecture obligatoire pour tous les subagents.

## Stack & règles
- Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui complet (déjà installé).
- Prisma + SQLite. Client: `import { db } from '@/lib/db'`.
- Auth serveur: `import { getSecurityContext, getCurrentUser, requireDeveloper, requireAuth, ok, fail, hashPassword, verifyPassword, createSession, setSessionCookie, randomToken, hashToken, addMonthsCal, bumpQuota, getQuotaUsageToday, planLimit } from '@/lib/auth'` ou `'@/lib/api'`.
- icônes: `lucide-react`.
- charts: `recharts` (déjà installé).
- state client: `zustand` via `@/lib/store` (voir ci-dessous).
- zod pour validation.
- PAS de bleu/indigo comme couleur principale. MailOqui utilise un ambre/corail (déjà configuré dans globals.css).
- Footer sticky obligatoire (`min-h-screen flex flex-col`, footer en `mt-auto`).
- Responsive mobile-first. Touch targets ≥ 44px.
- Aucune route Next.js autre que `/`. Tout est une SPA monopage avec routeur d'état.
- API routes autorisées sous `/api/*` (elles ne sont PAS des "routes" visibles — le gateway Caddy gère).
- z-ai-web-dev-sdk seulement côté serveur (jamais dans le bundle client).

## Store Zustand (`src/lib/store.ts`)
- `view: ViewKey` — vue courante
- `viewParam: string | null` — paramètre (ex: campaignId)
- `user: SessionUser | null`
- `workspace: WorkspaceInfo | null` — contient id, name, status, planCode, planName, subscriptionStatus, dailyEmailLimit, emailsSentToday, memberRole
- `previewRole: Role | null` — un Developer peut prévisualiser le dashboard Owner
- `setView(view, param?)` — change de vue (scroll top auto)
- `setUser(u)`, `setWorkspace(w)`, `setPreviewRole(r)`
- `openAuth('login'|'signup')`, `closeAuth()`
- `logout()` — POST /api/auth/logout + reset
- `refreshSession()` — GET /api/auth/me + maj user/workspace

### Views disponibles
`'landing' | 'features' | 'pricing' | 'contact' | 'legal' | 'login' | 'signup' | 'forgot' | 'dashboard' | 'campaigns' | 'campaign-new' | 'campaign-detail' | 'editor' | 'contacts' | 'lists' | 'automations' | 'templates' | 'stats' | 'subscription' | 'domain' | 'apikeys' | 'support' | 'audit' | 'settings' | 'renew' | 'owner-dashboard'`

## Layout monopage (`src/app/page.tsx`)
- Non authentifié + vue publique → `<MarketingSite activeView={view} />`
- Authentifié + role OWNER → `<OwnerDashboard />`
- Authentifié + role DEVELOPER → `<DashboardShell />` (sauf `view='renew'` → `<RenewView/>`)

## Composants shadcn/ui disponibles
Tout est dans `src/components/ui/`. NE PAS recréer. Importer via `@/components/ui/xxx`.
En particulier: button, card, input, label, textarea, dialog, dropdown-menu, sheet, sidebar, tabs, table, badge, avatar, tooltip, progress, select, switch, checkbox, radio-group, form, command, popover, calendar, sonner, toast, alert, alert-dialog, skeleton, scroll-area, separator, accordion, breadcrumb, carousel, hover-card, menubar, navigation-menu, pagination, slider, toggle, toggle-group.

## API endpoints existants (à consommer côté client via fetch relatif)
- `POST /api/auth/signup` {email,password,firstName,lastName,workspaceName,planCode} → {user, workspace}
- `POST /api/auth/login` {email,password} → {user}
- `POST /api/auth/logout`
- `GET  /api/auth/me` → {user, workspace} ou 401
- `POST /api/seed/init` — initialise plans + platform admin
- `POST /api/seed/demo` — peuple workspace courant avec données démo
- `GET/POST /api/campaigns`
- `GET/PATCH/DELETE /api/campaigns/[id]`
- `POST /api/campaigns/[id]/send`
- `GET/POST/DELETE /api/contacts`
- `GET/POST /api/templates`
- `GET/POST /api/automations`
- `GET/POST /api/lists`
- `GET /api/stats/overview?days=30`
- `GET /api/stats/campaign?id=...`
- `GET/POST /api/subscription` (POST génère lien renouvellement)
- `POST /api/subscription/confirm` {planCode, amount, cardLast4?} → active abonnement
- `GET/POST /api/domain`
- `GET/POST/DELETE /api/apikeys`
- `GET/POST /api/support`
- `GET /api/audit?limit=50`
- `GET/POST /api/notifications` (POST = mark all read)
- `GET /api/owner/stats`

## Conventions de nommage
- Composants client: `'use client'` en haut du fichier.
- Fichiers composants: `src/components/<domaine>/<nom>.tsx`.
- Pour le dashboard: `src/components/dashboard/shell/*` et `src/components/dashboard/views/*`.
- Pour le marketing: `src/components/marketing/*`.
- Pour l'auth: `src/components/auth/*`.
- Pour l'éditeur email: `src/components/email-editor/*`.
- Types partagés dans `src/lib/types.ts` si besoin.
- NE PAS créer de nouveaux fichiers `src/app/*` (route). Uniquement `src/components/*` et `src/lib/*`.

## Couleurs MailOqui (déjà dans globals.css)
- `primary` = ambre/corail (oklch 0.62 0.18 38) — boutons, accents
- `chart-1` = ambre, `chart-2` = vert, `chart-3` = violet, `chart-4` = jaune, `chart-5` = magenta
- Utiliser `bg-primary text-primary-foreground` pour les boutons principaux
- Cards: `bg-card border border-border rounded-lg shadow-sm`
- Sidebar: utilise `bg-sidebar text-sidebar-foreground` (déjà configuré)

## Toasts
- `import { toast } from 'sonner'` pour les notifications (déjà monté dans layout)
- Ou `import { useToast } from '@/hooks/use-toast'` pour le toaster radix

## Navigation
- Pour changer de vue: `const setView = useAppStore(s => s.setView); setView('campaigns')`
- Pour ouvrir auth: `useAppStore.getState().openAuth('login')` (pas besoin de hook)
- Le `MarketingSite` reçoit `activeView` et rend la section correspondante (landing/features/pricing/contact/legal).

## Données démo
- Le `POST /api/seed/demo` peuple: 24 contacts, 4 templates, 2 automations, 3 campagnes (1 envoyée avec ~1400 événements, 1 programmée, 1 brouillon), 4 listes, 2 segments, domaine vérifié, 3 notifications, audit logs.
- À appeler après inscription pour avoir des stats à afficher immédiatement.
