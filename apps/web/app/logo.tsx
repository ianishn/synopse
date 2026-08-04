/**
 * Logo Synopse (charte V1.0), le vrai mark fourni dans DA/ (barres échancrées + losange orange).
 * Utilisé comme "chip" arrondi (le fond sombre du fichier lit comme une icône d'app).
 */
export function LogoIcon({ className = "", size = 40 }: { className?: string; size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/synopse-mark.png" alt="Synopse" width={size} height={size} className={`rounded-xl ${className}`} />;
}

export function Logo({ className = "", size = 32, showText = true }:
  { className?: string; size?: number; showText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/synopse-mark.png" alt="Synopse" width={size} height={size} className="rounded-lg" />
      {showText && <span className="font-display text-lg font-bold tracking-tight text-off">SYNOPSE</span>}
    </span>
  );
}
