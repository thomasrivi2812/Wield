import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuditFlow } from "@/components/audit/audit-flow";
import { AuthPanel } from "@/components/audit/auth-panel";
import { Container } from "@/components/ui/container";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/env";

export const metadata: Metadata = {
  title: "Audit de visibilité IA",
  description:
    "Résultat de ton audit de citation sur ChatGPT, Claude, Perplexity et Gemini.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; d?: string }>;
}) {
  const { q, d } = await searchParams;
  const query = q?.trim() || "Ton secteur";
  const domain = d?.trim() || undefined;

  const session = await getSession();

  return (
    <>
      <SiteHeader />

      {/* Le bandeau dit ce qui est réellement branché, pas ce qu'on espère. */}
      {stripe.configured ? null : (
        <div className="border-b border-line bg-cobalt-soft">
          <Container>
            <p className="py-2.5 text-[0.8125rem] text-cobalt">
              Le score vient des moteurs réellement interrogés. Le paiement
              n’est pas encore activé sur ce déploiement.
            </p>
          </Container>
        </div>
      )}

      <main>
        {session.state === "anonymous" ? (
          <SignInFirst query={query} domain={domain} />
        ) : (
          <AuditFlow query={query} domain={domain} />
        )}
      </main>

      <SiteFooter />
    </>
  );
}

/**
 * Le mur de connexion, avant le scan.
 *
 * Un audit coûte de l'argent réel à chaque lancement. Le compte n'est pas là
 * pour collecter des adresses : il borne la dépense, et il donne au visiteur
 * un endroit où retrouver son résultat. La page le dit dans ces termes.
 *
 * La requête est conservée dans `next` : après connexion, le scan part tout
 * seul, sans avoir à la ressaisir.
 */
function SignInFirst({ query, domain }: { query: string; domain?: string }) {
  const params = new URLSearchParams({ q: query });
  if (domain) params.set("d", domain);
  const next = `/audit?${params.toString()}`;

  return (
    <div className="bg-bg">
      <Container>
        <div className="grid items-start gap-12 py-16 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <div className="min-w-0 lg:col-span-6">
            <p className="eyebrow flex items-center gap-3 text-ink-soft">
              <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
              Audit de visibilité IA
            </p>

            <h1 className="animate-rise mt-6 text-[2.125rem] leading-[1.06] sm:text-[2.75rem] lg:text-[3.25rem]">
              {query}
            </h1>

            <p className="mt-7 max-w-[52ch] text-[1.0625rem] leading-[1.7] text-ink-soft">
              Ton audit est prêt à partir. Crée ton compte pour le lancer —
              c’est gratuit et sans carte bancaire.
            </p>

            <div className="mt-8 border-t border-line pt-7">
              <p className="font-display text-[1rem] font-semibold text-ink">
                Pourquoi un compte ?
              </p>
              <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                <li>
                  Chaque audit interroge les moteurs de réponse en direct, et
                  ces requêtes nous sont facturées. Le compte évite qu’un
                  script les enchaîne à notre place.
                </li>
                <li>
                  Tu retrouves tes audits et leur évolution dans ton espace,
                  au lieu de perdre le résultat en fermant l’onglet.
                </li>
              </ul>
              <p className="mt-5 text-[0.8125rem] text-absent">
                Trois audits par heure. Aucune carte demandée, aucune donnée
                revendue.
              </p>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-6 lg:col-start-8">
            <AuthPanel
              next={next}
              title="Crée ton compte pour lancer l’audit"
              lede="Pas de mot de passe : Google, ou un lien envoyé par e-mail. Le compte se crée tout seul à la première connexion, et l’audit part aussitôt."
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
