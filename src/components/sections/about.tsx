import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";
import { QuietLink } from "@/components/ui/button";

const FACTS = [
  ["Basé à", "Lyon — interventions partout en France"],
  ["Avant Wield", "Développeur produit, 10 ans de web et de data"],
  ["Délai de réponse", "48 h ouvrées, toujours par une vraie personne"],
];

export function About() {
  return (
    <section id="apropos" className="scroll-mt-20 border-b border-line bg-surface">
      <Container>
        <div className="grid gap-12 py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
          {/* Photo placeholder */}
          <div className="lg:col-span-4">
            <div className="relative aspect-[4/5] w-full max-w-[340px] overflow-hidden rounded-md border border-line bg-bg">
              <div
                aria-hidden="true"
                className="grid-hairline-light absolute inset-0"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line-strong text-absent">
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                    className="h-7 w-7"
                  >
                    <circle cx="16" cy="12" r="5" />
                    <path d="M6 27c1.8-5.2 5.6-8 10-8s8.2 2.8 10 8" strokeLinecap="square" />
                  </svg>
                </span>
                <span className="eyebrow text-absent">Photo à venir</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="lg:col-span-8">
            <Eyebrow index="07">Qui je suis</Eyebrow>

            <h2 className="mt-7 text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
              Derrière <Em>Wield</Em>
            </h2>

            <p className="mt-8 max-w-[58ch] text-[1.125rem] leading-[1.7] text-ink-soft">
              Je m&apos;appelle{" "}
              <span className="text-ink">Prénom Nom</span>. Je construis des
              produits web depuis dix ans, et depuis deux ans je passe mes
              journées à comprendre comment les IA choisissent qui elles citent.
              Wield, c&apos;est la traduction de ce travail pour les PME&nbsp;:
              une méthode, des livrables, des chiffres — pas un cabinet de
              conseil de plus.
            </p>

            <dl className="mt-12 divide-y divide-line border-y border-line">
              {FACTS.map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <dt className="eyebrow w-44 shrink-0 text-absent">{label}</dt>
                  <dd className="text-[0.9375rem] text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <QuietLink href="#cta">Me poser une question directement</QuietLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
