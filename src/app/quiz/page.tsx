import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { Quiz } from "@/components/quiz/quiz";

export const metadata: Metadata = {
  title: "Où en est ta boîte avec l’IA ?",
  description:
    "Huit questions pour situer la maturité IA de ta PME : usages, automatismes, données, mesure. Résultat immédiat et prochains pas concrets.",
};

export default function QuizPage() {
  return (
    <PageShell>
      <Quiz />
    </PageShell>
  );
}
