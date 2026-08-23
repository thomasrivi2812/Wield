import { Button, QuietLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";
import { IconCheck } from "@/components/ui/icons";

type Offer = {
  badge: string;
  name: string;
  tagline: string;
  format: string;
  points: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const OFFERS: Offer[] = [
  {
    badge: "Le socle",
    name: "Wield Radar",
    tagline:
      "Visibilité IA. On te rend recommandé par les moteurs de réponse. Suivi mensuel.",
    format: "Abonnement mensuel",
    points: [
      "Audit de citation sur tes prompts métier",
      "Optimisation du contenu et des données",
      "Rapport mensuel, IA par IA",
    ],
    cta: "Demander l'audit gratuit",
    href: "/#test",
    featured: true,
  },
  {
    badge: "L'accompagnement",
    name: "Wield Studio",
    tagline:
      "Accompagnement sur mesure. On installe l'IA utile dans ton équipe.",
    format: "Mission sur devis",
    points: [
      "Diagnostic des usages réels de l'équipe",
      "Mise en place des outils qui servent",
      "Formation courte, en situation",
    ],
    cta: "Parler d'un accompagnement",
    href: "/quiz",
  },
  {
    badge: "L'entrée",
    name: "Wield Playbooks + Brief",
    tagline:
      "La doc et la veille. Guides par métier + comparateur de prix des IA, tenu à jour.",
    format: "À l'unité + veille",
    points: [
      "Guides pratiques, un par métier",
      "Comparateur de prix des IA, à jour",
      "Le Brief : la veille qui va à l'essentiel",
    ],
    cta: "Voir la bibliothèque",
    href: "/guides",
  },
];

export function Offers() {
  return (
    <section id="offres" className="scroll-mt-20 border-b border-line bg-surface">
      <Container>
        <div className="py-20 lg:py-24">
          <Eyebrow>Les offres</Eyebrow>

          <h2 className="mt-7 max-w-[18ch] text-[2.5rem] leading-[1.04] sm:text-[3rem] lg:text-[3.5rem]">
            Trois façons de <Em>travailler</Em> avec Wield
          </h2>

          <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
            {OFFERS.map((offer) => (
              <OfferCard key={offer.name} offer={offer} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const dark = Boolean(offer.featured);

  return (
    <article
      className={
        dark
          ? "relative flex flex-col rounded-md border border-slate bg-slate p-8 text-ink-invert lg:-mt-4 lg:p-10 lg:pb-10 shadow-[0_28px_70px_-40px_rgba(21,23,28,0.6)]"
          : "relative flex flex-col rounded-md border border-line bg-surface p-8 lg:p-10"
      }
    >
      <div className="flex items-center justify-between gap-4">
        <span
          className={
            dark
              ? "eyebrow rounded-xs bg-cobalt px-2.5 py-1.5 text-white"
              : "eyebrow rounded-xs border border-line px-2.5 py-1.5 text-ink-soft"
          }
        >
          {offer.badge}
        </span>
        <span
          className={
            dark
              ? "shrink-0 whitespace-nowrap text-[0.75rem] text-cobalt-light"
              : "shrink-0 whitespace-nowrap text-[0.75rem] text-absent"
          }
        >
          {offer.format}
        </span>
      </div>

      <h3
        className={`mt-8 text-[1.75rem] leading-tight ${dark ? "text-ink-invert" : "text-ink"}`}
      >
        {offer.name}
      </h3>

      <p
        className={`mt-4 text-[0.9375rem] leading-[1.65] ${
          dark ? "text-ink-invert-soft" : "text-ink-soft"
        }`}
      >
        {offer.tagline}
      </p>

      <ul className="mt-8 space-y-3.5">
        {offer.points.map((point) => (
          <li key={point} className="flex gap-3 text-[0.9375rem] leading-snug">
            <IconCheck
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                dark ? "text-cobalt-light" : "text-cobalt"
              }`}
            />
            <span className={dark ? "text-ink-invert-soft" : "text-ink-soft"}>
              {point}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-10">
        {dark ? (
          <Button href={offer.href} size="lg" className="w-full">
            {offer.cta}
          </Button>
        ) : (
          <QuietLink href={offer.href}>{offer.cta}</QuietLink>
        )}
      </div>
    </article>
  );
}
