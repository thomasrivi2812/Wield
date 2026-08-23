import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";

const STEPS = [
  {
    index: "01",
    title: "Auditer",
    body: "On mesure ton taux de citation actuel sur les prompts de ton secteur.",
    tempo: "Semaine 1",
  },
  {
    index: "02",
    title: "Optimiser",
    body: "Contenu structuré, données factuelles, autorité : on rend ta marque citable par les IA.",
    tempo: "Semaines 2 à 6",
  },
  {
    index: "03",
    title: "Suivre",
    body: "Un rapport mensuel qui montre ta progression, IA par IA.",
    tempo: "Tous les mois",
  },
];

export function Method() {
  return (
    <section id="methode" className="scroll-mt-20 border-b border-line bg-surface">
      <Container>
        <div className="py-20 lg:py-24">
          <Eyebrow index="03">La méthode</Eyebrow>

          <h2 className="mt-7 max-w-[16ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
            Comment on te rend <Em>visible</Em>
          </h2>

          <ol className="mt-14 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3">
            {STEPS.map((step) => (
              <li
                key={step.index}
                className="group flex flex-col bg-surface p-8 transition-colors hover:bg-bg lg:p-10"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[0.8125rem] font-bold tracking-[0.14em] text-cobalt">
                    {step.index}
                  </span>
                  <span className="eyebrow text-absent">{step.tempo}</span>
                </div>

                <h3 className="mt-8 text-[1.75rem] leading-tight">{step.title}</h3>

                <p className="mt-4 text-[0.9375rem] leading-[1.65] text-ink-soft">
                  {step.body}
                </p>

                <span
                  aria-hidden="true"
                  className="mt-10 h-px w-10 bg-line-strong transition-all duration-300 group-hover:w-20 group-hover:bg-cobalt"
                />
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
