import type { Metadata } from "next";
import { Landing } from "../landing/landing";

export const metadata: Metadata = {
  title: "Synopse, Your AI agent works for you. We make sure that's all it does.",
  description:
    "The consumer safety net for AI agents: approve sensitive actions from Telegram, spending caps, kill switch, readable log. Protected in 3 minutes, without touching a file.",
  alternates: { canonical: "/en", languages: { fr: "/", en: "/en" } },
  openGraph: {
    title: "Synopse, the safety net for your AI agent",
    description: "Telegram approval, spending caps, kill switch. In 3 minutes, free.",
    url: "https://www.synopse.eu/en",
    locale: "en_US",
    type: "website",
  },
};

/** Visiter la landing EN mémorise la langue pour tout le reste de l'app (login, dashboard, admin). */
export default function Page() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `document.cookie="lang=en;path=/;max-age=31536000;samesite=lax"` }} />
      <Landing lang="en" />
    </>
  );
}
