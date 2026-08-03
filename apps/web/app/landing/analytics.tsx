"use client";
/**
 * Funnel PostHog sans dépendance : capture directe vers l'API EU.
 * No-op si NEXT_PUBLIC_POSTHOG_KEY absent. Événements : section vue (scroll depth) + clics CTA.
 */
import Link from "next/link";
import { useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = "https://eu.i.posthog.com";

function did(): string {
  let id = localStorage.getItem("ph_did");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("ph_did", id); }
  return id;
}

export function capture(event: string, props: Record<string, unknown> = {}) {
  if (!KEY) return;
  navigator.sendBeacon?.(
    `${HOST}/capture/`,
    JSON.stringify({ api_key: KEY, event, distinct_id: did(), properties: { ...props, $current_url: location.href } })
  );
}

/** Observe les sections [data-section] et capture la première vue de chacune. */
export function LandingAnalytics() {
  useEffect(() => {
    capture("landing_view");
    const seen = new Set<string>();
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const name = (e.target as HTMLElement).dataset.section;
        if (e.isIntersecting && name && !seen.has(name)) {
          seen.add(name);
          capture("section_view", { section: name });
        }
      }),
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-section]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return null;
}

export function CtaLink({ children, place, className }: { children: React.ReactNode; place: string; className?: string }) {
  return (
    <Link href="/login" className={className} onClick={() => capture("cta_click", { place })}>
      {children}
    </Link>
  );
}
