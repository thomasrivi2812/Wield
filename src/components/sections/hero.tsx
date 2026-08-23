import { Button, QuietLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { IconCross } from "@/components/ui/icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden="true"
        className="grid-hairline-light pointer-events-none absolute inset-0"
      />
      <Container className="relative">
        <div className="grid items-center gap-14 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
          {/* Colonne éditoriale */}
          <div className="min-w-0 lg:col-span-7">
            <h1 className="text-[2.375rem] leading-[1.03] sm:text-[3.25rem] lg:text-[4.25rem] xl:text-[4.75rem]">
              Tes clients demandent à l&apos;IA.
              <br />
              Es-tu <Em>dans la réponse</Em> ?
            </h1>

            <p className="mt-7 max-w-[52ch] text-lg leading-[1.6] text-ink-soft">
              Wield s&apos;occupe de ton{" "}
              <strong className="font-semibold text-cobalt">
                référencement sur les IA
              </strong>{" "}
              : être visible et recommandé sur ChatGPT, Claude, Perplexity et
              Gemini — et savoir manier l&apos;IA au quotidien. Sans slides,
              sans jargon.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Button href="#test" size="lg">
                Audit de visibilité IA — gratuit
              </Button>
              <QuietLink href="#brief">Recevoir la veille</QuietLink>
            </div>
          </div>

          {/* Colonne démonstration : la réponse de l'IA, sans toi dedans */}
          <div className="min-w-0 lg:col-span-5">
            <AnswerPanel />
          </div>
        </div>
      </Container>
    </section>
  );
}

const SOURCES = [
  { name: "Concurrent A", domain: "concurrent-a.fr" },
  { name: "Concurrent B", domain: "concurrent-b.com" },
  { name: "Annuaire régional", domain: "annuaire-pro.fr" },
];

function AnswerPanel() {
  return (
    <figure className="relative rounded-md border border-line-invert bg-slate p-1.5 shadow-[0_24px_60px_-32px_rgba(21,23,28,0.55)]">
      <div className="rounded-sm bg-slate-soft">
        {/* Barre de prompt */}
        <div className="flex items-center gap-3 border-b border-line-invert px-5 py-4">
          <span className="eyebrow shrink-0 text-ink-invert-soft">
            Assistant IA
          </span>
          <span
            aria-hidden="true"
            className="h-3 w-px shrink-0 bg-line-invert"
          />
          <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink-invert-soft">
            requête d&apos;un acheteur, aujourd&apos;hui
          </span>
        </div>

        <div className="px-5 pt-5">
          <p className="font-display text-[0.9375rem] font-medium leading-snug text-ink-invert">
            « Quel prestataire fiable pour{" "}
            <span className="text-cobalt-light">[ton métier]</span> en
            Auvergne-Rhône-Alpes ? »
          </p>
        </div>

        {/* Réponse */}
        <div className="px-5 py-5">
          <p className="text-[0.875rem] leading-[1.7] text-ink-invert-soft">
            Voici trois prestataires régulièrement recommandés pour ce type de
            besoin, avec leurs spécialités et leurs références publiques…
          </p>

          <p className="eyebrow mt-6 text-ink-invert-soft">Sources citées</p>
          <ul className="mt-3 space-y-px">
            {SOURCES.map((source, i) => (
              <li
                key={source.name}
                className="flex items-center gap-3 border-b border-line-invert py-3 last:border-b-0"
              >
                <span className="font-display text-[0.6875rem] font-semibold text-cobalt-light">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[0.875rem] text-ink-invert">
                  {source.name}
                </span>
                <span className="ml-auto text-[0.75rem] text-ink-invert-soft">
                  {source.domain}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Le verdict */}
      <figcaption className="flex items-center gap-3 px-5 py-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-[#6b6f78] text-[#6b6f78]">
          <IconCross className="h-3 w-3" />
        </span>
        <span className="text-[0.875rem] text-ink-invert">
          Ta boîte&nbsp;:{" "}
          <span className="text-absent-invert">absente de la réponse.</span>
        </span>
      </figcaption>
    </figure>
  );
}
