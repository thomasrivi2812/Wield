import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { IconArrow } from "@/components/ui/icons";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
      />
    </svg>
  );
}

const COLUMNS = [
  {
    title: "Offres",
    links: [
      { label: "Radar", href: "/#offres" },
      { label: "Studio", href: "/#offres" },
      { label: "Playbooks", href: "/guides" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Le Brief", href: "/guides#brief" },
      { label: "Comparateur de prix des IA", href: "/guides#brief" },
      { label: "Guides par métier", href: "/guides" },
    ],
  },
  {
    title: "Wield",
    links: [
      { label: "C\u2019est quoi le GEO", href: "#geo" },
      { label: "Contact", href: "/infrastructure" },
      { label: "Mentions légales", href: "#" },
    ],
  },
];

export function SiteFooter({ showInfra = true }: { showInfra?: boolean }) {
  return (
    <footer id="brief" className="scroll-mt-20 bg-slate text-ink-invert">
      <Container>
        {/* L'offre infrastructure : la porte d'à côté */}
        {showInfra ? (
        <Link
          href="/infrastructure"
          className="group flex flex-col gap-6 border-t border-line-invert py-10 transition-colors hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between md:gap-10"
        >
          <div>
            <p className="eyebrow text-cobalt-light">Aussi chez Wield</p>
            <p className="mt-4 max-w-[30ch] font-display text-[1.5rem] font-bold leading-[1.2] tracking-[-0.03em] text-ink-invert sm:text-[1.75rem]">
              Crée l&apos;infrastructure web de ta boîte, à prix réduit
            </p>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <p className="max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink-invert-soft md:text-right">
              E-commerce, landing page, site métier. Tu décris ton besoin en
              deux minutes, tu reçois un plan d&apos;action et un devis sous
              48&nbsp;h.
            </p>
            <span className="inline-flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-cobalt-light">
              Décrire mon besoin
              <ArrowIcon />
            </span>
          </div>
        </Link>
        ) : null}

        {/* Capture e-mail */}
        <div className="grid gap-10 border-t border-line-invert py-16 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="text-[1.75rem] leading-tight sm:text-[2rem]">
              Reçois le Brief Wield
            </h2>
            <p className="mt-4 max-w-[42ch] text-[0.9375rem] leading-[1.65] text-ink-invert-soft">
              Ce qui bouge vraiment sur les moteurs de réponse, les prix des IA
              et les usages qui marchent. Une fois par semaine, court.
            </p>

            <form className="mt-7 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="brief-email" className="sr-only">
                Ton adresse e-mail
              </label>
              <input
                id="brief-email"
                type="email"
                name="email"
                placeholder="prenom@ta-pme.fr"
                className="h-12 flex-1 rounded-sm border border-line-invert bg-slate-soft px-4 text-[0.9375rem] text-ink-invert placeholder:text-[#6b6f78] focus:border-cobalt-light focus:outline-none"
              />
              <button
                type="submit"
                className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-sm bg-cobalt px-6 font-display font-semibold text-white transition-colors hover:bg-cobalt-hover active:translate-y-px"
              >
                S&apos;abonner
                <IconArrow className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </form>

            <p className="mt-3 text-[0.75rem] text-ink-invert-soft">
              Désinscription en un clic. Aucune donnée revendue.
            </p>
          </div>

          {/* Colonnes de liens */}
          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="eyebrow text-ink-invert-soft">{column.title}</p>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="link-rule text-[0.9375rem] text-ink-invert transition-colors hover:text-cobalt-light"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Barre basse */}
        <div className="flex flex-col gap-4 border-t border-line-invert py-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo onDark />
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-ink-invert-soft">
            <span>© {new Date().getFullYear()} Wield</span>
            <span aria-hidden="true" className="h-3 w-px bg-line-invert" />
            <span>Hébergement et données en Europe</span>
            <span aria-hidden="true" className="h-3 w-px bg-line-invert" />
            <Link href="#" className="link-rule transition-colors hover:text-ink-invert">
              Confidentialité
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
