/** Confirmation de déconnexion, redirige vers la landing après 3 s. */
import Link from "next/link";
import { LogoIcon } from "../logo";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { getLang } from "@/lib/lang-server";

export const metadata = { title: "Déconnecté, Synopse" };

export default async function DeconnexionPage() {
  const en = (await getLang()) === "en";
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center text-off">
      <FallingPattern className="fixed inset-0 -z-10" />
      <meta httpEquiv="refresh" content="3;url=/" />
      <div className="rounded-2xl border border-line bg-void/80 px-10 py-12 backdrop-blur-xl">
        <LogoIcon size={56} className="mx-auto" />
        <h1 className="mt-6 text-2xl font-bold">{en ? "You have been signed out" : "Tu as été déconnecté"}</h1>
        <p className="mt-2 text-sm text-muted">{en ? "Back to home in a moment…" : "Retour à l’accueil dans un instant…"}</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-bright">
          {en ? "Back to home" : "Revenir à l’accueil"}
        </Link>
      </div>
    </div>
  );
}
