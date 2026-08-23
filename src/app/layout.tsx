import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";
import "./globals.css";

/* Archivo : grotesque industrielle, vraies italiques dessinées. */
const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-archivo",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wield.fr"),
  title: {
    default: "Wield — Sois visible et recommandé par les IA",
    template: "%s · Wield",
  },
  description:
    "Wield rend ta PME visible et recommandée sur ChatGPT, Claude, Perplexity et Gemini — et t'apprend à manier l'IA au quotidien. Teste ta visibilité en deux minutes.",
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
    <html lang="fr" className={`${publicSans.variable} ${archivo.variable}`}>
      <head>
        {/*
          Filet de sécurité : la classe `.reveal` masque son contenu en
          attendant que le script le dévoile. Sans JavaScript, ce masquage
          viderait la page — cette règle l'annule.
        */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
