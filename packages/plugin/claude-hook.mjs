#!/usr/bin/env node
/**
 * Hook PreToolUse Claude Code — Synopse (adaptateur du plugin OpenClaw index.mjs).
 *
 * Claude Code lance ce script avant CHAQUE appel d'outil : l'événement arrive en JSON
 * sur stdin ({ tool_name, tool_input }), la décision repart en JSON sur stdout
 * ({ hookSpecificOutput: { permissionDecision: "deny", ... } }). Pas de décision émise
 * = le flux de permission normal de Claude Code s'applique (on ne contourne jamais
 * les garde-fous natifs, même sur "Autoriser une fois").
 *
 * Flux identique au plugin : éval LOCALE des règles (config synchronisée) →
 *   block  : refus immédiat + event
 *   confirm: POST approval → poll du verdict → refus par défaut (timeout/erreur)
 *   notify : event, l'action passe
 * Kill switch : statut "frozen" re-vérifié si le dernier check date de > 25 s.
 * Fail-safe : API injoignable → dernière config disque ; approbation impossible → refus.
 *
 * Différence assumée vs OpenClaw : pas de hook llm_output ici → pas de remontée
 * d'usage tokens (plafonds F4 partiels sur Claude Code, noté dans BACKEND.md).
 *
 * Config requise : SYNOPSE_AGENT_TOKEN (env) ou fichier ~/.synopse/claude-token ;
 * SYNOPSE_API_URL (défaut https://www.synopse.eu).
 * ⚠️ settings Claude Code : hooks.PreToolUse timeout ≥ 960 s (polling d'approbation 15 min).
 */
import { evaluateMatcher } from "@synopse/shared";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = (process.env.SYNOPSE_API_URL ?? "https://www.synopse.eu").replace(/\/$/, "");
const CACHE_DIR = join(homedir(), ".synopse");
const CONFIG_CACHE = join(CACHE_DIR, "claude-config-cache.json");
const STATE_FILE = join(CACHE_DIR, "claude-hook-state.json");

function readToken() {
  if (process.env.SYNOPSE_AGENT_TOKEN) return process.env.SYNOPSE_AGENT_TOKEN.trim();
  try { return readFileSync(join(CACHE_DIR, "claude-token"), "utf8").trim(); } catch { return null; }
}
const TOKEN = readToken();

function loadJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}
function saveJson(path, obj) {
  try { mkdirSync(CACHE_DIR, { recursive: true }); writeFileSync(path, JSON.stringify(obj)); } catch {}
}

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (res.status === 304) return null;
  if (!res.ok) throw new Error(`Synopse API ${res.status}`);
  return res.json();
}

/**
 * Jamais de process.exit() : sur Windows il peut crasher (assert libuv) pendant la
 * fermeture des sockets keep-alive, et un crash sur le chemin "deny" serait un
 * fail-open. On écrit la décision puis on laisse la boucle d'événements se vider
 * (les handles undici sont unref → sortie naturelle immédiate, code 0).
 */
function pass() { /* aucune décision : le flux de permission normal de Claude Code s'applique */ }
function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
  }));
}

function postEvent(type, summary_fr) {
  return api("/api/agent/events", { method: "POST", body: JSON.stringify({ events: [{ type, summary_fr }] }) }).catch(() => {});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function syncConfig(cached) {
  try {
    const fresh = await api("/api/agent/config", {
      headers: cached?.etag ? { "if-none-match": cached.etag } : {},
    });
    if (fresh) { saveJson(CONFIG_CACHE, fresh); return fresh; }
    return cached; // 304 : la config disque est à jour
  } catch {
    return cached; // fail-safe : dernière config disque
  }
}

/** Demande d'approbation + polling. Tout échec/timeout = refus (fail-safe). */
async function requestApproval(config, rule, toolName, params, reason) {
  const summary = `${rule.label_fr} — outil « ${toolName} »${reason ? ` (${reason})` : ""}`;
  let created;
  try {
    created = await api("/api/agent/approvals", {
      method: "POST",
      body: JSON.stringify({
        rule_id: rule.rule_id,
        action_summary: summary,
        tool_name: toolName,
        payload_json: JSON.stringify(params).slice(0, 8000),
      }),
    });
  } catch {
    return "denied"; // API injoignable → refus par défaut
  }
  const deadline = Date.now() + (config?.approval_timeout_ms ?? 900_000) + 30_000;
  let wait = 2_000;
  while (Date.now() < deadline) {
    await sleep(wait);
    wait = Math.min(wait * 1.5, 10_000);
    try {
      const { status } = await api(`/api/agent/approvals/${created.approval_id}`);
      if (status !== "pending") return status;
    } catch { /* erreur réseau ponctuelle : on continue de poller jusqu'à la deadline */ }
  }
  return "expired";
}

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

// ---------------------------------------------------------------------------

async function main() {
  const raw = await readStdin();
  let event;
  try { event = JSON.parse(raw || "{}"); } catch { event = {}; }
  const toolName = event.tool_name ?? "";
  const params = event.tool_input ?? {};

  if (!TOKEN) {
    console.error("[synopse] SYNOPSE_AGENT_TOKEN absent — protection inactive");
    return pass();
  }

  // Kill switch < 30 s : heartbeat si le dernier check réussi date de > 25 s.
  const state = loadJson(STATE_FILE) ?? { lastStatusAt: 0, frozen: false };
  let config = loadJson(CONFIG_CACHE);
  if (Date.now() - state.lastStatusAt > 25_000) {
    try {
      const hb = await api("/api/agent/heartbeat", { method: "POST", body: "{}" });
      state.frozen = hb.agent_status === "frozen";
      state.lastStatusAt = Date.now();
      saveJson(STATE_FILE, state);
      if (hb.config_etag !== config?.etag) config = await syncConfig(config);
    } catch { /* offline : on garde l'état disque (frozen reste frozen) */ }
  }
  if (state.frozen) {
    return deny("Synopse : agent gelé par son propriétaire (kill switch). Aucune action possible jusqu'au dégel.");
  }
  config ??= await syncConfig(null);
  if (!config) return pass(); // jamais synchronisé (première installation hors ligne) : rien à évaluer
  if (config.agent_status === "frozen") {
    return deny("Synopse : agent gelé par son propriétaire (kill switch). Aucune action possible jusqu'au dégel.");
  }

  // Première règle qui matche, par sévérité décroissante : block > confirm > notify.
  const order = { block: 0, confirm: 1, notify: 2 };
  const rules = [...config.rules].sort((a, b) => order[a.severity] - order[b.severity]);
  for (const rule of rules) {
    const res = evaluateMatcher(rule.matcher, toolName, params);
    if (!res.matched) continue;

    if (rule.severity === "block") {
      await postEvent("blocked", `Bloqué — ${rule.label_fr} (outil ${toolName}${res.reason_fr ? ", " + res.reason_fr : ""})`);
      return deny(`Bloqué par Synopse : ${rule.label_fr}. Continue ta tâche sans exécuter cette action.`);
    }
    if (rule.severity === "confirm") {
      const verdict = await requestApproval(config, rule, toolName, params, res.reason_fr);
      if (verdict === "approved") return pass(); // autorisé une fois → flux normal de Claude Code
      return deny(verdict === "expired"
        ? "Synopse : demande de validation expirée sans réponse → refus par défaut. Continue sans exécuter cette action."
        : `Refusé par le propriétaire via Synopse : ${rule.label_fr}. Continue ta tâche sans exécuter cette action.`);
    }
    // notify : on journalise et on laisse passer.
    await postEvent("info", `Info — ${rule.label_fr} (outil ${toolName}${res.reason_fr ? ", " + res.reason_fr : ""})`);
  }
  return pass();
}

await main();
