import { IconCheck } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/checkout-button";
import { CATALOG, formatPrice, type Sku } from "@/lib/catalog";
import type { Action } from "@/lib/audit/plan";
import { LockIcon, Masked, TierBadge } from "./lock";

/**
 * Le plan d'action, payant.
 *
 * Deux règles tenues ici : rien du contenu payé n'est envoyé au navigateur
 * tant qu'il n'est pas payé, et rien n'est proposé à la vente quand l'audit
 * n'a rien mesuré — on ne facture pas un rapport construit sur du vide.
 */
export function PlanSection({
  plan,
  auditId,
  sellable,
  signedIn,
}: {
  plan: Action[] | null;
  auditId: string;
  sellable: boolean;
  signedIn: boolean;
}) {
  if (!sellable) {
    return (
      <section className="rounded-md border border-line bg-surface px-6 py-8 sm:px-9">
        <h2 className="text-[1.5rem] leading-snug">Rien à vendre sur cet audit</h2>
        <p className="mt-4 max-w-[60ch] text-[1rem] leading-relaxed text-ink-soft">
          Aucun moteur n’a pu être interrogé, donc il n’y a aucun constat sur
          lequel bâtir un plan d’action. Les rapports payants sont retirés de
          cette page : ils n’auraient rien à te dire.
        </p>
      </section>
    );
  }

  const unlocked = plan !== null;

  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Plan d’action</h2>
        <TierBadge tone={unlocked ? "free" : "paid"}>
          {unlocked ? (
            <IconCheck className="h-3 w-3" />
          ) : (
            <LockIcon className="h-3 w-3" />
          )}
          {unlocked ? "Débloqué" : formatPrice(CATALOG.report_geo.amountCents)}
        </TierBadge>
      </div>

      <div className="px-6 py-7 sm:px-9">
        {unlocked ? (
          plan.length > 0 ? (
            <ActionList actions={plan} />
          ) : (
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
              Aucune action à recommander sur cet audit.
            </p>
          )
        ) : (
          <Offer
            sku="report_geo"
            auditId={auditId}
            signedIn={signedIn}
            pitch="Ce qu’il faut corriger pour être cité, déduit de tes résultats : qui occupe la place sur tes questions, pourquoi, et dans quel ordre reprendre la main."
            bullets={[
              "Les actions classées par priorité, chacune avec le constat qui la justifie",
              "Les domaines qui sortent à ta place, comptés sur tes six questions",
              "Le plan de contenu : les questions où tu n’apparais pas, reprises telles quelles",
            ]}
          />
        )}
      </div>
    </section>
  );
}

function ActionList({ actions }: { actions: Action[] }) {
  return (
    <ol className="space-y-8">
      {actions.map((action, i) => (
        <li
          key={action.title}
          className={`border-l-2 pl-5 ${
            action.priority === "haute" ? "border-cobalt" : "border-line-strong"
          }`}
        >
          <p className="eyebrow text-absent">
            {i + 1} — Priorité {action.priority}
          </p>
          <h3 className="mt-2 text-[1.1875rem] leading-snug">{action.title}</h3>
          <p className="mt-2.5 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink-soft">
            {action.body}
          </p>
          <p className="mt-3 border-t border-line pt-3 text-[0.8125rem] leading-relaxed text-absent">
            <span className="font-display font-semibold text-ink-soft">
              Constat :
            </span>{" "}
            {action.evidence}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** L'offre : ce qu'on achète, et la silhouette de ce qu'on recevra. */
export function Offer({
  sku,
  auditId,
  signedIn,
  pitch,
  bullets,
  featured = false,
}: {
  sku: Sku;
  auditId: string;
  signedIn: boolean;
  pitch: string;
  bullets: string[];
  featured?: boolean;
}) {
  const product = CATALOG[sku];
  const price = formatPrice(product.amountCents);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="min-w-0 lg:col-span-7">
        <p className="max-w-[58ch] text-[1rem] leading-relaxed text-ink-soft">
          {pitch}
        </p>
        <ul className="mt-6 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-[0.9375rem] leading-snug">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
              <span className="text-ink-soft">{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="mt-7">
          <Masked className="max-h-40">
            <ol className="space-y-6" aria-hidden="true">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="border-l-2 border-line-strong pl-5">
                  <span className="block h-2.5 w-24 rounded-full bg-line" />
                  <span className="mt-3 block h-3 w-64 rounded-full bg-line" />
                  <span className="mt-2.5 block h-2.5 w-full rounded-full bg-line" />
                  <span className="mt-2 block h-2.5 w-3/4 rounded-full bg-line" />
                </li>
              ))}
            </ol>
          </Masked>
        </div>
      </div>

      <div
        className={`min-w-0 rounded-sm border p-7 lg:col-span-5 ${
          featured ? "border-cobalt" : "border-line"
        }`}
      >
        <h3 className="text-[1.25rem] leading-snug">{product.name}</h3>
        <p className="mt-3">
          <span className="font-display text-[2rem] font-extrabold leading-none tabular-nums text-ink">
            {price}
          </span>
          <span className="ml-2 text-[0.8125rem] text-absent">paiement unique</span>
        </p>

        <div className="mt-6">
          {signedIn ? (
            <CheckoutButton
              sku={sku}
              auditId={auditId}
              label={`Débloquer pour ${price}`}
              variant={featured ? "primary" : "outline"}
            />
          ) : (
            <Button href="#compte" variant={featured ? "primary" : "outline"} className="w-full">
              Crée ton compte pour acheter
            </Button>
          )}
        </div>

        <p className="mt-4 text-[0.8125rem] leading-relaxed text-absent">
          Rattaché à cet audit. Tu le retrouveras dans ton espace, avec
          l’historique.
        </p>
      </div>
    </div>
  );
}
