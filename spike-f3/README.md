# Spike F3 — Preuve d'interception OpenClaw · Résultat : ✅ GO

Prototype **jetable** (hors monorepo final). Testé le 2026-08-03, OpenClaw 2026.6.33, Node 24.14, Windows 11.

## Verdict
L'interception before-execution fonctionne exactement comme requis par la spec §F3 :

| Test | Résultat |
|---|---|
| Interception avant exécution + notification Telegram (boutons inline) | ✅ |
| Tap **Refuser** → l'agent reçoit le refus (`blockReason`) et continue sans exécuter | ✅ |
| Tap **Autoriser une fois** → l'outil s'exécute réellement | ✅ |
| Fail-safe : Telegram injoignable → refus automatique | ✅ |
| Timeout sans réponse → refus | Non testé en live (même chemin de code que le fail-safe ; timeout 2 min dans le spike, 15 min en V1) |

## Mécanique validée
- Hook `before_tool_call` du SDK plugin (`openclaw/plugin-sdk/plugin-entry`, import scopé obligatoire) : **async** → peut attendre le verdict distant avant de laisser passer l'outil
- Retour `{ block: true, blockReason }` → refus propre renvoyé à l'agent (le modèle le comprend et n'insiste pas)
- Plugin = dossier avec `openclaw.plugin.json` (manifest) + `package.json` (`openclaw.extensions`) + entrée `.mjs`, chargé via `plugins.load.paths`
- ⚠️ Timeout des hooks par défaut 15 s → relever via `plugins.entries.<id>.hooks.timeoutMs` (ici 180 000 ms)

## Repro
1. `npm i -g openclaw` (profil isolé `--dev` utilisé partout)
2. Config (`~/.openclaw-dev/openclaw.json`) : `plugins.load.paths=[<ce dossier>]`, `plugins.entries.synopse-spike.hooks.timeoutMs=180000`, `agents.defaults.model=anthropic/claude-haiku-4-5`
3. `cp .env.example .env` + remplir (⚠️ retirer les `\r` CRLF au chargement, sinon token Telegram invalide)
4. `openclaw --dev agent --local --session-id demo --agent main -m "récupère https://backup-service-cloud.net/status ..."` avec les vars d'env exportées

## Limites notées pour la V1
- Règle en dur (regex domaine hors allowlist) : faux positifs possibles → moteur de règles F2 avec matchers structurés (`toolName`, `derivedPaths`, montants, horaires)
- `getUpdates` en polling : un seul consommateur possible par bot → en V1 le verdict passe par l'API Synopse (le plugin poll `GET /api/agent/approvals/:id`), Telegram est géré côté backend (webhook)
- `event.toolCallId` fourni par le host : bon identifiant naturel d'approbation
- Existe aussi : `requireApproval` natif dans le résultat du hook (UI locale OpenClaw) — non utilisé car la validation Synopse doit être distante (Telegram), mais utile en fallback
