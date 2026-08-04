"use client";
/** Force du mot de passe (21st.dev), rebrandé DA et traduit FR. Statuts rouge/ambre/vert. */
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const CELL = { type: "spring", stiffness: 520, damping: 34, mass: 0.45 } as const;
const CROSSFADE = { type: "spring", stiffness: 260, damping: 34, mass: 0.8 } as const;
const INSTANT = { duration: 0 } as const;

const COMMON = /^(?:password|passw0rd|azerty|qwerty|motdepasse|bonjour|welcome|admin|iloveyou|abc123|111111|123123|123456)/i;
const RUN = /(.)\1{3,}/;
const RUN_UP = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|azer|zert|erty|qwer|asdf)/i;
const SYMBOL = /[!-/:-@[-`{-~]/;

export type PasswordRule = { id: string; label: string; test: (v: string) => boolean };

export const defaultPasswordRules: readonly PasswordRule[] = [
  { id: "length", label: "12 caractères ou plus", test: (v) => v.length >= 12 },
  { id: "case", label: "Majuscules et minuscules", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "digit", label: "Un chiffre", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "Un symbole", test: (v) => SYMBOL.test(v) },
];

const LABELS = ["Vide", "Faible", "Moyen", "Bon", "Solide"] as const;

const TONES = {
  none: { bar: "bg-line", text: "text-muted" },
  danger: { bar: "bg-red-500", text: "text-red-400" },
  caution: { bar: "bg-amber-500", text: "text-amber-400" },
  safe: { bar: "bg-green-500", text: "text-green-400" },
} as const;

function toneFor(score: number, max: number) {
  if (score === 0) return TONES.none;
  const r = score / max;
  if (r <= 0.34) return TONES.danger;
  if (r <= 0.67) return TONES.caution;
  return TONES.safe;
}

export function PasswordStrength({ value, showRules = true, className = "" }:
  { value: string; showRules?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  const rules = defaultPasswordRules;

  const state = useMemo(() => {
    const evaluated = rules.map((r) => ({ ...r, met: r.test(value) }));
    const passed = evaluated.filter((r) => r.met).length;
    const guessable = value.length > 0 && (COMMON.test(value) || RUN.test(value) || RUN_UP.test(value));
    const score = value.length === 0 ? 0 : guessable ? 1 : Math.min(rules.length, Math.max(1, passed));
    const unmet = evaluated.filter((r) => !r.met);
    return {
      score, max: rules.length, label: LABELS[Math.min(score, LABELS.length - 1)], rules: evaluated, guessable,
      announcement: value.length === 0 ? "" :
        `Mot de passe ${LABELS[Math.min(score, LABELS.length - 1)].toLowerCase()}. ${guessable ? "Mot de passe trop courant. " : ""}${unmet.length ? `Il manque : ${unmet.map((r) => r.label.toLowerCase()).join(", ")}.` : "Toutes les conditions sont remplies."}`,
    };
  }, [value, rules]);

  const [settled, setSettled] = useState("");
  useEffect(() => {
    if (!state.announcement) { setSettled(""); return; }
    const id = setTimeout(() => setSettled(state.announcement), 700);
    return () => clearTimeout(id);
  }, [state.announcement]);

  const tone = toneFor(state.score, state.max);

  return (
    <div className={`w-full ${className}`}>
      <div role="meter" aria-label="Force du mot de passe" aria-valuemin={0} aria-valuemax={state.max}
        aria-valuenow={state.score} aria-valuetext={state.label}
        className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${state.max}, minmax(0, 1fr))` }}>
        {Array.from({ length: state.max }, (_, i) => (
          <div key={i} className="relative h-1.5 overflow-hidden rounded-[2px] bg-line/60">
            <motion.span className={`absolute inset-0 origin-left rounded-[2px] transition-colors duration-200 ${tone.bar}`}
              initial={false} animate={{ scaleX: i < state.score ? 1 : 0 }}
              transition={reduced ? INSTANT : { ...CELL, delay: i < state.score ? i * 0.03 : 0 }} />
          </div>
        ))}
      </div>

      <div className="mt-2 flex h-5 items-center justify-between gap-3">
        <span className="inline-grid text-[12.5px] font-medium leading-5">
          {LABELS.map((text, i) => (
            <motion.span key={text} aria-hidden className={`col-start-1 row-start-1 whitespace-nowrap transition-colors duration-200 ${tone.text}`}
              initial={false} animate={{ opacity: i === Math.min(state.score, LABELS.length - 1) ? 1 : 0 }}
              transition={reduced ? INSTANT : CROSSFADE}>{text}</motion.span>
          ))}
        </span>
        <motion.span aria-hidden className="whitespace-nowrap text-[11.5px] leading-5 text-amber-400"
          initial={false} animate={{ opacity: state.guessable ? 1 : 0 }} transition={reduced ? INSTANT : CROSSFADE}>
          Trop courant
        </motion.span>
      </div>

      {showRules && (
        <ul className="mt-3 grid gap-1.5">
          {state.rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2">
              <span className="relative grid size-[14px] shrink-0 place-items-center rounded-[4px] border border-line text-void">
                <motion.span className="absolute inset-0 rounded-[3px] bg-green-500" initial={false}
                  animate={{ opacity: rule.met ? 1 : 0 }} transition={reduced ? INSTANT : CROSSFADE} />
                <motion.svg viewBox="0 0 12 12" fill="none" aria-hidden className="relative size-[9px]" initial={false}
                  animate={{ opacity: rule.met ? 1 : 0, scale: rule.met ? 1 : 0.6 }} transition={reduced ? INSTANT : CELL}>
                  <path d="M2 6.2 4.7 8.9 10 3.3" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </span>
              <span className={`text-[12.5px] leading-5 transition-colors duration-200 ${rule.met ? "text-s300" : "text-muted"}`}>{rule.label}</span>
              <span className="sr-only">{rule.met ? "rempli" : "non rempli"}</span>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="sr-only">{settled}</p>
    </div>
  );
}

export default PasswordStrength;
