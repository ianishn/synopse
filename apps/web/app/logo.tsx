/**
 * Logo Synopse (charte V1.0) : deux barres arrondies off-white + losange Signal Orange
 * au centre (le « point synaptique » où le flux est intercepté).
 */
export function LogoIcon({ className = "", pulse = false }: { className?: string; pulse?: boolean }) {
  return (
    <svg viewBox="0 0 48 56" className={className} fill="none" aria-hidden>
      <rect x="7" y="4" width="12" height="48" rx="6" fill="var(--off)" />
      <rect x="29" y="4" width="12" height="48" rx="6" fill="var(--off)" />
      {/* halo sombre qui creuse l'encoche autour du losange */}
      <rect x="15.5" y="19.5" width="17" height="17" rx="2" transform="rotate(45 24 28)" fill="var(--void)" />
      <rect
        x="18" y="22" width="12" height="12" rx="1.5"
        transform="rotate(45 24 28)"
        fill="var(--orange)"
        className={pulse ? "diamond-pulse" : ""}
        style={{ transformOrigin: "24px 28px" }}
      />
    </svg>
  );
}

/** Logo complet avec le wordmark SYNOPSE. */
export function Logo({ className = "", iconClass = "h-7", pulse = false }:
  { className?: string; iconClass?: string; pulse?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoIcon className={iconClass} pulse={pulse} />
      <span className="font-display text-lg font-bold tracking-tight text-off">SYNOPSE</span>
    </span>
  );
}
