"use client";
/**
 * Orbites d'agents IA autour d'une sphère de particules (21st.dev, reconstruit + rebrandé DA).
 * La sphère = Synopse (le noyau), les orbites = les agents qu'il surveille.
 * Sphère en canvas maison (le composant d'origine dépendait d'un fichier absent).
 */
import { useEffect, useRef } from "react";

const ORBITS = [
  { size: "h-[22rem] w-[22rem] md:h-[30rem] md:w-[30rem]", duration: 18, agents: [
    { n: "OpenClaw", s: "/agents/openclaw.png", a: -60 }, { n: "Claude", s: "/agents/claude.png", a: 0 }, { n: "ChatGPT", s: "/agents/chatgpt.png", a: 60 }] },
  { size: "h-[28rem] w-[28rem] md:h-[38rem] md:w-[38rem]", duration: 24, agents: [
    { n: "Gemini", s: "/agents/gemini.png", a: 0 }, { n: "Copilot", s: "/agents/copilot.png", a: -90 }] },
  { size: "h-[34rem] w-[34rem] md:h-[46rem] md:w-[46rem]", duration: 30, agents: [
    { n: "Mistral", s: "/agents/mistral.png", a: -60 }, { n: "Ollama", s: "/agents/ollama.png", a: 0 }, { n: "Perplexity", s: "/agents/perplexity.png", a: 60 }] },
];

function ParticleSphere() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { cv.width = cv.clientWidth * dpr; cv.height = cv.clientHeight * dpr; };
    resize();
    window.addEventListener("resize", resize);

    // Points répartis sur une sphère (spirale de Fibonacci).
    const N = 420;
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, running = true, t = 0;
    const draw = () => {
      if (!running) return;
      if (!reduced) t += 0.0035;
      const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      ctx.clearRect(0, 0, w, h);
      const cos = Math.cos(t), sin = Math.sin(t);
      for (const p of pts) {
        const x = p.x * cos - p.z * sin;
        const z = p.x * sin + p.z * cos;
        const depth = (z + 1) / 2;               // 0 (loin) → 1 (près)
        const sx = cx + x * R, sy = cy + p.y * R;
        ctx.beginPath();
        ctx.arc(sx, sy, (0.6 + depth * 1.5) * dpr, 0, Math.PI * 2);
        // Coeur orange près de l'observateur, points froids au fond.
        ctx.fillStyle = depth > 0.62
          ? `rgba(234,88,12,${0.25 + depth * 0.65})`
          : `rgba(148,163,184,${0.1 + depth * 0.3})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!running) { running = true; draw(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}

export function OrbitingAgents() {
  return (
    <div className="relative flex h-[26rem] w-full justify-center overflow-hidden md:h-[34rem]">
      <style>{`
        @keyframes orbit-cw { from { transform: rotate(var(--sa)) } to { transform: rotate(calc(var(--sa) + 360deg)) } }
        @keyframes orbit-ccw { from { transform: rotate(var(--sa)) } to { transform: rotate(calc(var(--sa) - 360deg)) } }
        @keyframes counter-cw { from { transform: rotate(var(--co)) } to { transform: rotate(calc(var(--co) - 360deg)) } }
        @keyframes counter-ccw { from { transform: rotate(var(--co)) } to { transform: rotate(calc(var(--co) + 360deg)) } }
        @media (prefers-reduced-motion: reduce) { .orbit-item, .orbit-counter { animation: none !important } }
      `}</style>

      {/* Noyau Synopse */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 aspect-square w-64 -translate-x-1/2 translate-y-1/2 md:w-96">
        <ParticleSphere />
      </div>

      {ORBITS.map((orbit, i) => {
        const cw = i % 2 === 0;
        const all = [...orbit.agents, ...orbit.agents.map((x) => ({ ...x, a: x.a + 180 }))];
        return (
          <div key={i} className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full border border-line ${orbit.size}`}>
            {all.map((ag, j) => (
              <div key={j} className="orbit-item absolute left-1/2 top-0 -ml-10 flex h-1/2 origin-bottom flex-col items-center"
                style={{ "--sa": `${ag.a}deg`, animation: `${cw ? "orbit-cw" : "orbit-ccw"} ${orbit.duration}s linear infinite` } as React.CSSProperties}>
                <div className="orbit-counter relative z-10 -mt-5 grid h-11 w-11 place-items-center rounded-full border border-line bg-void md:h-14 md:w-14"
                  style={{ "--co": `${-ag.a}deg`, animation: `${cw ? "counter-cw" : "counter-ccw"} ${orbit.duration}s linear infinite` } as React.CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ag.s} alt={ag.n} title={ag.n} width={28} height={28} className="h-6 w-6 object-contain md:h-8 md:w-8" />
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
