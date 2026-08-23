import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";

const POINTS = [
  {
    icon: LeverIcon,
    label: "Transparence",
    body: "Le GEO, c'est 80 % de stratégie, 20 % de technique — on te montre chaque levier.",
  },
  {
    icon: ShieldIcon,
    label: "Souveraineté",
    body: "Tes données restent en Europe. RGPD, hébergement souverain.",
  },
  {
    icon: ChiselIcon,
    label: "Exécution",
    body: "Un builder, pas un cabinet : on installe, on ne fait pas que des slides.",
  },
];

export function Trust() {
  return (
    <section className="border-b border-line bg-bg">
      <Container>
        <div className="py-20 lg:py-24">
          <Eyebrow index="06">Réassurance</Eyebrow>

          <h2 className="mt-7 max-w-[16ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
            Pas de magie. De la <Em>méthode</Em>.
          </h2>

          <ul className="mt-14 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-3">
            {POINTS.map(({ icon: Icon, label, body }) => (
              <li key={label} className="bg-surface p-8 lg:p-10">
                <Icon />
                <p className="eyebrow mt-7 text-cobalt">{label}</p>
                <p className="mt-3 text-[1.0625rem] leading-[1.6] text-ink">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

const svg = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  className: "h-8 w-8 text-ink",
} as const;

/** Le levier : 80 % de stratégie, 20 % de technique. */
function LeverIcon() {
  return (
    <svg {...svg} aria-hidden="true">
      <path d="M3 21 27 9" strokeLinecap="square" />
      <path d="m16 19 3 6h-6l3-6Z" />
      <path d="M27 6v6" strokeLinecap="square" />
    </svg>
  );
}

/** Le bouclier : données en Europe. */
function ShieldIcon() {
  return (
    <svg {...svg} aria-hidden="true">
      <path d="M16 4 5 8v8c0 6 4.6 10 11 12 6.4-2 11-6 11-12V8L16 4Z" />
      <path d="M11 16h10M16 11v10" strokeLinecap="square" />
    </svg>
  );
}

/** Le ciseau : on installe, on ne fait pas que des slides. */
function ChiselIcon() {
  return (
    <svg {...svg} aria-hidden="true">
      <path d="M20 4 28 12 14 26H6v-8L20 4Z" />
      <path d="m17 7 8 8" strokeLinecap="square" />
    </svg>
  );
}
