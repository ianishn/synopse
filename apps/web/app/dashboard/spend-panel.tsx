/** Module 5 — Dépenses API & plafond : consommation du mois, graphique par jour, plafond, par agent. */
import { CapEditor } from "./cap-editor";

type Daily = { day: string; eur: number };
type PerAgent = { name: string; eur: number };

export function SpendPanel({ daily, monthTotal, monthlyCap, dailyCap, perAgent }:
  { daily: Daily[]; monthTotal: number; monthlyCap: number | null; dailyCap: number | null; perAgent: PerAgent[] }) {
  const pct = monthlyCap ? Math.min(100, Math.round((monthTotal / monthlyCap) * 100)) : null;
  const alert80 = pct !== null && pct >= 80;

  // Graphique barres par jour (30 derniers jours).
  const W = 640, H = 120, pad = 8;
  const max = Math.max(0.01, ...daily.map((d) => d.eur));
  const bw = daily.length ? (W - pad * 2) / daily.length : 0;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Dépenses API &amp; plafond</h2>
      <div className="rounded-xl border border-line bg-void p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-3xl tabular-nums text-off">{monthTotal.toFixed(2)} €</p>
            <p className="text-xs text-muted">consommé ce mois{monthlyCap ? ` sur ${monthlyCap} €` : ""}</p>
          </div>
          {pct !== null && (
            <div className={`rounded-full px-3 py-1 text-xs font-medium ${alert80 ? "bg-red-500/15 text-red-300" : "bg-[var(--orange-soft)] text-orange"}`}>
              {pct} % du plafond{alert80 ? " · alerte" : ""}
            </div>
          )}
        </div>

        {monthlyCap && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line/40">
            <div className={`h-full rounded-full ${alert80 ? "bg-red-500" : "bg-orange"}`} style={{ width: `${pct}%` }} />
          </div>
        )}

        {/* Graphique par JOUR (voir la dérive de la nuit) */}
        <div className="mt-5">
          <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted">Par jour · 30 derniers jours</p>
          {daily.some((d) => d.eur > 0) ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Dépenses quotidiennes des 30 derniers jours">
              {daily.map((d, i) => {
                const h = (d.eur / max) * (H - 20);
                const over = dailyCap != null && d.eur >= dailyCap;
                return <rect key={d.day} x={pad + i * bw + 1} y={H - h - 4} width={Math.max(1, bw - 2)} height={h}
                  rx="1" fill={over ? "#ef4444" : "var(--orange)"} opacity={over ? 1 : 0.85}>
                  <title>{new Date(d.day).toLocaleDateString("fr-FR")} : {d.eur.toFixed(2)} €</title>
                </rect>;
              })}
            </svg>
          ) : <p className="py-6 text-center text-sm text-muted">Aucune dépense enregistrée pour l&apos;instant.</p>}
        </div>

        {/* Par agent */}
        {perAgent.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 font-mono text-[0.62rem] uppercase tracking-widest text-muted">Répartition par agent</p>
            <div className="space-y-1.5">
              {perAgent.map((a) => (
                <div key={a.name} className="flex items-center justify-between text-sm">
                  <span className="text-s400">{a.name}</span>
                  <span className="font-mono tabular-nums text-off">{a.eur.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <CapEditor daily={dailyCap} monthly={monthlyCap} />
        </div>
      </div>
    </section>
  );
}
