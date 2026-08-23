import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";

const STEPS = [
  {
    title: "Auditer",
    body: "On mesure ton taux de citation actuel sur les prompts de ton secteur.",
    tempo: "Semaine 1",
  },
  {
    title: "Optimiser",
    body: "Contenu structuré, données factuelles, autorité : on rend ta marque citable par les IA.",
    tempo: "Semaines 2 à 6",
  },
  {
    title: "Suivre",
    body: "Un rapport mensuel qui montre ta progression, IA par IA.",
    tempo: "Tous les mois",
  },
];

export function Geo() {
  return (
    <section id="geo" className="scroll-mt-20 border-b border-line bg-surface">
      <Container>
        <div className="py-20 lg:py-24">
          <Eyebrow>En clair</Eyebrow>

          <h2 className="mt-7 max-w-[16ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
            C&apos;est quoi le <Em>GEO</Em> ?
          </h2>

          {/* La définition, en tête et sans détour : c'est le format qu'une IA cite. */}
          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="border-l-2 border-cobalt pl-6 text-[1.375rem] leading-[1.45] font-medium text-ink sm:text-[1.5rem]">
                Le GEO, c&apos;est le référencement appliqué aux IA. Le SEO te
                classe dans une liste de liens. Le GEO te fait citer dans la
                réponse que l&apos;IA rédige.
              </p>
            </div>

            <div className="lg:col-span-5">
              <p className="text-[1.0625rem] leading-[1.7] text-ink-soft">
                Les règles ne sont plus les mêmes. Une IA ne classe pas des
                pages&nbsp;: elle cherche des faits vérifiables, dans des sources
                qu&apos;elle juge fiables, et cite celles qui répondent le plus
                directement à la question posée. Tout le travail consiste à
                devenir cette source-là.
              </p>
            </div>
          </div>

          {/* Comment on s'y prend */}
          <p className="mt-16 font-display text-[1.125rem] font-semibold text-ink">
            Concrètement, on procède en trois temps.
          </p>

          <ul className="mt-6 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.title}
                className="group flex flex-col bg-surface p-8 transition-colors hover:bg-bg lg:p-10"
              >
                <span className="eyebrow text-absent">{step.tempo}</span>

                <h3 className="mt-6 text-[1.75rem] leading-tight">
                  {step.title}
                </h3>

                <p className="mt-4 text-[0.9375rem] leading-[1.65] text-ink-soft">
                  {step.body}
                </p>

                <span
                  aria-hidden="true"
                  className="mt-10 h-px w-10 bg-line-strong transition-all duration-300 group-hover:w-20 group-hover:bg-cobalt"
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
