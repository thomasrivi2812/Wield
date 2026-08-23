import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";

const CITATIONS_PAR_SEMAINE = [0, 0, 1, 1, 2, 3, 5, 6];
const MAX = 6;

const LOGOS = [
  "ATELIER NORD",
  "GROUPE VERRIÈRE",
  "SIGMA PRO",
  "MAISON BRAULT",
  "OPTIMA RH",
  "CAP LOGISTIQUE",
];

export function Proof() {
  return (
    <section id="preuve" className="scroll-mt-20 border-b border-line bg-bg">
      <Container>
        <div className="py-20 lg:py-24">
          <Eyebrow index="04">La preuve</Eyebrow>

          <h2 className="mt-7 max-w-[16ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
            Des résultats <Em>mesurables</Em>.
          </h2>

          <div className="mt-14 grid gap-6 lg:grid-cols-12">
            {/* Étude de cas chiffrée */}
            <article className="rounded-md border border-line bg-surface p-8 lg:col-span-7 lg:p-10">
              <p className="eyebrow text-ink-soft">Étude de cas · PME industrielle, 24 salariés</p>

              <h3 className="mt-6 max-w-[18ch] text-[1.75rem] leading-[1.15] sm:text-[2rem]">
                De 0 à 6 citations/mois sur ChatGPT en 8 semaines
              </h3>

              {/* Histogramme : citations par semaine */}
              <figure className="mt-10">
                <div className="flex h-32 items-end gap-2">
                  {CITATIONS_PAR_SEMAINE.map((value, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-28 w-full items-end">
                        <div
                          className={`w-full rounded-xs ${value === 0 ? "bg-line" : "bg-cobalt"}`}
                          style={{
                            height: `${Math.max((value / MAX) * 100, 3)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[0.6875rem] text-absent">
                        S{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <figcaption className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[0.8125rem] text-ink-soft">
                  <span>Citations relevées par semaine</span>
                  <span className="font-display font-semibold text-ink">
                    +6 en 8 semaines
                  </span>
                </figcaption>
              </figure>
            </article>

            {/* Témoignage */}
            <article className="flex flex-col justify-between rounded-md border border-line bg-surface p-8 lg:col-span-5 lg:p-10">
              <div>
                <p className="eyebrow text-ink-soft">Témoignage</p>
                <blockquote className="mt-6 font-display text-[1.375rem] leading-[1.35] font-medium text-ink sm:text-[1.5rem]">
                  « On a eu trois demandes entrantes qui citaient explicitement
                  ChatGPT. Avant Wield, zéro. »
                </blockquote>
              </div>

              <figcaption className="mt-10 flex items-center gap-4 border-t border-line pt-6">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg font-display text-[0.8125rem] font-bold text-absent"
                >
                  PH
                </span>
                <span className="text-[0.875rem] leading-snug">
                  <span className="block font-display font-semibold text-ink">
                    Prénom Nom
                  </span>
                  <span className="block text-ink-soft">
                    Dirigeant · PME de services, Lyon
                  </span>
                </span>
              </figcaption>
            </article>

            {/* Bande logos clients */}
            <div className="rounded-md border border-line bg-surface lg:col-span-12">
              <div className="flex flex-col gap-6 px-8 py-7 lg:flex-row lg:items-center lg:gap-10 lg:px-10">
                <p className="eyebrow shrink-0 text-ink-soft">
                  Ils travaillent avec Wield
                </p>
                <ul className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
                  {LOGOS.map((logo) => (
                    <li
                      key={logo}
                      className="whitespace-nowrap font-display text-[0.75rem] font-bold tracking-[0.06em] text-absent"
                    >
                      {logo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
