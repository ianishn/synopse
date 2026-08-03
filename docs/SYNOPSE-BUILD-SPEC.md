# SYNOPSE — Spécification de build complète (V1)
> Fichier de référence pour Claude Code. À placer dans `docs/` du repo avec `synopse-guide-complet.md`.
> Claude Code est le BUILDER : il exécute cette spec, il ne redéfinit ni le produit, ni la stack, ni le pricing. Toute ambiguïté = question au propriétaire, pas de décision unilatérale.

---

## 1. STACK OFFICIELLE (définitive, ne pas en dévier)

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript strict** | Un seul framework pour landing + dashboard + API ; natif Vercel |
| UI | **Tailwind CSS + shadcn/ui** | Vitesse de dev, composants accessibles, cohérence visuelle |
| DB + Auth | **Supabase** (Postgres + RLS + Auth email/Google) | Auth clé en main, RLS = sécurité par défaut, hébergement EU (région Francfort) |
| Hosting | **Vercel** (déjà branché, domaine synopse.eu) | Déjà en place ; preview deployments par branche |
| Jobs planifiés | **Vercel Cron + Postgres** (table de jobs) | Timeouts d'approbation + checks heartbeat sans service externe supplémentaire |
| Notifications | **Bot Telegram (lib grammY)** en V1 ; emails via **Resend** | Telegram = gratuit, boutons inline natifs, zéro validation d'app. WhatsApp Cloud API = V1.5, PAS en V1 |
| Paiement | **Stripe** (subscriptions + Stripe Tax) | Standard, TVA UE gérée par Stripe Tax |
| Analytics produit | **PostHog** (cloud EU) | Funnels de conversion landing→signup→activation, session replays |
| Erreurs | **Sentry** (front + API + plugin) | Un garde-fou qui crashe en silence = produit mort |
| Plugin agent | **Package TypeScript** dans le monorepo, publié npm + format skill/plugin OpenClaw | Open source (repo public séparé à terme), la confiance est le produit |
| Monorepo | **pnpm workspaces** : `apps/web`, `packages/plugin`, `packages/shared` (types + schémas de règles partagés) | Types partagés entre plugin et API = zéro drift de contrat |

Interdits : pas d'autre service tiers sans validation du propriétaire ; pas de localStorage pour l'état critique ; secrets uniquement en `.env` (avec `.env.example` à jour) ; `synopse automatisation avant/` dans `.gitignore`, jamais commité.

---

## 2. ARCHITECTURE & SCHÉMA DB

```
users (Supabase auth) ─┬─ agents (id, user_id, name, pairing_token_hash, framework,
                       │          last_heartbeat_at, status: active|frozen|silent)
                       ├─ rules (id, user_id, agent_id?, template_id?, params_json,
                       │         enabled, severity: block|confirm|notify)
                       ├─ approvals (id, agent_id, rule_id, action_summary,
                       │             payload_encrypted, status: pending|approved|
                       │             denied|expired, expires_at, decided_via)
                       ├─ events (id, agent_id, type, summary_fr, meta_json, created_at)
                       │         → partitionné/purgé à 90 jours
                       ├─ spend (agent_id, day, tokens_in, tokens_out, est_cost_eur)
                       └─ subscriptions (stripe_customer_id, plan, status)
rule_templates (catalogue global : libellé FR, description, matcher_json, profils[])
```

- **RLS sur toutes les tables** : un user ne voit que ses données. Les endpoints plugin s'authentifient par token d'agent (hashé en DB, révocable).
- **Contrat API plugin ↔ backend** (`packages/shared`) : `POST /api/agent/events`, `POST /api/agent/approvals` (réponse : pending + approval_id), `GET /api/agent/approvals/:id` (polling du verdict), `POST /api/agent/heartbeat`, `GET /api/agent/config` (règles compilées, versionnées par etag).
- **Fail-safe** : si l'API est injoignable, le plugin applique la politique locale embarquée dans la dernière config synchronisée — les règles `block` bloquent, les `confirm` refusent par défaut. JAMAIS de "fail-open".

---

## 3. FONCTIONNALITÉS V1 — détail build / pourquoi / résultat attendu

### F1. Onboarding & pairing (le "setup en 3 minutes")
- **Build** : signup Supabase (email ou Google) → écran "Connecte ton agent" affichant UNE commande à coller (`npx synopse connect <token-court>`) → le CLI du package installe le plugin dans l'instance OpenClaw locale/VPS, échange le token, confirme → l'UI passe en "agent connecté" en temps réel (Supabase Realtime).
- **Pourquoi** : le setup est LA promesse concurrentielle (vs TrustedClaw = édition de fichiers). Chaque minute de friction tue la conversion.
- **Résultat attendu** : un utilisateur non-dev passe de signup à "agent protégé" en < 3 min. Critère d'acceptation : test complet chronométré, zéro édition manuelle de fichier.

### F2. Moteur de règles + bibliothèque en français
- **Build** : `rule_templates` = catalogue versionné en DB, seedé depuis un fichier `rules-catalog.ts` (source de vérité dans le repo). Chaque template : libellé FR ("Toujours me demander avant de dépenser de l'argent"), description, `matcher_json` (conditions sur les tool calls : nom d'outil, patterns d'arguments, domaine de destination, montant, plage horaire), sévérité par défaut. L'UI groupe par profils (Perso / Commerçant / Builder) activables en un clic (activer un profil = activer ses règles). Compilation : les règles actives sont compilées en un JSON unique servi au plugin via `/api/agent/config`. Évaluation LOCALE dans le plugin (latence nulle, vie privée).
- **Pourquoi** : les règles pré-pensées sont le fossé produit — le catalogue est un actif de contenu qu'aucun outil dev n'a. L'éval locale évite de faire transiter chaque action par le cloud.
- **Résultat attendu** : 15–20 templates au lancement, 3 profils. Un clic sur "Profil Builder" protège un agent avec 8 règles sans lire une seule doc. Tests unitaires du matcher sur 20 cas (dont les 5 scénarios d'attaque du §6 du guide).

### F3. Interception & inbox de validation (LE cœur — à prototyper en PREMIER)
- **Build** : hook du plugin sur les tool calls OpenClaw (before-execution). Match `block` → refus immédiat renvoyé à l'agent avec message explicite. Match `confirm` → création d'une approval (payload chiffré), notification Telegram avec résumé en français généré par template (PAS par LLM en V1 — déterministe, fiable, gratuit) + boutons inline [Refuser] [Autoriser une fois] [Détail]. Le plugin poll le verdict (backoff progressif) ; timeout 15 min → `expired` = refus. L'inbox web affiche les demandes en attente (Realtime).
- **Pourquoi** : c'est le produit. Le refus-par-défaut au timeout est un choix de sécurité assumé (un agent qui attend > un agent qui exfiltre).
- **Résultat attendu** : le scénario du guide §6 (mail piégé → tentative d'envoi de fichiers → interception → refus depuis Telegram → l'agent continue sans exécuter) passe en démo reproductible, filmable. C'est le critère GO/NO-GO de tout le projet.
- **⚠️ Instruction spéciale** : construire F3 en spike/prototype AVANT tout le reste (avant même le dashboard). Si l'API de hooks d'OpenClaw ne permet pas l'interception before-execution, STOP — documenter précisément ce qui est possible (wrapper d'outils ? proxy MCP ? fork du tool runner ?) et présenter les options au propriétaire. Ne pas improviser une architecture dégradée en silence.

### F4. Plafonds de dépense
- **Build** : le plugin remonte les compteurs de tokens par appel (événements `usage`) ; agrégation quotidienne dans `spend` ; coût estimé via table de prix par modèle (dans `packages/shared`, mise à jour manuelle). Seuils par agent : alerte à 80 % (Telegram), à 100 % la règle système "budget dépassé" passe tous les tool calls payants en `confirm`.
- **Pourquoi** : la facture surprise est la douleur n°2 après la peur de l'incident ; c'est aussi la feature la plus démontrable en vidéo ("mon agent est bridé à 30 €/mois").
- **Résultat attendu** : dérive de coût simulée → alerte reçue < 5 min → blocage effectif au plafond. Estimation de coût à ±15 % près.

### F5. Kill switch
- **Build** : bouton "Tout geler" (dashboard) + commande Telegram `STOP` → flag `frozen` sur l'agent → le plugin (qui vérifie le flag à chaque tool call via config etag + poll heartbeat) refuse TOUS les appels d'outils avec un message clair. Dégel = même chemin. Latence cible < 30 s.
- **Pourquoi** : même jamais utilisé, c'est la feature qui fait signer — l'extincteur dans la cuisine.
- **Résultat attendu** : gel effectif < 30 s après le tap, testé agent en pleine tâche.

### F6. Heartbeat fonctionnel ("ton agent fait-il son travail ?")
- **Build** : ping du plugin toutes les 5 min (`last_heartbeat_at`). Vercel Cron (1 min) détecte : silence > 15 min → alerte "agent injoignable" ; optionnel V1 : tâches attendues déclarées par l'user ("brief quotidien à 7h30") vérifiées par événement correspondant, sinon alerte.
- **Pourquoi** : c'est la partie "Moniteur" absorbée — le natif OpenClaw redémarre le process, personne ne prévient l'humain que le brief n'est pas parti.
- **Résultat attendu** : kill du process agent en test → alerte Telegram < 16 min.

### F7. Journal lisible + rapport hebdomadaire
- **Build** : `events` avec `summary_fr` généré par templates déterministes ("Bloqué — envoi de fichiers vers domaine inconnu"). Vue journal filtrable (bloqué/validé/info). Rapport hebdo : job cron dimanche 18h → agrégats (tâches, coût, validations, blocages, dispo) → message Telegram + email Resend (template React Email).
- **Pourquoi** : le journal rend la protection tangible au quotidien ; le rapport hebdo est le rituel anti-churn — chaque "1 tentative bloquée 🛡️" = un renouvellement.
- **Résultat attendu** : rapport lisible par un non-tech en 20 secondes, envoyé automatiquement, désabonnable.

### F8. Billing
- **Build** : Stripe Checkout + customer portal. Plans : Gratuit (1 agent, 3 règles, kill switch, journal 7 j) / Protégé 9 €/mois (tout) / Studio 19 €/mois (5 agents). Enforcement des limites côté API (pas seulement UI). Webhooks Stripe → `subscriptions`.
- **Pourquoi** : freemium = acquisition ; les limites du gratuit (3 règles) font toucher la valeur sans la donner.
- **Résultat attendu** : upgrade/downgrade/annulation fonctionnels en test mode ; aucun secret Stripe en dur.

### F9. Landing synopse.eu — REBUILD complet orienté conversion
- **Build** (structure imposée, dans l'ordre de scroll) :
  1. **Hero** : "Ton agent IA bosse pour toi. Synopse vérifie qu'il ne fait que ça." + sous-titre (protection en 3 minutes, sans toucher un fichier) + CTA unique "Protéger mon agent — gratuit" + visuel = la maquette d'interception (pas d'illustration abstraite)
  2. **La peur, légitimée** : 3 cartes = 3 incidents types (exfiltration par mail piégé, facture API nocturne, publication non voulue) avec chiffre à l'appui (94 % vulnérables — OWASP #1)
  3. **Démo interactive** : le flux du guide §6 rejoué en composant animé (mail piégé → interception → validation Telegram) — PAS une vidéo, un composant React scrollytelling léger
  4. **Comment ça marche** : 3 étapes (crée ton compte → colle une commande → choisis tes règles en français)
  5. **Preuve sociale** : témoignages beta (placeholder au build, remplis avant lancement public) + badge "plugin open source" + "données en Europe, RGPD"
  6. **Pricing** : 3 plans, "Protégé" mis en avant, FAQ objection-par-objection (Et si Synopse tombe ? → fail-safe. Vous lisez mes données ? → éval locale, 90 j max. Ça marche avec quoi ? → OpenClaw, autres à venir)
  7. **CTA final** + footer (mentions légales, CGV, politique de confidentialité — pages générées, droit FR)
- **Principes de conversion imposés** : UN seul CTA répété, zéro lien sortant dans le flux, français d'abord (toggle EN), < 2 s LCP, PostHog events sur chaque section (scroll depth + clics CTA) pour itérer, méta OG propres pour le partage.
- **Pourquoi** : le trafic viendra de TikTok/X (voir GTM du guide) — une audience chaude sur la peur, froide sur la marque : la page doit transformer l'anxiété en essai gratuit en un scroll.
- **Résultat attendu** : Lighthouse > 90, funnel PostHog en place, page vivante sur une preview URL avant tout merge sur main.

---

## 4. ORDRE DE BUILD IMPOSÉ

```
0. Audit & nettoyage (git, Vercel, .gitignore, branche build-v1, CLAUDE.md)  → validation propriétaire
1. SPIKE F3 : preuve d'interception OpenClaw (prototype jetable)             → validation propriétaire (GO/NO-GO)
2. Monorepo + schéma DB + RLS + auth + packages/shared (types + contrat API)
3. F2 moteur de règles + catalogue → F3 en dur → F1 pairing
4. F5 kill switch → F4 plafonds → F6 heartbeat
5. F7 journal + rapport → F8 billing
6. F9 landing rebuild
7. Tests de bout en bout des 5 scénarios d'attaque + Sentry + polish
```
Chaque étape : commit atomique, résumé (fait / reste / décisions), et STOP aux deux points de validation.

## 5. DÉFINITION DE DONE (V1)
- Les 5 scénarios d'attaque du guide passent en démo reproductible
- Setup complet chronométré < 3 min par un profil non-dev
- Kill switch < 30 s, timeout d'approbation = refus, fail-safe API-down vérifié
- RLS testée (un user ne peut pas lire les données d'un autre), aucun secret en clair
- Landing déployée en preview, funnel analytics actif
- Rien sur main sans accord explicite du propriétaire
