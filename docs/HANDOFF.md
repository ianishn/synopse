# HANDOFF — état du projet (sauvegarde nuit du 2026-08-04)

Snapshot pour reprise. Le repo GitHub (`main` = prod, `build-v1` = travail) contient tout ;
chaque étape ci-dessous est committée au fur et à mesure (rien perdu si l'ordi s'éteint).

## Où on en est
Les 7 étapes de la spec sont faites (voir `docs/VALIDATION-V1.md`). La **charte V1.0** (sombre
Void Slate + Signal Orange + Geist, logo losange) est appliquée à la **landing** (Direction A
démo-first, FR + EN sur `/` et `/en`, image de fond Higgsfield, zéro tiret cadratin, vrai logo).

## Ce que je construis cette nuit (en autonomie, à revoir demain)
1. **Migration de tout l'app en thème sombre DA** : dashboard, login, journal, règles, connect,
   tuto, pages légales, billing. (Ils étaient encore en clair.)
2. **Interface admin** `/admin` (gated par `ADMIN_EMAILS`) : liste users + emails, abonnements,
   revenus (MRR/ARR), nombre d'abonnés par forfait, courbe d'évolution dans le temps.
3. **Checkout annuel** : billing card + route checkout avec intervalle mensuel/annuel (prix Stripe
   annuels déjà créés : Protégé 90 €, Studio 190 €).

## Config à poser dans Vercel (avant que ces features marchent en prod)
- `STRIPE_PRICE_PROTEGE_ANNUAL`, `STRIPE_PRICE_STUDIO_ANNUAL` (déjà dans `.env.vercel`)
- `ADMIN_EMAILS` = ton/tes emails de connexion admin (ex. `hein.ianis@gmail.com`)
- Rappels non bloquants : `STRIPE_WEBHOOK_SECRET` (prod), webhook Telegram prod (voir `docs/BACKEND.md`).

## Repères
- Doc de maintenance : `docs/BACKEND.md` · Design : `DA/` + `apps/web/app/globals.css`
- ⚠️ OneDrive corrompt `apps/web/.next` : `rm -rf` avant build local.
