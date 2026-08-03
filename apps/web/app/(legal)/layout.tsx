/** Layout commun des pages légales. */
import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3">
      <Link className="text-xs underline opacity-60" href="/">← synopse.eu</Link>
      {children}
    </main>
  );
}
