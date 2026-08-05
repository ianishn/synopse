# Backend Synopse — Doc de maintenance

> Public : le fondateur (non-dev) et tout intervenant futur. But : comprendre, diagnostiquer, réparer.
> Compléments : `docs/SYNOPSE-BUILD-SPEC.md` (spec), `spike-f3/README.md` (preuve d'interception).

## 1. Vue d'ensemble

```
Plugin (chez le client, OpenClaw)          Backend (Vercel)                 Données (Supabase EU)
  hook before_tool_call                      Next.js apps/web                 Postgres + Auth + RLS
  évalue les règles LOCALEMENT   ──HTTP──▶   /api/agent/* (token agent)  ──▶  tables (voir §3)
  poll le verdict des approvals             /dashboard (session user)
  fail-safe si API injoignable              Vercel Cron (timeouts, purge)
```

Deux chemins d'authentification, à ne jamais mélanger :
- **Humain** : session Supabase (cookies, gérée par `apps/web/middleware.ts`). RLS = chaque user ne voit que ses lignes.
- **Plugin** : header `Authorization: Bearer <token-agent>`. L'API hashe (SHA-256) et compare à `agents.pairing_token_hash`, puis agit via `service_role` (bypass RLS). Révoquer un agent = régénérer son token.

## 2. Fichiers clés

| Quoi | Où |
|---|---|
| Schéma DB + RLS (source de vérité SQL) | `supabase/migrations/0001_init.sql` |
| Types DB miroir + contrat API + matchers + prix | `packages/shared/src/*.ts` |
| Clients Supabase (session, service_role) | `apps/web/lib/supabase/server.ts`, `client.ts` |
| Protection des routes + refresh session | `apps/web/middleware.ts` |
| Variables d'env attendues | `apps/web/.env.example` |

**Règle d'or** : toute modif du schéma SQL ⇒ nouvelle migration `supabase/migrations/000X_*.sql` (jamais éditer une migration déjà appliquée) ⇒ mettre à jour `packages/shared/src/db.ts`.

## 3. Tables (résumé)

- `agents` — un agent protégé par user. `status` : active | frozen (kill switch) | silent (heartbeat manquant). `pairing_token_hash` : SHA-256 du token plugin, jamais le token en clair.
- `rule_templates` — catalogue global FR (seedé depuis le repo, étape F2). Lecture seule pour les users.
- `rules` — règles activées (user, éventuellement par agent). `severity` : block | confirm | notify.
- `approvals` — demandes de validation. `pending` → approved/denied (tap Telegram ou web) ou `expired` (cron, refus par défaut). Payload chiffré AES-GCM (`PAYLOAD_ENCRYPTION_KEY`).
- `events` — journal lisible 90 j (`summary_fr` déterministe). Purge par cron.
- `spend` — agrégat tokens/coût par agent et par jour (plafonds F4).
- `subscriptions` — miroir Stripe (webhooks, étape F8).

## 4. Contrat API plugin (types : `packages/shared/src/api.ts`)

| Endpoint | Rôle | Point de vigilance |
|---|---|---|
| `POST /api/agent/events` | journal + usage tokens | batch accepté |
| `POST /api/agent/approvals` | créer une demande | répond `approval_id` + `expires_at` |
| `GET /api/agent/approvals/:id` | polling verdict | backoff côté plugin |
| `POST /api/agent/heartbeat` | vivant + statut | renvoie `agent_status` (kill switch) + `config_etag` |
| `GET /api/agent/config` | règles compilées | 304 si etag inchangé |

**Fail-safe (invariant produit)** : plugin sans réseau ou API down ⇒ `block` bloque, `confirm` refuse. Jamais de fail-open. Timeout d'approbation (15 min) ⇒ refus.

## 5. Jobs planifiés

- **`GET /api/cron/check`** (à la minute) fait tout : expiration des approvals (refus), détection heartbeat > 15 min (`silent` + alerte Telegram), purge events > 90 j. Auth : header Vercel Cron OU `Bearer CRON_SECRET`.
- ⚠️ **Vercel Hobby limite les crons à 1/jour** : si le projet est en Hobby, brancher un pinger externe gratuit (cron-job.org, à la minute) sur l'URL avec le header `Authorization: Bearer <CRON_SECRET>`. `vercel.json` contient déjà l'entrée cron pour un éventuel plan Pro.
- **`GET /api/cron/weekly`** (dim. 18h) : rapport hebdo par compte (blocages, validations, coût) → Telegram + email Resend si `RESEND_API_KEY` présent.

## 5bis. Kill switch & plafonds (implémenté)

- **Gel** : bouton dashboard (`POST /api/agents/:id/freeze`) ou message Telegram `STOP` (gèle tous les agents du compte lié ; `REPRISE` dégèle). Le plugin re-vérifie le statut à chaque tool call si le dernier check date de > 25 s → latence de gel < 30 s, conforme spec.
- **Plafonds** (colonnes `agents.daily_budget_eur` / `monthly_budget_eur`, migration 0003) : à 80 % du budget jour → alerte Telegram (dédupliquée 1/jour via event `budget_alert`) ; à 100 % (jour ou mois) → règle système « tout en confirm » injectée dans la config compilée (l'etag change → le plugin l'applique en < 30 s).
- **Usage tokens** : le plugin écoute le hook `llm_output` (usage.input/output). ⚠️ Ce hook ne se déclenche PAS en mode CLI embarqué (`agent --local`) — uniquement en mode gateway (le mode réel des clients). Vérifié côté serveur : l'agrégation `spend` et le calcul de coût sont corrects. À re-vérifier en gateway au moment du beta (étape 5).

## 5quater. Gestion des règles (F2 UI, implémenté)

- Écran `/dashboard/rules` : catalogue `RULES_CATALOG` (`packages/shared`) groupé par profil (Perso / Commerçant / Builder), toggles + bouton « Tout activer » par profil.
- `POST /api/rules` `{ template_id, enabled }` : active/désactive une règle. Enable = insert/update `rules` (sévérité = défaut du template). Pas d'upsert (évite d'exiger une contrainte unique DB) : vérifier-puis-agir.
- `POST /api/rules/profile` `{ profile }` : active toutes les règles du profil ; renvoie `activated_ids` (exact, pour l'UI) et `truncated` si le plan a bridé.
- **Limite plan gratuit = 3 règles actives** (`lib/plan.ts` : `maxRules`), enforcée côté API (403 `code:"limit"`), pas seulement dans l'UI. Vérifié E2E : 3 OK / 4e refusée / désactivation libère un slot / activation de profil tronquée / Protégé lève la limite.

## 5ter. Billing (F8, implémenté)

- Stripe **sans SDK** (`lib/stripe.ts`, fetch form-encodé). Produits/prix créés en test : Protégé 9 €/mois, Studio 19 €/mois (ids dans `.env.local`). À recréer en mode live avant lancement (mêmes commandes, clé live) — penser à activer **Stripe Tax** dans le dashboard.
- Flux : `POST /api/billing/checkout` (session user → URL Stripe Checkout) ; `POST /api/billing/portal` (gérer/annuler) ; `POST /api/stripe/webhook` → table `subscriptions` (source de vérité : Stripe ; `deleted`/inactif ⇒ retour plan free).
- ⚠️ Webhook : en prod, créer l'endpoint dans Stripe Dashboard et renseigner `STRIPE_WEBHOOK_SECRET` dans Vercel — sans lui, la signature n'est PAS vérifiée (toléré uniquement en dev local).
- Enforcement des limites : côté API (`/api/pairing` : 1 agent en free/protégé, 5 en studio). Limite « 3 règles en gratuit » : à brancher dans la future route de gestion des règles (UI règles pas encore construite).

## 6. Runbook — symptôme → diagnostic

- **Un user ne voit aucune donnée** : vérifier la session (cookies) ; si connecté, suspecter une policy RLS (tester la requête dans SQL Editor avec `set role authenticated; set request.jwt.claims...`).
- **Le plugin reçoit 401** : token révoqué ou hash absent — régénérer le pairing depuis le dashboard.
- **Approvals jamais expirées** : cron Vercel en panne — vérifier l'onglet Cron du projet Vercel + logs.
- **Notifications Telegram muettes** : tester `getMe` avec le token du bot ; vérifier `TELEGRAM_BOT_TOKEN` dans Vercel env. ⚠️ Fins de ligne CRLF dans un `.env` local Windows = token invalide (vécu au spike).
- **Coûts estimés faux** : mettre à jour `packages/shared/src/pricing.ts` (table manuelle).
- **Erreur « service_role » côté navigateur** : fuite grave — `SUPABASE_SERVICE_ROLE_KEY` ne doit exister que dans les routes serveur. Auditer les imports de `createServiceClient`.

## 6bis. Telegram — dev vs prod

- **Prod** : Telegram pousse vers `/api/telegram/webhook` (vérif header secret). Activer une fois :
  `curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://www.synopse.eu/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"`
- **Dev local** : Telegram ne peut pas joindre localhost → lancer `node scripts/telegram-poll.mjs` (même logique, via getUpdates). ⚠️ Ne jamais faire tourner le poller quand le webhook prod est actif (conflit getUpdates/webhook).
- Liaison compte↔chat : le dashboard génère `telegram_link_code` (user_settings), l'user clique `t.me/<bot>?start=<code>`, le webhook renseigne `telegram_chat_id`. Fallback dev : env `TELEGRAM_CHAT_ID`.

## 6ter. Plugin (packages/plugin)

- Env requis chez le client : `SYNOPSE_AGENT_TOKEN` (+ `SYNOPSE_API_URL` hors prod).
- Config OpenClaw : `plugins.load.paths=[<dossier plugin>]` et `plugins.entries.synopse.hooks.timeoutMs=600000` (max OpenClaw = 10 min < timeout d'approbation 15 min : au-delà de 10 min sans réponse, OpenClaw rejette l'outil lui-même → toujours un refus, jamais un passage).
- Cache config : `~/.synopse/config-cache.json` (fail-safe hors ligne). Kill switch : statut re-vérifié à chaque tool call si dernier check > 25 s → gel effectif < 30 s.
- `@synopse/shared` doit être **buildé** (`pnpm --filter @synopse/shared build`) : le plugin importe `dist/`.

## 6quater. Sécurité (audit 2026-08-03)

**Modèle** : deux chemins d'auth (session humaine RLS / token d'agent hashé). Payloads d'approbation chiffrés AES-256-GCM (IV aléatoire + tag). Secrets serveur jamais exposés au navigateur.

**Corrigé lors de l'audit** :
- **Webhook Stripe fail-closed en prod** : sans `STRIPE_WEBHOOK_SECRET`, le webhook est REFUSÉ (avant : accepté sans signature → un événement forgé pouvait accorder un plan payant). Bypass toléré uniquement en dev.
- **Crons durcis** (`lib/cron-auth.ts`) : on n'accepte plus l'en-tête `x-vercel-cron` (falsifiable) — seul `Authorization: Bearer <CRON_SECRET>` autorise. Vercel Cron l'ajoute automatiquement si `CRON_SECRET` est défini. Sans ce secret → tout est refusé.
- **En-têtes de sécurité** (`next.config.ts`) sur toutes les routes : HSTS, `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (anti-clickjacking du dashboard), `nosniff`, `Referrer-Policy`, `Permissions-Policy`.

**Vérifié sain** : RLS testée (isolation inter-users), gardes de propriété sur delete/freeze agent (404/401), signature Stripe en HMAC + fenêtre anti-rejeu 5 min, webhook Telegram protégé par secret + commandes STOP/REPRISE limitées au compte lié, tokens d'agent 24 octets aléatoires révocables, CSRF mitigé par cookies Supabase `SameSite=Lax`.

**Ajouté au 2e passage** :
- **CSP complète en production** (`next.config.ts`) : `default-src 'self'`, `connect-src` limité à Supabase (REST/auth + realtime wss) et PostHog, `script-src`/`style-src 'self' 'unsafe-inline'` (Next hydratation + Tailwind), `object-src 'none'`, `base-uri`/`form-action 'self'`, `upgrade-insecure-requests`. **Prod uniquement** (le dev garde eval pour React refresh). ⚠️ La CSP est appliquée par le navigateur : après un changement, vérifier que login + dashboard se chargent sans erreur console. La barre d'outils Vercel Live (preview) peut être bloquée — sans impact.
- **Dépendances** : override pnpm `postcss: 8.5.25` (`pnpm-workspace.yaml`) → advisories postcss résolus sans upgrade majeur de Next. Reste 1 high `sharp` (libvips) : module natif d'optimisation d'images, **non exploitable** (on ne traite aucune image utilisateur) ; ne pas forcer sa version (binaire natif). Réévaluer à la prochaine montée de Next.

**Rate limiting** — sur ce stack serverless, un limiteur en mémoire est inefficace (fonctions sans état). État des lieux :
- **Login/signup** : déjà rate-limité côté **Supabase Auth** (limites par IP intégrées). OK.
- **Webhooks** : protégés par signature/secret → un flood ne coûte qu'un 400/403.
- **`/api/agent/*`** : token 24 octets aléatoires → brute force infaisable.
- Pour aller plus loin à l'échelle : activer **Vercel WAF** (règles de rate limiting par IP dans le dashboard Vercel, sans code) ou brancher **Upstash Redis** (`@upstash/ratelimit`). Décision infra, à activer au moment du trafic.

**Secrets prod à poser avant lancement** : `STRIPE_WEBHOOK_SECRET` (Stripe Dashboard) et enregistrer le webhook Telegram avec `TELEGRAM_WEBHOOK_SECRET` (voir §6bis).

## 6quinquies. Connecteur Claude Code (validé E2E 2026-08-06)

Deuxième plateforme après OpenClaw. Même backend, même token, zéro changement serveur.

- **Source** : `packages/plugin/claude-hook.mjs` — portage stdin/stdout du plugin OpenClaw.
  Hook **PreToolUse** : reçoit `{ tool_name, tool_input }` sur stdin, répond
  `{ hookSpecificOutput: { permissionDecision: "deny", ... } }` sur stdout. Pas de sortie
  = flux de permission normal de Claude Code (on ne contourne jamais ses garde-fous natifs).
- **Distribution** : bundle autonome (esbuild, ~8 ko) servi sur `https://www.synopse.eu/claude-hook.mjs`
  (fichier `apps/web/public/claude-hook.mjs`). **⚠️ Après toute modif du hook ou d'`evaluate.ts`, rebundler :**
  `npx esbuild packages/plugin/claude-hook.mjs --bundle --platform=node --format=esm --outfile=apps/web/public/claude-hook.mjs`
- **Installation client** (générée par `/dashboard/connect`, plateforme « Claude Code ») :
  1. `~/.synopse/claude-token` (le token) + téléchargement du hook dans `~/.synopse/`
  2. `~/.claude/settings.json` → hooks.PreToolUse, matcher `*`, `timeout: 960` (le polling
     d'approbation peut durer 15 min ; un timeout hook trop court = refus fail-safe côté serveur
     mais UX dégradée).
- **Différences vs OpenClaw** : pas de processus permanent → statut/kill switch re-vérifié à chaque
  appel d'outil si le dernier check date de > 25 s (état disque `~/.synopse/claude-hook-state.json`) ;
  pas de hook `llm_output` → pas de remontée d'usage tokens (plafonds F4 partiels).
- **Piège Windows** : jamais de `process.exit()` dans le hook — assert libuv possible pendant la
  fermeture des sockets keep-alive, et un crash sur le chemin « deny » serait un fail-open. On laisse
  la boucle d'événements se vider (handles undici unref → sortie naturelle).
- **Validé E2E** : interception `Bash`/curl vers domaine inconnu → approbation → Telegram →
  « Autoriser » → verdict `approved` → l'action passe (premier test du chemin Autoriser).

## 7. Environnements

- `main` = prod (synopse.eu, Vercel). `build-v1` = branche de travail, preview Vercel.
- Secrets : `.env.local` en local (gitignoré), variables Vercel en déployé. `SUPABASE_SERVICE_ROLE_KEY` et `PAYLOAD_ENCRYPTION_KEY` = serveur uniquement (pas de préfixe NEXT_PUBLIC).
- Supabase : projet région **EU (Francfort)** — argument RGPD, ne pas changer.
- **Build qui échoue avec `EINVAL readlink ...\.next\...`** : OneDrive corrompt les artefacts — `rm -rf apps/web/.next` puis rebuild. Fix durable : exclure le repo de OneDrive ou le déplacer hors du dossier synchronisé.
