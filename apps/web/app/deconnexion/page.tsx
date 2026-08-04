/** Page de confirmation de déconnexion, redirige vers la landing après 3 s. */
import Link from "next/link";
import { LogoIcon } from "../logo";

export const metadata = { title: "Déconnecté, Synopse" };

export default function DeconnexionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center text-off">
      <meta httpEquiv="refresh" content="3;url=/" />
      <LogoIcon size={56} />
      <h1 className="mt-6 text-2xl font-bold">Tu as été déconnecté</h1>
      <p className="mt-2 text-sm text-muted">Retour à l&apos;accueil dans un instant…</p>
      <Link href="/" className="mt-6 rounded-full bg-orange px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-bright">
        Revenir à l&apos;accueil
      </Link>
    </div>
  );
}
