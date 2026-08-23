import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";

/**
 * Le chiffre choc. Forme retenue : un nombre héros, pas un graphique — la donnée
 * est une valeur unique. Le second jeu (15 % -> 8 %) est un dumbbell avant/après,
 * dessiné en HTML pour que les deux valeurs restent du texte lisible.
 * Une seule teinte + gris : le cobalt marque l'état d'aujourd'hui, le gris le contexte.
 */
export function Stat() {
  return (
    <section id="chiffre" className="scroll-mt-20 border-b border-line bg-bg">
      <Container>
        <div className="py-20 lg:py-24">
          <Eyebrow>Le chiffre</Eyebrow>

          <h2 className="mt-7 max-w-[18ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
            Quand l&apos;IA répond, <Em>le clic disparaît</Em>.
          </h2>

          <div className="mt-14 grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Le nombre héros */}
            <figure className="lg:col-span-5">
              <p className="font-display text-[7rem] leading-[0.82] font-bold tracking-[-0.04em] text-cobalt tabular-nums sm:text-[9rem] lg:text-[10rem]">
                1&#8239;%
              </p>
              <figcaption className="mt-6 max-w-[24ch] text-[1.25rem] leading-[1.35] font-medium text-ink">
                des internautes cliquent sur une source citée dans un résumé
                généré par l&apos;IA.
              </figcaption>

              <p className="mt-9 max-w-[34ch] border-t border-line pt-7 text-[1.0625rem] leading-[1.7] text-ink-soft">
                Le trafic ne se joue plus sur le classement des liens, mais sur
                la réponse elle-même.{" "}
                <span className="font-medium text-ink">
                  La seule place qui compte désormais, c&apos;est d&apos;être la
                  source que l&apos;IA cite.
                </span>
              </p>
            </figure>

            {/* Avant / après : le taux de clic sur un résultat de recherche */}
            <div className="lg:col-span-7">
              <figure className="rounded-md border border-line bg-surface p-8 lg:p-10">
                <figcaption className="eyebrow text-ink-soft">
                  Taux de clic sur un résultat de recherche
                </figcaption>

                <dl className="mt-8 space-y-7">
                  <Bar
                    label="Sans résumé IA"
                    value={15}
                    max={15}
                    tone="context"
                  />
                  <Bar
                    label="Avec résumé IA"
                    value={8}
                    max={15}
                    tone="today"
                  />
                </dl>

                <p className="mt-9 border-t border-line pt-6 text-[0.8125rem] leading-relaxed text-ink-soft">
                  Source&nbsp;: Pew Research Center, juillet 2025 — navigation
                  observée de 900 adultes américains, mars 2025.
                </p>
              </figure>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "context" | "today";
}) {
  const today = tone === "today";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-[0.9375rem] text-ink-soft">{label}</dt>
        <dd className="font-display text-[1.5rem] font-bold text-ink tabular-nums">
          {value}&nbsp;%
        </dd>
      </div>
      <div className="mt-2.5 h-2 w-full rounded-full bg-bg">
        <div
          className={`h-2 rounded-full ${today ? "bg-cobalt" : "bg-absent"}`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );
}
