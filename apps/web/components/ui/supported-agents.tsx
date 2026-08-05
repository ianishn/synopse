/**
 * Agents supportés — remplace l'orbite décorative : uniquement les plateformes
 * réellement branchées, icône + nom, sans animation.
 */
const AGENTS: { name: string; icon: string }[] = [
  { name: "OpenClaw", icon: "/agents/openclaw.png" },
  { name: "Claude", icon: "/agents/claude.png" },
];

export function SupportedAgents() {
  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-4 pb-20">
      {AGENTS.map((a) => (
        <div key={a.name} className="flex items-center gap-3 rounded-2xl border border-line bg-void px-6 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.icon} alt={a.name} width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="text-lg font-semibold text-off">{a.name}</span>
        </div>
      ))}
    </div>
  );
}
