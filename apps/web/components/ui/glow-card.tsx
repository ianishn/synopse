/**
 * Tuile vitrée avec blob dégradé animé derrière (21st.dev "gradient blob card", rebrandé DA).
 * Couleurs Synopse : braise -> Signal Orange -> ambre. Le blob s'intensifie au survol.
 */
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"div"> & {
  /** Tuile mise en avant : bordure orange + blob plus présent. */
  featured?: boolean;
};

export function GlowCard({ featured = false, className, children, ...props }: Props) {
  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl p-[1px] transition-transform duration-300 hover:-translate-y-1",
        featured ? "shadow-[0_24px_60px_-24px_rgba(234,88,12,0.45)]" : "",
        className,
      )}
      {...props}
    >
      {/* Blob animé (sous la vitre) */}
      <div
        aria-hidden
        className={cn(
          "animate-blob pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[150%] rounded-full blur-[42px] transition-opacity duration-500",
          "bg-[linear-gradient(120deg,#c2402a,#ea580c,#f49d37)]",
          featured ? "opacity-55 group-hover:opacity-80" : "opacity-25 group-hover:opacity-55",
        )}
      />
      {/* Liseré */}
      <div aria-hidden className={cn("absolute inset-0 rounded-2xl", featured ? "ring-1 ring-orange" : "ring-1 ring-line")} />
      {/* Vitre + contenu */}
      <div className="relative z-10 h-full rounded-[15px] bg-void/85 backdrop-blur-xl">{children}</div>
    </div>
  );
}
