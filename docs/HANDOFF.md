# HANDOFF — état du projet (sauvegarde 2026-08-05)

Tout est committé et poussé sur `main` (prod) et `build-v1`. Dernier commit : `01fa2f9`.
Reprise possible depuis n'importe quelle machine avec `git clone` + `.env.local` (voir `.env.vercel`).

## Ce qui existe aujourd'hui

### Produit (spec V1 : 7 étapes bouclées)
F1 pairing · F2 règles+catalogue (16 règles FR, 3 profils) · F3 interception (validé E2E, 5 scénarios
d'attaque, voir `docs/VALIDATION-V1.md`) · F4 plafonds · F5 kill switch · F6 heartbeat · F7 journal +
rapport hebdo · F8 billing Stripe (mensuel + annuel) · F9 landing.
Sécurité durcie (audit dans `docs/BACKEND.md §6quater`) : CSP, webhook Stripe fail-closed, crons Bearer-only.

### Design (charte V1.0 du dossier `DA/`)
Sombre Void Slate `#0F172A` + Signal Orange `#EA580C` + Geist. Logo = PNG fourni (`/synopse-logo.png`).
Composants 21st.dev rebrandés DA dans `apps/web/components/ui/` :
`falling-pattern` (fond animé), `glow-card` (tuiles à blob), `border-beam`, `button-colorful`,
`progress-bar`, `password-strength`, `orbiting-agents` (logos IA réels dans `/public/agents/`),
`app-header` (bandeau logo + nav pastilles + FR/EN), `lang-switch`.
Landing : hero démo-first, pipeline d'attaque animé (`app/landing/pipeline.tsx`), section Installation
en contraste inversé (fond clair), orbites d'agents, pricing GlowCard.

### i18n
Cookie `lang` posé par la landing (`/` = fr, `/en` = en) + bouton FR/EN dans l'app.
Dictionnaire : `lib/lang.ts` (client+serveur), lecture cookie : `lib/lang-server.ts`.
Traduits : landing, login, dashboard, admin.

### Plans (enforcement vérifié E2E)
`lib/plan.ts` (limites) + `lib/enforce-plan.ts` (mise en conformité à la baisse de plan).
Gratuit : 1 agent, 3 règles, journal 7 j, pas de plafonds. Protégé : illimité + plafonds + journal 90 j.
Studio : 5 agents.
**Anti-bypass** : la config servie au plugin est plafonnée par le plan (`lib/compile-config.ts`), et une
baisse de plan désactive les règles en trop + retire les plafonds (branché sur webhook Stripe ET outil admin).

## À FAIRE (actions manuelles, non bloquantes)
1. Migrations Supabase à appliquer si pas déjà fait : `0005_subscriptions_created_at.sql`, `0006_realtime.sql`.
2. Vercel env : `ADMIN_EMAILS`, prix annuels, `STRIPE_WEBHOOK_SECRET` (voir `.env.vercel`).
3. Webhook Telegram prod + pinger cron externe (voir `docs/BACKEND.md §5, §6bis`).

## Prochaines pistes (rien en cours, à ton choix)
- Traduire les pages restantes : compte, connect, tuto, journal, règles, légal.
- Passer les modules restants du dashboard en GlowCard (règles, journal, kill switch, abonnement).
- Sentry (surveillance d'erreurs) : jamais posé.
- Reste des retours design sur la landing (fond, tuiles, pipeline).

## Pièges connus
- ⚠️ **OneDrive corrompt `apps/web/.next`** : si build échoue avec `EINVAL readlink`, faire
  `rm -rf apps/web/.next` (parfois 2 fois) puis rebuild. Idéalement, sortir le repo de OneDrive.
- Serveurs zombies sur le port 3000 : tuer via netstat/taskkill avant `pnpm dev`.
- Les composants client ne doivent PAS importer `lib/lang-server.ts` (next/headers = serveur only).
