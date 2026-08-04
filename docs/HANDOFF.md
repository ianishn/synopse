# HANDOFF — état du projet (nuit du 2026-08-04)

Tout est committé sur `main` (prod) et `build-v1`. Landing + app entièrement en charte DA sombre.

## Construit cette nuit (déployé prod + preview)
1. **Tout l'app migré en thème sombre DA** : dashboard, login, journal, règles, connect, tuto,
   pages légales, billing (Void Slate + Signal Orange + Geist). Blocs code restés sombres.
2. **Interface admin `/admin`** : KPIs (utilisateurs, payants, MRR/ARR estimés, conversion),
   répartition par forfait, courbe d'évolution (SVG, palette validée dataviz), table users + emails.
   Accès réservé via `ADMIN_EMAILS`. Lien "Admin" visible dans le dashboard pour les admins.
3. **Checkout annuel** : bascule mensuel/annuel dans la carte billing + landing. Prix Stripe
   annuels créés (Protégé 90 €, Studio 190 €).

## Tableau de bord « salle de contrôle » (fait, charte exacte)
Refonte complète du dashboard (`/dashboard`) en 8 modules : en-tête d'état, actions en attente
(temps réel Supabase Realtime + décision web symétrique à Telegram), agents + métriques 30 j,
règles actives (toggles + compteurs), dépenses & plafond (graphe par jour + réglage), kill switch
+ bandeau d'alerte permanent, journal, compte & abonnement (récap offres, bascule mensuel/annuel).
Charte V1.0 exacte (5 couleurs + statuts vert/ambre/rouge), grille technique, monospace pour les données.
⚠️ **Appliquer `supabase/migrations/0006_realtime.sql`** pour que le temps réel pousse les nouvelles
approbations sans rechargement (sinon elles apparaissent au chargement de la page, décisions OK).

## ⚠️ À FAIRE pour activer en prod (actions manuelles)
1. **Migration Supabase** : appliquer `supabase/migrations/0005_subscriptions_created_at.sql`
   (SQL Editor). Sans elle, l'admin affiche tout le monde en "Gratuit" et 0 € de revenus.
2. **Vercel → Environment Variables** (Production + Preview) :
   - `ADMIN_EMAILS` = ton email de connexion (ex. `hein.ianis@gmail.com`). Sans lui, `/admin`
     est inaccessible (redirige vers le dashboard) — c'est le comportement sûr par défaut.
   - `STRIPE_PRICE_PROTEGE_ANNUAL`, `STRIPE_PRICE_STUDIO_ANNUAL` (déjà dans `.env.vercel`).
3. Rappels non bloquants : `STRIPE_WEBHOOK_SECRET` (prod), webhook Telegram prod (`docs/BACKEND.md`).

## À revoir demain (points de design connus)
- Statut "Actif" des agents affiché en orange (pas de vert dans la charte) — à valider ou ajuster.
- L'admin n'a pas de tooltips au survol sur la courbe (v1 statique avec labels directs).
- MRR = estimation (prix mensuel × abonnés actifs) ; l'intervalle réel n'est pas stocké.
- Migration DA faite par remappage des tokens : quelques nuances (rouge destructif, ambre) à
  vérifier visuellement page par page.

## Repères
`docs/BACKEND.md` (maintenance) · `docs/VALIDATION-V1.md` (tests) · `DA/` (charte) ·
`apps/web/app/globals.css` (tokens) · ⚠️ OneDrive corrompt `apps/web/.next` (rm -rf avant build).
