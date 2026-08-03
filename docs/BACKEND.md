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

## 5. Jobs planifiés (Vercel Cron — à créer à l'étape F6/F7)

| Job | Fréquence | Action |
|---|---|---|
| expiration approvals | 1 min | `pending` dépassant `expires_at` → `expired` + event |
| check heartbeat | 1 min | `last_heartbeat_at` > 15 min → `status=silent` + alerte Telegram |
| purge events | 1 jour | supprimer `events` > 90 j |
| rapport hebdo | dim. 18h | agrégats → Telegram + Resend |

## 6. Runbook — symptôme → diagnostic

- **Un user ne voit aucune donnée** : vérifier la session (cookies) ; si connecté, suspecter une policy RLS (tester la requête dans SQL Editor avec `set role authenticated; set request.jwt.claims...`).
- **Le plugin reçoit 401** : token révoqué ou hash absent — régénérer le pairing depuis le dashboard.
- **Approvals jamais expirées** : cron Vercel en panne — vérifier l'onglet Cron du projet Vercel + logs.
- **Notifications Telegram muettes** : tester `getMe` avec le token du bot ; vérifier `TELEGRAM_BOT_TOKEN` dans Vercel env. ⚠️ Fins de ligne CRLF dans un `.env` local Windows = token invalide (vécu au spike).
- **Coûts estimés faux** : mettre à jour `packages/shared/src/pricing.ts` (table manuelle).
- **Erreur « service_role » côté navigateur** : fuite grave — `SUPABASE_SERVICE_ROLE_KEY` ne doit exister que dans les routes serveur. Auditer les imports de `createServiceClient`.

## 7. Environnements

- `main` = prod (synopse.eu, Vercel). `build-v1` = branche de travail, preview Vercel.
- Secrets : `.env.local` en local (gitignoré), variables Vercel en déployé. `SUPABASE_SERVICE_ROLE_KEY` et `PAYLOAD_ENCRYPTION_KEY` = serveur uniquement (pas de préfixe NEXT_PUBLIC).
- Supabase : projet région **EU (Francfort)** — argument RGPD, ne pas changer.
