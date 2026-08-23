import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { ClaimThenRefresh } from "@/components/audit/claim-then-refresh";
import { PlanSection } from "@/components/audit/plan-section";
import { ReportSection } from "@/components/audit/report-section";
import { ScoreCard } from "@/components/audit/score-card";
import { SeoSection } from "@/components/audit/seo-section";
import { isSellable, loadAudit } from "@/lib/audit/store";
import { getSession } from "@/lib/session";

/** Un résultat d'audit n'a rien à faire dans un index de recherche. */
export const metadata: Metadata = {
  title: "Résultat de ton audit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AuditResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ achat?: string }>;
}) {
  const { id } = await params;
  const { achat } = await searchParams;

  const audit = await loadAudit(id);
  if (!audit) notFound();

  const session = await getSession();
  const signedIn = session.state === "signed-in";
  // Connecté mais pas encore propriétaire : l'audit a sans doute été lancé
  // avant l'inscription. On tente le rattachement côté navigateur.
  const shouldClaim = signedIn && !audit.access.owner;

  return (
    <>
      <SiteHeader />

      {achat === "ok" ? (
        <div className="border-b border-line bg-cobalt-soft">
          <Container>
            <p className="py-2.5 text-[0.8125rem] text-cobalt">
              Paiement confirmé. Ton rapport est débloqué ci-dessous. Si tu ne le
              vois pas encore, recharge la page dans quelques secondes.
            </p>
          </Container>
        </div>
      ) : achat === "annule" ? (
        <div className="border-b border-line bg-surface">
          <Container>
            <p className="py-2.5 text-[0.8125rem] text-ink-soft">
              Paiement abandonné. Rien n’a été débité.
            </p>
          </Container>
        </div>
      ) : null}

      <main className="bg-bg">
        <Container>
          <div className="flex flex-col gap-6 py-14 lg:py-20">
            {shouldClaim ? <ClaimThenRefresh /> : null}

            <header className="flex flex-col gap-5 border-b border-line pb-8">
              <p className="eyebrow flex items-center gap-3 text-ink-soft">
                <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
                Audit de visibilité IA
              </p>
              <h1 className="text-[2.125rem] leading-[1.06] sm:text-[2.75rem] lg:text-[3.25rem]">
                {audit.query}
              </h1>
              <p className="text-[0.9375rem] text-ink-soft">
                {audit.measuredCount > 0
                  ? `Six questions posées à ${audit.measuredCount} moteur${audit.measuredCount > 1 ? "s" : ""} de réponse, le ${new Date(audit.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}.`
                  : "Aucun moteur n’a pu être interrogé pour cet audit."}
                {audit.domain ? ` Domaine analysé : ${audit.domain}.` : ""}
              </p>
            </header>

            <ScoreCard
              citedCount={audit.citedCount}
              measuredCount={audit.measuredCount}
              engines={audit.engines}
            />

            <ReportSection prompts={audit.prompts} auditId={audit.id} />

            <PlanSection
              plan={audit.plan}
              auditId={audit.id}
              sellable={isSellable(audit)}
              signedIn={signedIn}
            />

            {isSellable(audit) ? (
              <SeoSection audit={audit} signedIn={signedIn} />
            ) : null}

            <p className="pt-2 text-[0.8125rem] leading-relaxed text-absent">
              Les moteurs sont interrogés via leurs API, pas via leurs
              applications grand public. C’est une mesure reproductible, pas une
              capture de ce que voit un client donné un jour donné.
            </p>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </>
  );
}
