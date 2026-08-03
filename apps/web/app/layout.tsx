import type { Metadata } from "next";
import { Sora, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600", "700"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.synopse.eu"),
  title: "Synopse — Ton agent IA bosse pour toi. On vérifie qu'il ne fait que ça.",
  description:
    "Le filet de sécurité grand public pour agents IA : validation des actions sensibles sur Telegram, plafonds de dépense, kill switch, journal lisible. Protection en 3 minutes, sans toucher un fichier.",
  openGraph: {
    title: "Synopse — le filet de sécurité de ton agent IA",
    description: "Validation Telegram, plafonds de dépense, kill switch. En 3 minutes, gratuit.",
    url: "https://www.synopse.eu",
    siteName: "Synopse",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${sora.variable} ${outfit.variable} ${jetbrains.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
