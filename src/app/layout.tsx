import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wield.fr"),
  title: {
    default: "Wield — Sois visible et recommandé par les IA",
    template: "%s · Wield",
  },
  description:
    "Wield rend ta PME visible et recommandée sur ChatGPT, Claude, Perplexity et Gemini — et t'apprend à manier l'IA au quotidien. Audit de visibilité IA gratuit.",
  keywords: [
    "GEO",
    "AEO",
    "visibilité IA",
    "référencement ChatGPT",
    "citation IA",
    "PME",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Wield",
    title: "Tes clients demandent à l'IA. Es-tu dans la réponse ?",
    description:
      "Wield rend ta PME visible et recommandée sur ChatGPT, Claude, Perplexity et Gemini.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
