import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Container } from "@/components/ui/container";
import { Button, QuietLink } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Guides IA et GEO",
  description:
    "Les guides Wield pour rendre ta boîte visible sur les IA et installer l’IA dans ton équipe. À faire soi-même, à son rythme.",
};

/** Intitulés et tarifs à valider — ce sont des placeholders. */
const GUIDES = [
  {
    kind: "Guide · 48 pages",
    title: "Rendre ton site citable par les IA",
    body: "La méthode GEO complète, de l’audit à la première citation.",
    price: "29 €",
  },
  {
    kind: "Guide · par métier",
    title: "Les 40 questions que tes clients posent à l’IA",
    body: "Les prompts réels de ton secteur, et qui sort dessus aujourd’hui.",
    price: "19 €",
  },
  {
    kind: "Guide technique",
    title: "Structurer ses données pour les moteurs de réponse",
    body: "JSON-LD, llms.txt, robots.txt, sitemap : le socle, pas à pas.",
    price: "39 €",
  },
  {
    kind: "Guide · équipe",
    title: "Installer l’IA dans une équipe de dix",
    body: "Quels outils, pour qui, dans quel ordre — sans usine à gaz.",
    price: "49 €",
  },
  {
    kind: "Guide · direction",
    title: "Écrire la charte IA de ta boîte",
    body: "Ce que tes équipes ont le droit de faire, et avec quelles données.",
    price: "29 €",
  },
  {
    kind: "Guide · opérations",
    title: "Automatiser dix tâches sans écrire une ligne de code",
    body: "Devis, relances, comptes rendus : les automatismes qui tiennent.",
    price: "39 €",
  },
];

const PACK = [
  "Les six guides, mises à jour comprises",
  "L’audit SEO + GEO automatique, relancé chaque mois",
  "Le comparateur de prix des IA, tenu à jour",
  "Les nouveaux guides offerts pendant un an",
];

export default function GuidesPage() {
  return (
    <PageShell notice="Maquette — le paiement n’est pas branché.">
      <PageHeader
        eyebrow="La bibliothèque"
        title="Guides IA et GEO"
        lede="Tout ce qu’on applique chez nos clients, écrit noir sur blanc : la méthode, les modèles, les pièges. À faire soi-même, à son rythme."
      />

      <section className="border-b border-line bg-surface">
        <Container>
          <div className="py-16 lg:py-20">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {GUIDES.map((guide) => (
                <li
                  key={guide.title}
                  className="flex flex-col rounded-md border border-line bg-surface p-7 transition-colors hover:border-line-strong"
                >
                  <p className="eyebrow text-absent">{guide.kind}</p>

                  <h2 className="mt-5 text-[1.25rem] leading-[1.25]">
                    {guide.title}
                  </h2>

                  <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
                    {guide.body}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                    <span className="font-display text-[1.25rem] font-extrabold tabular-nums text-ink">
                      {guide.price}
                    </span>
                    <Button href="/guides" variant="outline" size="md">
                      Acheter
                    </Button>
                  </div>
                </li>
              ))}
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
                    129 €
                  </span>
                  <span className="mt-1.5 block text-[0.8125rem] text-absent line-through tabular-nums">
                    214 €
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
                <Button href="/guides" size="lg">
                  Prendre le pack
                </Button>
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
                9 €
                <span className="ml-1 font-sans text-[0.9375rem] font-normal text-ink-soft">
                  / mois
                </span>
              </p>

              <div className="mt-auto pt-8">
                <QuietLink href="/guides">S’abonner au Brief</QuietLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
