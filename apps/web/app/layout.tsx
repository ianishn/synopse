import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.synopse.eu"),
  title: "Synopse, Ton agent IA bosse pour toi. On vérifie qu'il ne fait que ça.",
  description:
    "Le filet de sécurité grand public pour agents IA : validation des actions sensibles sur Telegram, plafonds de dépense, kill switch, journal lisible. Protection en 3 minutes, sans toucher un fichier.",
  openGraph: {
    title: "Synopse, le filet de sécurité de ton agent IA",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
