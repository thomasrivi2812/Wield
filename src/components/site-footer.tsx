import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { IconArrow } from "@/components/ui/icons";

const COLUMNS = [
  {
    title: "Offres",
    links: [
      { label: "Radar", href: "#offres" },
      { label: "Studio", href: "#offres" },
      { label: "Playbooks", href: "#offres" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Le Brief", href: "#brief" },
      { label: "Comparateur de prix des IA", href: "#brief" },
      { label: "Guides par métier", href: "#offres" },
    ],
  },
  {
    title: "Wield",
    links: [
      { label: "C\u2019est quoi le GEO", href: "#geo" },
      { label: "Contact", href: "#cta" },
      { label: "Mentions légales", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer id="brief" className="scroll-mt-20 bg-slate text-ink-invert">
      <Container>
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
                        className="text-[0.9375rem] text-ink-invert transition-colors hover:text-cobalt-light"
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
            <Link href="#" className="transition-colors hover:text-ink-invert">
              Confidentialité
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
