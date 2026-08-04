/**
 * Fond aurora chaud (charte du logo). Nappes orange/ambre floues qui dérivent, plus lumineux
 * que le shader sombre. CSS pur, léger, respecte prefers-reduced-motion.
 */
export function AuroraBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden bg-void ${className}`} aria-hidden>
      {/* nappes chaudes */}
      <div className="aurora-blob absolute -left-[10%] -top-[15%] h-[55vh] w-[55vh] rounded-full opacity-40 blur-[90px]"
        style={{ background: "radial-gradient(circle, #ea580c 0%, transparent 62%)" }} />
      <div className="aurora-blob b2 absolute right-[-8%] top-[-5%] h-[50vh] w-[50vh] rounded-full opacity-35 blur-[100px]"
        style={{ background: "radial-gradient(circle, #f49d37 0%, transparent 60%)" }} />
      <div className="aurora-blob b3 absolute left-[25%] top-[10%] h-[45vh] w-[45vh] rounded-full opacity-30 blur-[110px]"
        style={{ background: "radial-gradient(circle, #c2402a 0%, transparent 64%)" }} />
      {/* voile bas pour fondre vers le contenu */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent to-void" />
    </div>
  );
}
