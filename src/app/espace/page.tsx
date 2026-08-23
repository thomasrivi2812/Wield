import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Dashboard } from "@/components/espace/dashboard";

export const metadata: Metadata = {
  title: "Mon espace",
  description: "Tes audits, tes ressources et ta discussion avec l’équipe Wield.",
  robots: { index: false, follow: false },
};

export default function EspacePage() {
  return (
    <PageShell notice="Maquette — compte de démonstration, aucune donnée réelle.">
      <Dashboard />
    </PageShell>
  );
}
