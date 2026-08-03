/**
 * Plugin OpenClaw Synopse — V1 (remplace spike-f3, mécanique validée par le spike).
 *
 * Flux : before_tool_call → évaluation LOCALE des règles (config synchronisée) →
 *   block  : refus immédiat + event
 *   confirm: POST approval → poll du verdict → refus par défaut (timeout/erreur)
 *   notify : event, l'action passe
 * Kill switch : statut "frozen" (heartbeat/config) → TOUS les tool calls refusés.
 * Fail-safe : API injoignable → dernière config disque ; approbation impossible → refus.
 *
 * Config requise (env) : SYNOPSE_AGENT_TOKEN ; SYNOPSE_API_URL (défaut https://www.synopse.eu).
 * ⚠️ OpenClaw : relever plugins.entries.synopse.hooks.timeoutMs (≥ 16 min) — validé au spike.
 */
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { evaluateMatcher } from "@synopse/shared";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = (process.env.SYNOPSE_API_URL ?? "https://www.synopse.eu").replace(/\/$/, "");
const TOKEN = process.env.SYNOPSE_AGENT_TOKEN;
const CACHE_DIR = join(homedir(), ".synopse");
const CACHE_FILE = join(CACHE_DIR, "config-cache.json");
const HEARTBEAT_MS = 5 * 60_000;

let config = null; // dernière config compilée (mémoire)
let frozen = false;
let warnedNoToken = false;

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (res.status === 304) return null;
  if (!res.ok) throw new Error(`Synopse API ${res.status}`);
  return res.json();
}

function loadDiskCache() {
  try { return JSON.parse(readFileSync(CACHE_FILE, "utf8")); } catch { return null; }
}

async function syncConfig() {
  try {
    const fresh = await api("/api/agent/config", {
      headers: config?.etag ? { "if-none-match": config.etag } : {},
    });
    if (fresh) {
      config = fresh;
      frozen = fresh.agent_status === "frozen";
      try { mkdirSync(CACHE_DIR, { recursive: true }); writeFileSync(CACHE_FILE, JSON.stringify(fresh)); } catch {}
    }
  } catch {
    // Fail-safe : on garde la config mémoire, sinon la dernière config disque.
    config ??= loadDiskCache();
    if (config) frozen = config.agent_status === "frozen";
  }
}

function postEvent(type, summary_fr) {
  api("/api/agent/events", { method: "POST", body: JSON.stringify({ events: [{ type, summary_fr }] }) }).catch(() => {});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Demande d'approbation + polling. Tout échec/timeout = refus (fail-safe). */
async function requestApproval(rule, toolName, params, reason) {
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
    wait = Math.min(wait * 1.5, 10_000); // backoff progressif 2s → 10s
    try {
      const { status } = await api(`/api/agent/approvals/${created.approval_id}`);
      if (status !== "pending") return status;
    } catch { /* erreur réseau ponctuelle : on continue de poller jusqu'à la deadline */ }
  }
  return "expired";
}

async function heartbeatOnce() {
  try {
    const hb = await api("/api/agent/heartbeat", { method: "POST", body: "{}" });
    frozen = hb.agent_status === "frozen";
    if (hb.config_etag !== config?.etag) await syncConfig();
  } catch { /* offline : on garde l'état courant (frozen reste frozen) */ }
}

function startHeartbeat() {
  heartbeatOnce();
  // unref() : le timer ne doit pas empêcher le process hôte de se terminer.
  setInterval(heartbeatOnce, HEARTBEAT_MS).unref();
}

export default definePluginEntry({
  id: "synopse",
  name: "Synopse",
  description: "Validation des actions sensibles, kill switch, journal — synopse.eu",
  register(api_) {
    if (TOKEN) { syncConfig(); startHeartbeat(); }

    api_.on("before_tool_call", async (event) => {
      if (!TOKEN) {
        if (!warnedNoToken) { console.warn("[synopse] SYNOPSE_AGENT_TOKEN absent — protection inactive"); warnedNoToken = true; }
        return;
      }
      if (frozen) {
        return { block: true, blockReason: "Synopse : agent gelé par son propriétaire (kill switch). Aucune action possible jusqu'au dégel." };
      }
      if (!config) await syncConfig();
      if (!config) return; // jamais synchronisé (première installation hors ligne) : rien à évaluer

      // Première règle qui matche, par sévérité décroissante : block > confirm > notify.
      const order = { block: 0, confirm: 1, notify: 2 };
      const rules = [...config.rules].sort((a, b) => order[a.severity] - order[b.severity]);
      for (const rule of rules) {
        const res = evaluateMatcher(rule.matcher, event.toolName, event.params ?? {});
        if (!res.matched) continue;

        if (rule.severity === "block") {
          postEvent("blocked", `Bloqué — ${rule.label_fr} (outil ${event.toolName}${res.reason_fr ? ", " + res.reason_fr : ""})`);
          return { block: true, blockReason: `Bloqué par Synopse : ${rule.label_fr}. Continue ta tâche sans exécuter cette action.` };
        }
        if (rule.severity === "confirm") {
          const verdict = await requestApproval(rule, event.toolName, event.params ?? {}, res.reason_fr);
          if (verdict === "approved") return; // autorisé une fois → l'outil s'exécute
          return {
            block: true,
            blockReason: verdict === "expired"
              ? "Synopse : demande de validation expirée sans réponse → refus par défaut. Continue sans exécuter cette action."
              : `Refusé par le propriétaire via Synopse : ${rule.label_fr}. Continue ta tâche sans exécuter cette action.`,
          };
        }
        // notify : on journalise et on laisse passer.
        postEvent("info", `Info — ${rule.label_fr} (outil ${event.toolName}${res.reason_fr ? ", " + res.reason_fr : ""})`);
      }
    });
  },
});
