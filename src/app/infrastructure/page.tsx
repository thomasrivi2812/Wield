import { Reveal } from "@/components/ui/reveal";
import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { BriefForm } from "@/components/infra/brief-form";

export const metadata: Metadata = {
  title: "Infrastructure web",
  description:
    "Wield construit l’infrastructure web des PME : boutique en ligne, landing page, site métier. Tu décris ton besoin, tu reçois un plan d’action et un devis sous 48 h.",
};

const BUILDS = [
  {
    title: "Boutique en ligne",
    body: "Catalogue, paiement, expédition, relances. Ce qu’il faut pour vendre, pas une usine à gaz.",
  },
  {
    title: "Landing page",
    body: "Une page, une promesse, une action. Pensée pour convertir et pour être citée par les IA.",
  },
  {
    title: "Site métier",
    body: "Prise de rendez-vous, devis en ligne, espace client, catalogue technique : le site qui travaille.",
  },
  {
    title: "Refonte",
    body: "Un site qui ne tient plus la route : on garde ce qui marche, on reconstruit le reste.",
  },
];

const STEPS = [
  {
    title: "Tu décris",
    body: "Trois questions et quelques lignes. Deux minutes, pas un cahier des charges.",
  },
  {
    title: "On répond sous 48 h",
    body: "Un plan d’action concret et un devis chiffré, par e-mail. Rien à signer pour le lire.",
  },
  {
    title: "On construit",
    body: "Rendu serveur, données structurées, hébergement européen. Livré, pas maquetté.",
  },
];

export default function InfrastructurePage() {
  return (
    <PageShell notice="Maquette — le formulaire n’envoie encore rien." showInfra={false}>
      <PageHeader
        eyebrow="Infrastructure web"
        title={
          <>
            L&apos;infrastructure web de ta boîte, à <Em>prix réduit</Em>
          </>
        }
        lede="Boutique en ligne, landing page, site métier. On construit la base technique dont ton entreprise a besoin — bien faite, rapide, et visible autant par Google que par les IA."
      />

      {/* Ce qu'on construit */}
      <section className="border-b border-line bg-surface">
        <Container>
          <div className="py-16 lg:py-20">
            <h2 className="text-[1.75rem] leading-tight sm:text-[2rem]">
              Ce qu&apos;on construit
            </h2>

            <ul className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              {BUILDS.map((build, i) => (
                <Reveal as="li" key={build.title} delay={i * 70} className="bg-surface p-7 lg:p-8">
                  <h3 className="text-[1.1875rem] leading-snug">{build.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
                    {build.body}
                  </p>
                </Reveal>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* Comment ça se passe */}
      <section className="border-b border-line bg-bg">
        <Container>
          <div className="py-16 lg:py-20">
            <h2 className="text-[1.75rem] leading-tight sm:text-[2rem]">
              Comment ça se passe
            </h2>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={i * 90}
                  className="card-lift rounded-md border border-line bg-surface p-7 lg:p-8"
                >
                  <h3 className="text-[1.25rem] leading-snug">{step.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-soft">
                    {step.body}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {/* Le formulaire */}
      <section id="brief" className="scroll-mt-20 border-b border-line bg-surface">
        <Container>
          <div className="grid gap-10 py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
            <div className="min-w-0 lg:col-span-5">
              <h2 className="text-[2rem] leading-[1.08] sm:text-[2.5rem]">
                Dis-nous ce dont tu as besoin.
              </h2>
              <p className="mt-6 text-[1.0625rem] leading-[1.7] text-ink-soft">
                Pas de rendez-vous découverte, pas de relance commerciale. Tu
                remplis, on lit, on te répond avec un plan et un prix.
              </p>
              <p className="mt-6 text-[0.9375rem] leading-[1.7] text-ink-soft">
                Si le projet ne rentre pas dans nos cordes, on te le dit — et on
                t&apos;oriente vers quelqu&apos;un de plus adapté.
              </p>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <BriefForm />
            </div>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
