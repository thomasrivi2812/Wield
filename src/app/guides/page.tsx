import { Reveal } from "@/components/ui/reveal";
import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Container } from "@/components/ui/container";
import { IconCheck } from "@/components/ui/icons";
import { CheckoutButton } from "@/components/checkout-button";
import { CATALOG, GUIDE_SKUS, formatPrice, packListPrice } from "@/lib/catalog";
import { stripe } from "@/lib/env";

export const metadata: Metadata = {
  title: "Guides IA et GEO",
  description:
    "Les guides Wield pour rendre ta boîte visible sur les IA et installer l’IA dans ton équipe. À faire soi-même, à son rythme.",
};


/** Étiquettes de rayon : le catalogue porte les prix, pas la mise en scène. */
const KINDS: Record<string, string> = {
  guide_citable: "Guide · 48 pages",
  guide_prompts: "Guide · par métier",
  guide_donnees: "Guide technique",
  guide_equipe: "Guide · équipe",
  guide_charte: "Guide · direction",
  guide_automatiser: "Guide · opérations",
};

const PACK = [
  "Les six guides, mises à jour comprises",
  "L’audit SEO + GEO automatique, relancé chaque mois",
  "Le comparateur de prix des IA, tenu à jour",
  "Les nouveaux guides offerts pendant un an",
];

export default function GuidesPage() {
  const notice = stripe.configured
    ? undefined
    : "Le paiement n’est pas encore activé sur ce déploiement.";

  return (
    <PageShell notice={notice}>
      <PageHeader
        eyebrow="La bibliothèque"
        title="Guides IA et GEO"
        lede="Tout ce qu’on applique chez nos clients, écrit noir sur blanc : la méthode, les modèles, les pièges. À faire soi-même, à son rythme."
      />

      <section className="border-b border-line bg-surface">
        <Container>
          <div className="py-16 lg:py-20">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDE_SKUS.map((sku) => {
                const guide = CATALOG[sku];
                return (
                  <Reveal
                    as="li"
                    key={sku}
                    delay={GUIDE_SKUS.indexOf(sku) * 70}
                    className="card-lift flex flex-col rounded-md border border-line bg-surface p-7"
                  >
                    <p className="eyebrow text-absent">{KINDS[sku]}</p>

                    <h2 className="mt-5 text-[1.25rem] leading-[1.25]">
                      {guide.name}
                    </h2>

                    <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
                      {guide.description}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                      <span className="font-display text-[1.25rem] font-extrabold tabular-nums text-ink">
                        {formatPrice(guide.amountCents)}
                      </span>
                      <CheckoutButton
                        sku={sku}
                        label="Acheter"
                        variant="outline"
                        size="md"
                        className="w-auto"
                      />
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </Container>
      </section>

      {/* Le pack, et la veille */}
      <section id="brief" className="scroll-mt-20 border-b border-line bg-bg">
        <Container>
          <div className="grid gap-6 py-16 lg:grid-cols-3 lg:py-20">
            <div className="rounded-md border border-cobalt bg-surface p-8 lg:col-span-2 lg:p-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <span className="eyebrow rounded-xs bg-cobalt px-2.5 py-1.5 text-white">
                    Le pack complet
                  </span>
                  <h2 className="mt-6 max-w-[24ch] text-[1.75rem] leading-tight sm:text-[2rem]">
                    Les six guides et l’audit automatique
                  </h2>
                </div>
                <p className="text-right">
                  <span className="block font-display text-[2.25rem] font-extrabold leading-none tabular-nums text-ink">
                    {formatPrice(CATALOG.pack.amountCents)}
                  </span>
                  <span className="mt-1.5 block text-[0.8125rem] text-absent line-through tabular-nums">
                    {formatPrice(packListPrice())}
                  </span>
                </p>
              </div>

              <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
                {PACK.map((line) => (
                  <li key={line} className="flex gap-3 text-[0.9375rem] leading-snug">
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
                    <span className="text-ink-soft">{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <CheckoutButton sku="pack" label="Prendre le pack" className="sm:max-w-xs" />
              </div>
            </div>

            <div className="flex flex-col rounded-md border border-line bg-surface p-8 lg:p-10">
              <span className="eyebrow self-start rounded-xs border border-line px-2.5 py-1.5 text-ink-soft">
                Abonnement
              </span>

              <h2 className="mt-6 text-[1.75rem] leading-tight">Le Brief</h2>

              <p className="mt-4 text-[0.9375rem] leading-[1.65] text-ink-soft">
                La veille hebdomadaire, plus le comparateur de prix des IA tenu à
                jour. Court, factuel, sans hype.
              </p>

              <p className="mt-8 font-display text-[2rem] font-extrabold leading-none tabular-nums text-ink">
                {formatPrice(CATALOG.brief.amountCents)}
                <span className="ml-1 font-sans text-[0.9375rem] font-normal text-ink-soft">
                  / mois
                </span>
              </p>

              <div className="mt-auto pt-8">
                <CheckoutButton sku="brief" label="S’abonner au Brief" variant="outline" />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
