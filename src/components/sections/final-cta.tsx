import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";

export function FinalCta() {
  return (
    <section
      id="cta"
      className="relative scroll-mt-20 overflow-hidden bg-slate text-ink-invert"
    >
      <div
        aria-hidden="true"
        className="grid-hairline pointer-events-none absolute inset-0"
      />
      <Container className="relative">
        <Reveal className="flex flex-col items-center py-24 text-center lg:py-32">
          <p className="eyebrow text-cobalt-light">Prochaine étape</p>

          <h2 className="mt-7 max-w-[20ch] text-[2.375rem] leading-[1.06] sm:text-[3rem] lg:text-[3.5rem]">
            Découvre si tes clients te trouvent sur l&apos;IA.
            <br />
            Puis <Em onDark>booste ton référencement</Em>.
          </h2>

          <p className="mt-7 max-w-[54ch] text-[1.0625rem] leading-[1.65] text-ink-invert-soft">
            On scanne les quatre moteurs sur les questions de ton secteur, on te
            dit exactement où tu te situes — et on te remonte dans les réponses.
            Trente minutes, sans engagement.
          </p>

          <div className="mt-11">
            <Button href="#test" size="lg" className="px-9">
              Lancer mon audit de visibilité
            </Button>
          </div>

          <p className="mt-6 text-[0.8125rem] text-ink-invert-soft">
            Réponse sous 48 h · Données hébergées en Europe
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
