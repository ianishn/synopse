/**
 * Tests du matcher — `pnpm --filter @synopse/shared test` (node:test natif, zéro dépendance).
 * Couvre les 5 scénarios d'attaque du guide §6 + cas limites.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateMatcher, extractAmountsEur, extractDomains } from "./evaluate.ts";
import { RULES_CATALOG } from "./catalog.ts";

const m = (id: string) => RULES_CATALOG.find((t) => t.id === id)!.matcher_json;
const DAY = new Date("2026-08-03T14:00:00"); // 14h locale
const NIGHT = new Date("2026-08-03T02:30:00"); // 2h30 locale

// ---- Scénario d'attaque 1 : exfiltration vers domaine inconnu (guide §6) ----
test("exfiltration : envoi fichiers vers domaine inconnu → match", () => {
  const r = evaluateMatcher(m("no-unknown-domain"), "send_files", { dest: "https://backup-service-cloud.net/up" }, DAY);
  assert.equal(r.matched, true);
  assert.equal(r.matched_domain, "backup-service-cloud.net");
});
test("domaine dans l'allowlist → pas de match", () => {
  const r = evaluateMatcher({ domain_allowlist: ["synopse.eu"] }, "web_fetch", { url: "https://www.synopse.eu/x" }, DAY);
  assert.equal(r.matched, false);
});
test("sous-domaine de l'allowlist accepté", () => {
  const r = evaluateMatcher({ domain_allowlist: ["anthropic.com"] }, "web_fetch", { url: "https://api.anthropic.com" }, DAY);
  assert.equal(r.matched, false);
});
test("écriture LOCALE contenant un domaine → pas d'alerte (faux positif du test réel)", () => {
  // Régression : en test de production, l'agent se faisait bloquer en écrivant un
  // simple brouillon contenant une adresse e-mail. Écrire en local n'exfiltre rien.
  const r = evaluateMatcher(m("no-unknown-domain"), "write", { path: "reponse.md", content: "contact : yann@entreprise.fr" }, DAY);
  assert.equal(r.matched, false);
});

test("envoi RÉSEAU vers ce même domaine → toujours intercepté", () => {
  const r = evaluateMatcher(m("no-unknown-domain"), "web_fetch", { url: "https://entreprise.fr/upload" }, DAY);
  assert.equal(r.matched, true);
});

test("nom de fichier avec extension ≠ domaine (faux positif évité)", () => {
  const r = evaluateMatcher(m("no-unknown-domain"), "write_file", { path: "rapport.final.pdf" }, DAY);
  assert.equal(r.matched, false);
});

// ---- Scénario 2 : dépense non voulue ----
test("achat 300 € avec cap 50 € → match", () => {
  const r = evaluateMatcher(m("spending-cap-50"), "browser_click", { action: "payer 300,00 €" }, DAY);
  assert.equal(r.matched, true);
  assert.equal(r.matched_amount, 300);
});
test("achat 20 € avec cap 50 € → passe", () => {
  assert.equal(evaluateMatcher(m("spending-cap-50"), "browser_click", { action: "payer 20 €" }, DAY).matched, false);
});
test("confirm-spending (seuil 0) : tout montant détecté → match", () => {
  assert.equal(evaluateMatcher(m("confirm-spending"), "exec", { cmd: "stripe charge 9.99 EUR" }, DAY).matched, true);
});
test("pas de montant dans les params → pas de match", () => {
  assert.equal(evaluateMatcher(m("confirm-spending"), "exec", { cmd: "ls -la" }, DAY).matched, false);
});

// ---- Scénario 3 : publication nocturne (l'histoire de Maxime) ----
test("tweet à 2h30 → match", () => {
  assert.equal(evaluateMatcher(m("no-night-posting"), "twitter_post", { text: "post this tweet" }, NIGHT).matched, true);
});
test("même tweet à 14h → passe", () => {
  assert.equal(evaluateMatcher(m("no-night-posting"), "twitter_post", { text: "post this tweet" }, DAY).matched, false);
});
test("fenêtre horaire passant minuit : 23h30 → match", () => {
  assert.equal(evaluateMatcher(m("no-night-posting"), "x_post", { text: "publish now" }, new Date("2026-08-03T23:30:00")).matched, true);
});

// ---- Scénario 4 : suppression destructrice ----
test("rm -rf → match (block)", () => {
  assert.equal(evaluateMatcher(m("no-destructive-delete"), "exec", { command: "rm -rf /home/user" }, DAY).matched, true);
});
test("Remove-Item -Recurse (Windows) → match", () => {
  assert.equal(evaluateMatcher(m("no-destructive-delete"), "exec", { command: "Remove-Item C:\\data -Recurse -Force" }, DAY).matched, true);
});
test("rm simple d'un fichier → passe", () => {
  assert.equal(evaluateMatcher(m("no-destructive-delete"), "exec", { command: "rm notes.txt" }, DAY).matched, false);
});

// ---- Scénario 5 : fuite de secrets ----
test("clé API dans les params → match (block)", () => {
  assert.equal(evaluateMatcher(m("no-credentials-in-output"), "send_email", { body: "voici la clé sk-ant-api03-abcdef0123456789" }, DAY).matched, true);
});
test("lecture de .env → match (notify)", () => {
  assert.equal(evaluateMatcher(m("confirm-env-access"), "read_file", { path: "apps/web/.env" }, DAY).matched, true);
});

// ---- Mécanique générale ----
test("tool_names restreint : autre outil → pas de match", () => {
  assert.equal(evaluateMatcher({ tool_names: ["exec"], params_pattern: "." }, "web_fetch", { url: "x" }, DAY).matched, false);
});
test("tool_names restreint : bon outil → match", () => {
  assert.equal(evaluateMatcher({ tool_names: ["exec"] }, "exec", {}, DAY).matched, true);
});
test("force push → match ; push normal → passe", () => {
  assert.equal(evaluateMatcher(m("no-force-push"), "exec", { command: "git push --force origin main" }, DAY).matched, true);
  assert.equal(evaluateMatcher(m("no-force-push"), "exec", { command: "git push origin main" }, DAY).matched, false);
});
test("install global → match", () => {
  assert.equal(evaluateMatcher(m("confirm-system-install"), "exec", { command: "npm install -g backdoor-pkg" }, DAY).matched, true);
});
test("extracteurs : montants FR et EN", () => {
  assert.deepEqual(extractAmountsEur("total 12,50 € puis EUR 300"), [12.5, 300]);
});
test("extracteurs : domaines dédupliqués", () => {
  assert.deepEqual(extractDomains("https://a.io et encore a.io"), ["a.io"]);
});
test("catalogue : ids uniques et sévérités valides", () => {
  const ids = RULES_CATALOG.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of RULES_CATALOG) assert.ok(["block", "confirm", "notify"].includes(t.default_severity), t.id);
});
