"use client";
/** Faisceau qui parcourt la bordure (21st.dev), rebrandé DA : ambre -> Signal Orange. */
import { useEffect } from "react";
import { cn } from "@/lib/utils";

function useGlobalStyles(css: string, id: string) {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }, [css, id]);
}

const STYLES = `
@keyframes border-beam-spin { from { --angle: 0deg; } to { --angle: 360deg; } }
@property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
@media (prefers-reduced-motion: reduce) { .border-beam-run { animation: none !important; } }
`;

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = "#f49d37",
  colorTo = "#ea580c",
  borderWidth = 1.5,
}: BorderBeamProps) {
  useGlobalStyles(STYLES, "border-beam-styles");
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{
        "--size": size,
        "--duration": `${duration}s`,
        "--delay": `-${delay}s`,
        "--color-from": colorFrom,
        "--color-to": colorTo,
        "--border-width": `${borderWidth}px`,
      } as React.CSSProperties}
    >
      <div
        className="border-beam-run absolute inset-0 rounded-[inherit]"
        style={{
          padding: "var(--border-width)",
          background: `linear-gradient(var(--angle, 0deg), transparent 0%, transparent 35%, var(--color-from) 50%, var(--color-to) 65%, transparent 80%, transparent 100%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          animation: `border-beam-spin var(--duration) linear infinite var(--delay)`,
        } as React.CSSProperties}
      />
    </div>
  );
}

export default BorderBeam;
