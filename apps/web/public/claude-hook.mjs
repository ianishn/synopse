#!/usr/bin/env node

// packages/shared/dist/evaluate.js
var NO_MATCH = { matched: false };
var FILE_EXT_RE = /\.(ts|js|mjs|cjs|json|md|txt|png|jpe?g|gif|svg|csv|html?|css|pdf|zip|tar|gz|yml|yaml|toml|lock|env|sql|py|sh|ps1)$/i;
function extractDomains(text) {
  const found = text.match(/(?:https?:\/\/|@|\b)([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/gi) ?? [];
  const out = [];
  for (const raw of found) {
    const d = raw.replace(/^https?:\/\/|^@/i, "").toLowerCase();
    if (!FILE_EXT_RE.test(d))
      out.push(d);
  }
  return [...new Set(out)];
}
function extractAmountsEur(text) {
  const out = [];
  const re = /(?:€|eur(?:os?)?\s*[:=]?\s*)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur(?:os?)?\b)/gi;
  let m;
  while (m = re.exec(text))
    out.push(parseFloat((m[1] ?? m[2]).replace(",", ".")));
  return out;
}
function inForbiddenHours([start, end], hour) {
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}
function evaluateMatcher(matcher, toolName, params, now = /* @__PURE__ */ new Date()) {
  const text = JSON.stringify(params ?? {});
  if (matcher.tool_names && !matcher.tool_names.includes(toolName))
    return NO_MATCH;
  if (matcher.exclude_tool_names?.includes(toolName))
    return NO_MATCH;
  if (matcher.params_pattern) {
    if (!new RegExp(matcher.params_pattern, "iu").test(text))
      return NO_MATCH;
  }
  if (matcher.forbidden_hours && !inForbiddenHours(matcher.forbidden_hours, now.getHours())) {
    return NO_MATCH;
  }
  let matched_domain;
  if (matcher.domain_allowlist) {
    const allow = matcher.domain_allowlist.map((d) => d.toLowerCase());
    matched_domain = extractDomains(text).find((d) => !allow.some((a) => d === a || d.endsWith("." + a)));
    if (!matched_domain)
      return NO_MATCH;
  }
  let matched_amount;
  if (matcher.max_amount_eur !== void 0) {
    matched_amount = extractAmountsEur(text).find((a) => a > matcher.max_amount_eur);
    if (matched_amount === void 0)
      return NO_MATCH;
  }
  const reasons = [];
  if (matched_domain)
    reasons.push(`domaine jamais vu : ${matched_domain}`);
  if (matched_amount !== void 0)
    reasons.push(`montant d\xE9tect\xE9 : ${matched_amount} \u20AC`);
  if (matcher.forbidden_hours)
    reasons.push(`plage horaire interdite (${matcher.forbidden_hours[0]}h\u2013${matcher.forbidden_hours[1]}h)`);
  return { matched: true, reason_fr: reasons.join(" ; ") || void 0, matched_domain, matched_amount };
}

// packages/plugin/claude-hook.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var API = (process.env.SYNOPSE_API_URL ?? "https://www.synopse.eu").replace(/\/$/, "");
var CACHE_DIR = join(homedir(), ".synopse");
var CONFIG_CACHE = join(CACHE_DIR, "claude-config-cache.json");
var STATE_FILE = join(CACHE_DIR, "claude-hook-state.json");
function readToken() {
  if (process.env.SYNOPSE_AGENT_TOKEN) return process.env.SYNOPSE_AGENT_TOKEN.trim();
  try {
    return readFileSync(join(CACHE_DIR, "claude-token"), "utf8").trim();
  } catch {
    return null;
  }
}
var TOKEN = readToken();
function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}
function saveJson(path, obj) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(path, JSON.stringify(obj));
  } catch {
  }
}
async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json", ...init.headers ?? {} }
  });
  if (res.status === 304) return null;
  if (!res.ok) throw new Error(`Synopse API ${res.status}`);
  return res.json();
}
function pass() {
}
function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason }
  }));
}
function postEvent(type, summary_fr) {
  return api("/api/agent/events", { method: "POST", body: JSON.stringify({ events: [{ type, summary_fr }] }) }).catch(() => {
  });
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function syncConfig(cached) {
  try {
    const fresh = await api("/api/agent/config", {
      headers: cached?.etag ? { "if-none-match": cached.etag } : {}
    });
    if (fresh) {
      saveJson(CONFIG_CACHE, fresh);
      return fresh;
    }
    return cached;
  } catch {
    return cached;
  }
}
async function requestApproval(config, rule, toolName, params, reason) {
  const summary = `${rule.label_fr} \u2014 outil \xAB ${toolName} \xBB${reason ? ` (${reason})` : ""}`;
  let created;
  try {
    created = await api("/api/agent/approvals", {
      method: "POST",
      body: JSON.stringify({
        rule_id: rule.rule_id,
        action_summary: summary,
        tool_name: toolName,
        payload_json: JSON.stringify(params).slice(0, 8e3)
      })
    });
  } catch {
    return "denied";
  }
  const deadline = Date.now() + (config?.approval_timeout_ms ?? 9e5) + 3e4;
  let wait = 2e3;
  while (Date.now() < deadline) {
    await sleep(wait);
    wait = Math.min(wait * 1.5, 1e4);
    try {
      const { status } = await api(`/api/agent/approvals/${created.approval_id}`);
      if (status !== "pending") return status;
    } catch {
    }
  }
  return "expired";
}
async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
async function main() {
  const raw = await readStdin();
  let event;
  try {
    event = JSON.parse(raw || "{}");
  } catch {
    event = {};
  }
  const toolName = event.tool_name ?? "";
  const params = event.tool_input ?? {};
  if (!TOKEN) {
    console.error("[synopse] SYNOPSE_AGENT_TOKEN absent \u2014 protection inactive");
    return pass();
  }
  const state = loadJson(STATE_FILE) ?? { lastStatusAt: 0, frozen: false };
  let config = loadJson(CONFIG_CACHE);
  if (Date.now() - state.lastStatusAt > 25e3) {
    try {
      const hb = await api("/api/agent/heartbeat", { method: "POST", body: "{}" });
      state.frozen = hb.agent_status === "frozen";
      state.lastStatusAt = Date.now();
      saveJson(STATE_FILE, state);
      if (hb.config_etag !== config?.etag) config = await syncConfig(config);
    } catch {
    }
  }
  if (state.frozen) {
    return deny("Synopse : agent gel\xE9 par son propri\xE9taire (kill switch). Aucune action possible jusqu'au d\xE9gel.");
  }
  config ??= await syncConfig(null);
  if (!config) return pass();
  if (config.agent_status === "frozen") {
    return deny("Synopse : agent gel\xE9 par son propri\xE9taire (kill switch). Aucune action possible jusqu'au d\xE9gel.");
  }
  const order = { block: 0, confirm: 1, notify: 2 };
  const rules = [...config.rules].sort((a, b) => order[a.severity] - order[b.severity]);
  for (const rule of rules) {
    const res = evaluateMatcher(rule.matcher, toolName, params);
    if (!res.matched) continue;
    if (rule.severity === "block") {
      await postEvent("blocked", `Bloqu\xE9 \u2014 ${rule.label_fr} (outil ${toolName}${res.reason_fr ? ", " + res.reason_fr : ""})`);
      return deny(`Bloqu\xE9 par Synopse : ${rule.label_fr}. Continue ta t\xE2che sans ex\xE9cuter cette action.`);
    }
    if (rule.severity === "confirm") {
      const verdict = await requestApproval(config, rule, toolName, params, res.reason_fr);
      if (verdict === "approved") return pass();
      return deny(verdict === "expired" ? "Synopse : demande de validation expir\xE9e sans r\xE9ponse \u2192 refus par d\xE9faut. Continue sans ex\xE9cuter cette action." : `Refus\xE9 par le propri\xE9taire via Synopse : ${rule.label_fr}. Continue ta t\xE2che sans ex\xE9cuter cette action.`);
    }
    await postEvent("info", `Info \u2014 ${rule.label_fr} (outil ${toolName}${res.reason_fr ? ", " + res.reason_fr : ""})`);
  }
  return pass();
}
await main();
