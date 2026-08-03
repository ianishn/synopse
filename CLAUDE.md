# Synopse — règles projet (BUILDER)

Spec de référence : `docs/SYNOPSE-BUILD-SPEC.md` (stack, DB, F1–F9, ordre de build). Vision : `docs/synopse-guide-complet.md`. Ne jamais redéfinir stack/pricing/périmètre — toute ambiguïté = question au propriétaire.

## Git
- Identité : Ianis Hein / pro.ianis.hein@gmail.com (vérifier avant premier commit)
- `main` = prod (Vercel, synopse.eu). Tout le travail sur `build-v1`, preview Vercel uniquement. Rien sur main sans accord explicite.
- `synopse automatisation avant/` = ancien projet n8n : gitignoré, ne jamais toucher ni commiter.

## Points de STOP (validation propriétaire obligatoire)
1. Après étape 0 (audit)
2. Après spike F3 (preuve d'interception) — GO/NO-GO

## Stack imposée (rappel)
Next.js 15 App Router + TS strict, Tailwind + shadcn/ui, Supabase (EU, RLS partout), Vercel, Vercel Cron, Telegram (grammY), Resend, Stripe, PostHog EU, Sentry. Monorepo pnpm : `apps/web`, `packages/plugin`, `packages/shared`.

## Sécurité
- Fail-safe partout : jamais de fail-open. Timeout d'approbation = refus.
- Secrets uniquement en `.env` (+ `.env.example` à jour). Aucun secret en dur.
