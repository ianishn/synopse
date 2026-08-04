"use client";
/**
 * Pipeline d'agent en direct (inspiré 21st.dev "ai agent pipeline", rebrandé DA).
 * Montre le pain point : un mail piégé traverse la chaîne et déclenche 3 actions dangereuses.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Lang } from "./copy";

const LOG: Record<Lang, string[]> = {
  fr: [
    'Reçu : "Facture en pièce jointe, merci de traiter…"',
    "Lecture du mail → 1 240 tokens → contexte injecté",
    "⚠ Instruction cachée détectée dans le corps du message",
    "L'agent obéit : 3 appels d'outils préparés",
    "Outil : send_files → 47 fichiers de ~/clients",
    "Outil : purchase → 49,99 € sur la carte enregistrée",
    "Outil : publish → brouillon envoyé sur tes réseaux",
    "Sans filet : 3 actions parties en 340 ms.",
    "Aucune alerte. Tu le découvriras demain matin.",
  ],
  en: [
    'Received: "Invoice attached, please process…"',
    "Reading email → 1,240 tokens → context injected",
    "⚠ Hidden instruction detected in the message body",
    "The agent complies: 3 tool calls prepared",
    "Tool: send_files → 47 files from ~/clients",
    "Tool: purchase → 49.99 € on the saved card",
    "Tool: publish → draft posted to your socials",
    "With no safety net: 3 actions fired in 340 ms.",
    "No alert. You will find out tomorrow morning.",
  ],
};

const T: Record<Lang, Record<string, string>> = {
  fr: { live: "PIPELINE AGENT · EN DIRECT", meta: "1 agent · 0 garde-fou", trigger: "DÉCLENCHEUR", triggerName: "Mail entrant",
    ctx: "CONTEXTE", ctxName: "Lecture + mémoire", agent: "AGENT", agentName: "Exécution",
    o1: "Envoi de fichiers", o2: "Paiement 49,99 €", o3: "Publication", actions: "ACTIONS PARTIES", spent: "DÉPENSÉ", files: "FICHIERS SORTIS", stack: "SANS SYNOPSE" },
  en: { live: "AGENT PIPELINE · LIVE", meta: "1 agent · 0 guardrails", trigger: "TRIGGER", triggerName: "Incoming email",
    ctx: "CONTEXT", ctxName: "Read + memory", agent: "AGENT", agentName: "Executing",
    o1: "File exfiltration", o2: "Payment 49.99 €", o3: "Public post", actions: "ACTIONS FIRED", spent: "SPENT", files: "FILES LEAKED", stack: "WITHOUT SYNOPSE" },
};

const ORANGE = "#ea580c";
const RED = "#ef4444";

function Dot({ path, dur, delay, r, o }: { path: string; dur: number; delay: number; r: number; o: number }) {
  return (
    <circle r={r} fill={ORANGE} opacity={o}>
      <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} path={path} />
    </circle>
  );
}

export function AgentPipeline({ lang }: { lang: Lang }) {
  const t = T[lang];
  const log = LOG[lang];
  const [i, setI] = useState(0);
  const [actions, setActions] = useState(0);

  useEffect(() => {
    const a = setInterval(() => setI((p) => (p + 1) % log.length), 2600);
    const b = setInterval(() => setActions((p) => p + 3), 7800);
    return () => { clearInterval(a); clearInterval(b); };
  }, [log.length]);

  const p1 = "M116,88 L158,88";
  const p2 = "M268,88 L306,88";
  const p3 = "M411,88 C425,88 435,50 448,50";
  const p4 = "M411,88 L448,88";
  const p5 = "M411,88 C425,88 435,126 448,126";

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-line bg-void/85 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2">
          <motion.span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          <span className="font-mono text-[10px] tracking-[0.12em] text-muted">{t.live}</span>
        </span>
        <span className="font-mono text-[10px] text-red-400">{t.meta}</span>
      </div>

      <svg viewBox="0 0 580 172" className="block w-full">
        <defs>
          <marker id="syn-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M2 1.5L7.5 5L2 8.5" fill="none" stroke="rgba(234,88,12,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {[p1, p2].map((d) => <path key={d} d={d} fill="none" stroke="rgba(234,88,12,0.25)" strokeWidth="1.5" strokeDasharray="3 5" markerEnd="url(#syn-arrow)" />)}
        {[p3, p4, p5].map((d) => <path key={d} d={d} fill="none" stroke="rgba(239,68,68,0.28)" strokeWidth="1.5" strokeDasharray="3 5" />)}

        <Dot path={p1} dur={1.05} delay={0} r={2.5} o={1} /><Dot path={p1} dur={1.05} delay={0.4} r={1.6} o={0.6} />
        <Dot path={p2} dur={0.9} delay={0.15} r={2.5} o={1} /><Dot path={p2} dur={0.9} delay={0.6} r={1.6} o={0.6} />
        <Dot path={p3} dur={1.3} delay={0.1} r={2.2} o={0.9} />
        <Dot path={p4} dur={1.15} delay={0.3} r={2.2} o={0.9} />
        <Dot path={p5} dur={1.4} delay={0.45} r={2.2} o={0.9} />

        {/* Déclencheur */}
        <rect x="16" y="66" width="100" height="44" rx="8" fill="#0b1120" stroke="rgba(51,65,85,0.9)" strokeWidth="1" />
        <text x="66" y="83" textAnchor="middle" fontSize="9" fill="#64748b" letterSpacing=".08em">{t.trigger}</text>
        <text x="66" y="100" textAnchor="middle" fontSize="12" fill="#f8fafc">{t.triggerName}</text>
        <text x="66" y="122" textAnchor="middle" fontSize="8.5" fill="#475569" fontFamily="monospace">invoice-helper.biz</text>

        {/* Contexte */}
        <rect x="158" y="66" width="110" height="44" rx="8" fill="#0b1120" stroke="rgba(51,65,85,0.9)" strokeWidth="1" />
        <text x="213" y="83" textAnchor="middle" fontSize="9" fill="#64748b" letterSpacing=".08em">{t.ctx}</text>
        <text x="213" y="100" textAnchor="middle" fontSize="12" fill="#f8fafc">{t.ctxName}</text>
        <text x="213" y="122" textAnchor="middle" fontSize="8.5" fill="#475569" fontFamily="monospace">+ instruction cachée</text>

        {/* Agent */}
        <rect x="306" y="53" width="105" height="70" rx="10" fill="#1a0f0a" stroke={ORANGE} strokeWidth="1" />
        <text x="358" y="78" textAnchor="middle" fontSize="9" fill="rgba(249,115,22,0.8)" letterSpacing=".08em">{t.agent}</text>
        <text x="358" y="97" textAnchor="middle" fontSize="13" fill="#fff" fontWeight="500">{t.agentName}</text>
        {[346, 358, 370].map((cx, k) => (
          <motion.circle key={cx} cx={cx} cy={113} r={2.8} fill={ORANGE}
            animate={{ opacity: [0.15, 1, 0.15] }} transition={{ duration: 1.2, delay: k * 0.4, repeat: Infinity, ease: "easeInOut" }} />
        ))}
        <text x="358" y="139" textAnchor="middle" fontSize="8.5" fill="rgba(234,88,12,0.55)" fontFamily="monospace">tool_calls: 3</text>

        {/* Sorties dangereuses */}
        {[[35, t.o1], [73, t.o2], [111, t.o3]].map(([y, label], k) => (
          <g key={label as string}>
            <rect x="448" y={y as number} width="116" height="30" rx="7" fill="#0b1120" stroke="rgba(239,68,68,0.35)" strokeWidth="1" />
            <text x="490" y={(y as number) + 19} textAnchor="middle" fontSize="10.5" fill="#cbd5e1">{label as string}</text>
            <motion.circle cx={550} cy={(y as number) + 8} r={3} fill={RED}
              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.9, delay: k * 0.35, repeat: Infinity, ease: "easeInOut" }} />
          </g>
        ))}
      </svg>

      {/* Journal défilant */}
      <div className="h-[52px] border-t border-line px-4 py-2">
        <div className="flex h-full items-start gap-2">
          <span className="shrink-0 font-mono text-[13px] leading-[1.5] text-orange">›</span>
          <div className="relative h-full flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className={`absolute inset-0 font-mono text-[11px] leading-[1.55] ${log[i].startsWith("⚠") ? "text-red-300" : "text-s400"}`}>
                {log[i]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Compteurs */}
      <div className="flex flex-wrap items-center gap-6 border-t border-line px-4 py-3">
        {[[t.actions, actions.toString()], [t.spent, "49,99 €"], [t.files, "47"]].map(([k, v]) => (
          <div key={k}>
            <div className="mb-0.5 font-mono text-[9px] tracking-[0.1em] text-muted">{k}</div>
            <div className="font-mono text-[15px] tabular-nums text-off">{v}</div>
          </div>
        ))}
        <div className="ml-auto text-right">
          <div className="mb-0.5 font-mono text-[9px] tracking-[0.1em] text-muted">{t.stack}</div>
          <div className="font-mono text-[10px] text-red-400">{lang === "fr" ? "aucun contrôle" : "no control"}</div>
        </div>
      </div>
    </div>
  );
}
