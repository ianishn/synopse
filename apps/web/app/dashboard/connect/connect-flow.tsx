"use client";
/**
 * Flux de connexion : génère le token (POST /api/pairing), affiche les étapes copiables,
 * relie Telegram, et détecte en direct quand l'agent envoie son premier heartbeat.
 */
import { useEffect, useRef, useState } from "react";

type Pairing = { agent_id: string; name: string; token: string; telegram_link_url: string; telegram_link_code: string };

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ink-400">{label}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-xs font-medium text-mint-500 hover:text-mint-400">
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <code className="block overflow-x-auto rounded-lg bg-void-2 border border-line p-3 font-mono text-xs text-orange">{value}</code>
    </div>
  );
}

const PLATFORMS = [
  { key: "openclaw", label: "OpenClaw", icon: "/agents/openclaw.png" },
  { key: "claude", label: "Claude Code", icon: "/agents/claude.png" },
] as const;

export function ConnectFlow() {
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [platform, setPlatform] = useState<"openclaw" | "claude">("openclaw");
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  function pickPlatform(p: "openclaw" | "claude") {
    setPlatform(p);
    // Le badge de plateforme du dashboard reflète le choix fait ici.
    if (pairing) {
      fetch(`/api/agents/${pairing.agent_id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ framework: p }),
      }).catch(() => {});
    }
  }

  async function generate() {
    setBusy(true); setError(null);
    const res = await fetch("/api/pairing", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setPairing(data);
    else setError(data.error ?? "Erreur");
  }

  // Une fois le token généré, on guette l'arrivée du premier heartbeat de CE nouvel agent.
  useEffect(() => {
    if (!pairing || connected) return;
    poll.current = setInterval(async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) return;
      const { agents } = await res.json();
      const me = agents.find((a: { id: string }) => a.id === pairing.agent_id);
      if (me?.last_heartbeat_at) { setConnected(true); if (poll.current) clearInterval(poll.current); }
    }, 4000);
    return () => { if (poll.current) clearInterval(poll.current); };
  }, [pairing, connected]);

  if (!pairing) {
    return (
      <div className="rounded-2xl border border-ink-100 bg-paper p-8 text-center">
        <p className="text-ink-500">Génère un token unique pour relier ton agent à Synopse.</p>
        <button disabled={busy} onClick={generate}
          className="mt-5 rounded-full bg-orange px-6 py-3 font-semibold text-white transition hover:bg-orange-bright disabled:opacity-50">
          {busy ? "…" : "Générer mon token de connexion"}
        </button>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  const configBlock = `SYNOPSE_AGENT_TOKEN=${pairing.token}`;
  const openclawBlock = `openclaw config set plugins.load.paths '["<dossier-du-plugin-synopse>"]' --strict-json
openclaw config set plugins.entries.synopse.hooks.timeoutMs 600000 --strict-json`;
  const claudeInstallBlock = `mkdir -p ~/.synopse
curl -fsSL https://www.synopse.eu/claude-hook.mjs -o ~/.synopse/claude-hook.mjs
printf '%s' "${pairing.token}" > ~/.synopse/claude-token`;
  const claudeSettingsBlock = `{
  "hooks": {
    "PreToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node \\"$HOME/.synopse/claude-hook.mjs\\"", "timeout": 960 }] }
    ]
  }
}`;

  return (
    <div className="space-y-5">
      {/* Statut de connexion en direct */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 ${connected ? "border-mint-300 bg-mint-50" : "border-ink-100 bg-paper"}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-mint-500" : "bg-ink-300 pulse-ring"}`} />
        <span className="text-sm font-medium">
          {connected ? `« ${pairing.name} » est connecté et protégé !` : "En attente de ton agent…"}
        </span>
        {connected && <a href="/dashboard" className="ml-auto text-sm font-medium text-mint-500 hover:text-mint-400">Aller au tableau de bord →</a>}
      </div>

      {/* Choix de la plateforme */}
      <div className="rounded-2xl border border-ink-100 bg-paper p-5">
        <p className="font-medium">Ton agent tourne sur…</p>
        <div className="mt-3 flex gap-2">
          {PLATFORMS.map((p) => (
            <button key={p.key} type="button" onClick={() => pickPlatform(p.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${platform === p.key ? "border-orange bg-[var(--orange-soft)] text-orange" : "border-ink-200 text-ink-500 hover:border-ink-400"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.icon} alt={p.label} width={16} height={16} className="h-4 w-4 object-contain" />{p.label}
            </button>
          ))}
        </div>
      </div>

      {platform === "openclaw" ? (
        <>
          {/* Étape 1 — OpenClaw */}
          <div className="rounded-2xl border border-ink-100 bg-paper p-5">
            <p className="flex items-center gap-2 font-medium"><Step n={1} /> Ajoute ton token à ton agent</p>
            <p className="mb-3 mt-1 text-sm text-ink-500">Colle cette variable d&apos;environnement là où tourne ton agent (affichée une seule fois).</p>
            <CopyBlock label="Variable d'environnement" value={configBlock} />
          </div>

          {/* Étape 2 — OpenClaw */}
          <div className="rounded-2xl border border-ink-100 bg-paper p-5">
            <p className="flex items-center gap-2 font-medium"><Step n={2} /> Active le plugin dans OpenClaw</p>
            <p className="mb-3 mt-1 text-sm text-ink-500">Deux commandes à lancer une seule fois sur ta machine OpenClaw.</p>
            <CopyBlock label="Configuration OpenClaw" value={openclawBlock} />
          </div>
        </>
      ) : (
        <>
          {/* Étape 1 — Claude Code */}
          <div className="rounded-2xl border border-ink-100 bg-paper p-5">
            <p className="flex items-center gap-2 font-medium"><Step n={1} /> Installe le garde Synopse</p>
            <p className="mb-3 mt-1 text-sm text-ink-500">Trois commandes dans un terminal (Git Bash sous Windows). Ton token est déjà dedans — affiché une seule fois.</p>
            <CopyBlock label="Installation (terminal)" value={claudeInstallBlock} />
          </div>

          {/* Étape 2 — Claude Code */}
          <div className="rounded-2xl border border-ink-100 bg-paper p-5">
            <p className="flex items-center gap-2 font-medium"><Step n={2} /> Branche le hook dans Claude Code</p>
            <p className="mb-3 mt-1 text-sm text-ink-500">Fusionne ce bloc dans ton fichier <code className="text-orange">~/.claude/settings.json</code>, puis redémarre Claude Code.</p>
            <CopyBlock label="settings.json" value={claudeSettingsBlock} />
            <p className="mt-3 text-xs text-ink-400">Windows hors Git Bash : remplace &quot;$HOME&quot; par le chemin complet, ex. C:\Users\toi\.synopse\claude-hook.mjs</p>
          </div>
        </>
      )}

      {/* Étape 3 */}
      <div className="rounded-2xl border border-ink-100 bg-paper p-5">
        <p className="flex items-center gap-2 font-medium"><Step n={3} /> Relie Telegram pour les validations</p>
        <p className="mb-3 mt-1 text-sm text-ink-500">Reçois les demandes de validation et pilote le kill switch depuis ton téléphone.</p>
        <a href={pairing.telegram_link_url} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mint-400">
          Relier mon Telegram <span aria-hidden>→</span>
        </a>
        <p className="mt-3 text-sm text-ink-400">
          Le bouton ne fait rien (bot déjà démarré) ? Envoie simplement ce code au bot :
        </p>
        <CopyBlock label="Code de liaison" value={pairing.telegram_link_code} />
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-100 font-mono text-xs font-medium text-ink-900">{n}</span>;
}
