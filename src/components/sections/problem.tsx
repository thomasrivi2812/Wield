import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";

export function Problem() {
  return (
    <section
      id="probleme"
      className="relative scroll-mt-20 overflow-hidden bg-slate text-ink-invert"
    >
      <div
        aria-hidden="true"
        className="grid-hairline pointer-events-none absolute inset-0"
      />
      <Container className="relative">
        <div className="grid gap-14 py-20 lg:grid-cols-12 lg:gap-16 lg:py-28">
          <div className="lg:col-span-7">
            <Eyebrow onDark>
              Le problème
            </Eyebrow>

            <h2 className="mt-7 text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.75rem]">
              Le SEO <Em onDark>ne suffit plus</Em>.
            </h2>

            <p className="mt-8 max-w-[56ch] text-[1.0625rem] leading-[1.75] text-ink-invert-soft">
              Tes clients ne parcourent plus 10 liens sur Google. Ils demandent à
              une IA, qui répond en citant quelques sources — et garde le clic.{" "}
              <strong className="font-display text-[1.375rem] leading-none font-bold text-cobalt-light">
                47&nbsp;%
              </strong>{" "}
              des acheteurs B2B utilisent déjà l&apos;IA pour choisir un
              prestataire.
            </p>

            <p className="mt-7 max-w-[24ch] font-display text-[1.5rem] font-semibold leading-[1.25] text-ink-invert sm:text-[1.75rem]">
              Si tu n&apos;es pas dans la réponse, tu n&apos;existes plus.
            </p>
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <BeforeAfter />
          </div>
        </div>
      </Container>
    </section>
  );
}

function BeforeAfter() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line-invert bg-[rgba(246,247,249,0.14)]">
      {/* Hier */}
      <div className="bg-slate p-6">
        <p className="eyebrow text-ink-invert-soft">Hier · Google</p>
        <div className="mt-6 space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div
                className="h-1 rounded-full bg-[rgba(246,247,249,0.28)]"
                style={{ width: `${88 - i * 6}%` }}
              />
              <div
                className="h-1 rounded-full bg-[rgba(246,247,249,0.12)]"
                style={{ width: `${70 - i * 5}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-6 text-[0.8125rem] leading-snug text-ink-invert-soft">
          Dix liens. Tu avais une place à prendre.
        </p>
      </div>

      {/* Aujourd'hui */}
      <div className="bg-slate p-6">
        <p className="eyebrow text-cobalt-light">Aujourd&apos;hui · IA</p>
        <div className="mt-6 rounded-xs border border-line-invert bg-slate-soft p-4">
          <div className="space-y-2">
            <div className="h-1 w-full rounded-full bg-[rgba(246,247,249,0.3)]" />
            <div className="h-1 w-[92%] rounded-full bg-[rgba(246,247,249,0.3)]" />
            <div className="h-1 w-[78%] rounded-full bg-[rgba(246,247,249,0.3)]" />
            <div className="h-1 w-[86%] rounded-full bg-[rgba(246,247,249,0.3)]" />
          </div>
          <div className="mt-5 space-y-2 border-t border-line-invert pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cobalt-light" />
                <span className="h-1 flex-1 rounded-full bg-[rgba(125,146,242,0.35)]" />
              </div>
            ))}
          </div>
        </div>
        <p className="mt-6 text-[0.8125rem] leading-snug text-ink-invert-soft">
          Une réponse. Trois sources citées. C&apos;est tout.
        </p>
      </div>
    </div>
  );
}
