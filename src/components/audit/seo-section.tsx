import { IconCheck } from "@/components/ui/icons";
import { CATALOG, formatPrice } from "@/lib/catalog";
import type { StoredAudit } from "@/lib/audit/store";
import { LockIcon, TierBadge } from "./lock";
import { Offer } from "./plan-section";
import { SeoPanel } from "./seo-panel";

/**
 * L'audit technique du site, vendu avec le plan d'action.
 *
 * Il n'est proposé que si on peut le livrer : sans domaine, il n'y a rien à
 * analyser, donc rien à vendre. Le bouton disparaît et la page dit pourquoi.
 */
export function SeoSection({
  audit,
  signedIn,
}: {
  audit: StoredAudit;
  signedIn: boolean;
}) {
  const unlocked = audit.access.seo;

  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">
          Audit technique du site (SEO + GEO)
        </h2>
        <TierBadge tone={unlocked ? "free" : "paid"}>
          {unlocked ? (
            <IconCheck className="h-3 w-3" />
          ) : (
            <LockIcon className="h-3 w-3" />
          )}
          {unlocked
            ? "Débloqué"
            : formatPrice(CATALOG.audit_seo_geo.amountCents)}
        </TierBadge>
      </div>

      <div className="px-6 py-7 sm:px-9">
        {unlocked ? (
          audit.domain ? (
            <SeoPanel auditId={audit.id} initial={audit.seo} />
          ) : (
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
              Cet audit a été lancé sans domaine : il n’y a pas de site à
              analyser. Relance un audit en indiquant ton adresse web.
            </p>
          )
        ) : audit.domain ? (
          <Offer
            sku="audit_seo_geo"
            auditId={audit.id}
            signedIn={signedIn}
            featured
            pitch={`Le plan d’action GEO, plus l’analyse technique de ${audit.domain} : ce qui, dans le site lui-même, empêche les moteurs de te citer.`}
            bullets={[
              "L’accès des robots de réponse : GPTBot, ClaudeBot, PerplexityBot, Google-Extended, un par un",
              "Balises, titres, données structurées, canonique, langue",
              "Contenu lisible sans JavaScript, sitemap, llms.txt",
              "Tout le plan d’action GEO est compris",
            ]}
          />
        ) : (
          <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
            L’audit technique n’est pas proposé ici : cet audit a été lancé sans
            adresse de site, donc il n’y a rien à analyser. Relance un audit en
            indiquant ton domaine pour y avoir accès.
          </p>
        )}
      </div>
    </section>
  );
}
