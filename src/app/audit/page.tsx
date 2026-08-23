import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuditFlow } from "@/components/audit/audit-flow";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Audit de visibilité IA",
  description:
    "Résultat de ton audit de citation sur ChatGPT, Claude, Perplexity et Gemini.",
  robots: { index: false, follow: false },
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; d?: string }>;
}) {
  const { q, d } = await searchParams;
  const query = q?.trim() || "Ton secteur";
  const domain = d?.trim() || undefined;

  return (
    <>
      <SiteHeader />

      {/* Repère de chantier : à retirer quand l'API et Stripe seront branchés. */}
      <div className="border-b border-line bg-cobalt-soft">
        <Container>
          <p className="py-2.5 text-[0.8125rem] text-cobalt">
            Le score vient des moteurs réellement interrogés. Le rapport
            détaillé et le paiement ne sont pas encore branchés.
          </p>
        </Container>
      </div>

      <main>
        <AuditFlow query={query} domain={domain} />
      </main>

      <SiteFooter />
    </>
  );
}
