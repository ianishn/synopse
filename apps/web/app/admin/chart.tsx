/**
 * Courbe d'évolution (SVG, sans dépendance) : cumul utilisateurs (bleu) + payants (orange)
 * dans le temps. Palette validée dataviz (CVD-safe sur fond sombre). Une seule échelle Y.
 */
type Point = { t: number; users: number; paid: number };

const BLUE = "#3b82f6";
const ORANGE = "#ea580c";

export function EvolutionChart({ data }: { data: Point[] }) {
  const W = 760, H = 280, padL = 40, padR = 90, padT = 30, padB = 30;
  if (data.length === 0) {
    return <p className="rounded-2xl border border-ink-100 bg-paper p-8 text-center text-sm text-ink-400">Pas encore de données à tracer.</p>;
  }
  // Un seul point : on duplique pour tracer un segment plat lisible.
  const pts = data.length === 1 ? [data[0], { ...data[0], t: data[0].t + 86400000 }] : data;

  const tMin = pts[0].t, tMax = pts[pts.length - 1].t;
  const yMaxRaw = Math.max(1, ...pts.map((p) => p.users));
  const yMax = niceCeil(yMaxRaw);
  const x = (t: number) => padL + ((t - tMin) / (tMax - tMin || 1)) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / yMax) * (H - padT - padB);
  const line = (key: "users" | "paid") => pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * yMax));
  const last = pts[pts.length - 1];
  const fmt = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

  return (
    <div className="rounded-2xl border border-ink-100 bg-paper p-5">
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: BLUE }} />Utilisateurs</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ORANGE }} />Abonnés payants</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Évolution des utilisateurs et abonnés payants dans le temps">
        {/* grille Y */}
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth="1" opacity="0.5" />
            <text x={padL - 8} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">{v}</text>
          </g>
        ))}
        {/* axe X : première et dernière date */}
        <text x={padL} y={H - 10} fontSize="10" fill="var(--muted)">{fmt(tMin)}</text>
        <text x={W - padR} y={H - 10} textAnchor="end" fontSize="10" fill="var(--muted)">{fmt(tMax)}</text>
        {/* séries */}
        <path d={line("users")} fill="none" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={line("paid")} fill="none" stroke={ORANGE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* labels directs en bout de ligne */}
        <circle cx={x(last.t)} cy={y(last.users)} r="3.5" fill={BLUE} />
        <text x={x(last.t) + 8} y={y(last.users) + 3} fontSize="11" fill="var(--off)">{last.users} utilisateurs</text>
        <circle cx={x(last.t)} cy={y(last.paid)} r="3.5" fill={ORANGE} />
        <text x={x(last.t) + 8} y={y(last.paid) + 3} fontSize="11" fill="var(--off)">{last.paid} payants</text>
      </svg>
    </div>
  );
}

function niceCeil(n: number): number {
  if (n <= 5) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / mag) * mag;
}
