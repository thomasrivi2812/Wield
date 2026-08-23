import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";
import { Button, QuietLink } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";

/** Tarifs et intitulés à valider — ce sont des placeholders. */
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
];

export function Guides() {
  return (
    <section id="guides" className="scroll-mt-20 border-b border-line bg-surface">
      <Container>
        <div className="py-20 lg:py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Eyebrow>La bibliothèque</Eyebrow>
              <h2 className="mt-7 max-w-[20ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
                Ou tu t&apos;y mets <Em>toi-même</Em>.
              </h2>
            </div>
            <p className="max-w-[42ch] text-[1.0625rem] leading-[1.65] text-ink-soft">
              Tout ce qu&apos;on applique chez nos clients, écrit noir sur blanc.
              À faire soi-même, à son rythme.
            </p>
          </div>

          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {GUIDES.map((guide) => (
              <li
                key={guide.title}
                className="group flex flex-col rounded-md border border-line bg-surface p-6 transition-colors hover:border-line-strong"
              >
                <p className="eyebrow text-absent">{guide.kind}</p>

                <h3 className="mt-5 text-[1.1875rem] leading-[1.25]">
                  {guide.title}
                </h3>

                <p className="mt-3 text-[0.875rem] leading-[1.6] text-ink-soft">
                  {guide.body}
                </p>

                <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                  <span className="font-display text-[1.25rem] font-extrabold tabular-nums text-ink">
                    {guide.price}
                  </span>
                  <QuietLink href="#guides">Voir</QuietLink>
                </div>
              </li>
            ))}
          </ul>

          {/* Le pack, et la veille qui va avec */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-md border border-cobalt bg-surface p-8 lg:col-span-2 lg:p-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <span className="eyebrow rounded-xs bg-cobalt px-2.5 py-1.5 text-white">
                    Le pack complet
                  </span>
                  <h3 className="mt-6 max-w-[22ch] text-[1.75rem] leading-tight">
                    Les quatre guides, du diagnostic à l&apos;équipe
                  </h3>
                </div>
                <p className="text-right">
                  <span className="block font-display text-[2rem] font-extrabold leading-none tabular-nums text-ink">
                    79 €
                  </span>
                  <span className="mt-1.5 block text-[0.8125rem] text-absent line-through tabular-nums">
                    136 €
                  </span>
                </p>
              </div>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {GUIDES.map((guide) => (
                  <li
                    key={guide.title}
                    className="flex gap-3 text-[0.9375rem] leading-snug"
                  >
                    <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
                    <span className="text-ink-soft">{guide.title}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <Button href="#guides" size="lg">
                  Prendre le pack
                </Button>
              </div>
            </div>

            <div className="flex flex-col rounded-md border border-line bg-bg p-8 lg:p-10">
              <span className="eyebrow self-start rounded-xs border border-line px-2.5 py-1.5 text-ink-soft">
                Abonnement
              </span>

              <h3 className="mt-6 text-[1.75rem] leading-tight">Le Brief</h3>

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
                <QuietLink href="#brief">S&apos;abonner au Brief</QuietLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
