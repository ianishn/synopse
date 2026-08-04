"use client";
/** CTA lumineux (21st.dev), rebrandé DA : halo Signal Orange au lieu du dégradé violet/rose. */
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { label?: string; href?: string; onNav?: () => void };

export function ButtonColorful({ className, label = "Protéger mon agent", href, onNav, ...props }: Props) {
  const content = (
    <>
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#c2402a] via-[#ea580c] to-[#f49d37] opacity-60 blur transition-opacity duration-500 group-hover:opacity-100"
      />
      <span className="relative flex items-center justify-center gap-2 font-semibold text-white">
        {label}
        <ArrowUpRight className="h-4 w-4 text-white/90 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </>
  );

  const cls = cn(
    "group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-void-2 px-7 text-sm transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange-bright)]",
    className,
  );

  if (href) return <a href={href} className={cls} onClick={onNav}>{content}</a>;
  return <button className={cls} {...props}>{content}</button>;
}
