"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { IconCheck, IconCross } from "@/components/ui/icons";
import { AuthPanel } from "./auth-panel";
import { LockIcon, Masked, TierBadge } from "./lock";
import { ACTIONS, PROMPTS, SEO_CHECKS } from "./data";
import { anonId } from "@/lib/anon-id";
import { CheckoutButton } from "@/components/checkout-button";
import { CATALOG, formatPrice, type Sku } from "@/lib/catalog";
import {
  isUnmeasured,
  requestAudit,
  type AuditState,
  type AuditView,
  type EngineView,
} from "./api";

export function AuditFlow({
  query,
  domain,
}: {
  query: string;
  domain?: string;
}) {
  const [state, setState] = useState<AuditState>({ phase: "scanning" });
  const [signedIn, setSignedIn] = useState(false);
  const [purchased, setPurchased] = useState<null | "geo" | "full">(null);

  useEffect(() => {
    const controller = new AbortController();

    requestAudit({ query, domain, anonId: anonId() }, controller.signal)
      .then((data) => setState({ phase: "done", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          phase: "error",
          message:
            error instanceof Error
              ? error.message
              : "L\u2019audit a \u00e9chou\u00e9.",
        });
      });

    return () => controller.abort();
  }, [query, domain]);

  return (
    <div className="bg-bg">
      <Container>
        <div className="flex flex-col gap-6 py-14 lg:py-20">
          <Header query={query} state={state} />

          {state.phase === "error" ? (
            <ErrorCard message={state.message} />
          ) : (
            <ScoreCard state={state} />
          )}

          <ReportCard signedIn={signedIn} onSignedIn={() => setSignedIn(true)} />

          <PaidTiers purchased={purchased} onBuy={setPurchased} />
        </div>
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header({ query, state }: { query: string; state: AuditState }) {
  const note =
    state.phase === "scanning"
      ? "Interrogation des moteurs de r\u00e9ponse sur six questions de ton secteur\u2026"
      : state.phase === "error"
        ? "L\u2019audit n\u2019a pas pu aboutir."
        : `Six questions pos\u00e9es \u00e0 ${state.data.measuredCount || "aucun"} moteur${state.data.measuredCount > 1 ? "s" : ""} de r\u00e9ponse, \u00e0 l\u2019instant.`;

  return (
    <div className="flex flex-col gap-5 border-b border-line pb-8">
      <p className="eyebrow flex items-center gap-3 text-ink-soft">
        <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
        Audit de visibilité IA
      </p>

      <h1 className="text-[2.125rem] leading-[1.06] sm:text-[2.75rem] lg:text-[3.25rem]">
        {query}
      </h1>

      <p
        className="text-[0.9375rem] text-ink-soft"
        aria-live="polite"
        aria-atomic="true"
      >
        {note}
      </p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-line bg-surface p-8 sm:p-10">
      <h2 className="text-[1.5rem] leading-snug">L’audit n’a pas abouti</h2>
      <p className="mt-4 max-w-[56ch] text-[1rem] leading-relaxed text-ink-soft">
        {message}
      </p>
      <div className="mt-7">
        <Button href="/#test" variant="outline" size="md">
          Relancer un audit
        </Button>
      </div>
    </section>
  );
}

/* Niveau 0 — libre, sans compte : le score. C’est l’hameçon. */
function ScoreCard({ state }: { state: AuditState }) {
  const data = state.phase === "done" ? state.data : null;
  const scanning = state.phase === "scanning";

  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Score de citation</h2>
        <TierBadge tone="free">
          <IconCheck className="h-3 w-3" />
          Libre d’accès
        </TierBadge>
      </div>

      {data?.mode === "demo" ? (
        <p className="border-b border-line bg-cobalt-soft px-6 py-3 text-[0.8125rem] leading-relaxed text-cobalt sm:px-9">
          Aucun moteur n’est branché pour l’instant : ce résultat est une
          démonstration. Les moteurs non mesurés sont signalés comme tels, jamais
          comptés comme absents.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 sm:px-9">
        <div>
          <p className="font-display text-[3.5rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-[4.5rem]">
            <span
              className={
                data && data.measuredCount > 0 ? "text-cobalt" : "text-absent"
              }
            >
              {data && data.measuredCount > 0 ? data.citedCount : "—"}
            </span>
            <span className="text-absent">
              /{data && data.measuredCount > 0 ? data.measuredCount : "—"}
            </span>
          </p>
          <p className="mt-3 text-[0.8125rem] text-ink-soft">
            {data && data.measuredCount > 0
              ? `moteurs qui te citent, sur ${data.measuredCount} mesuré${data.measuredCount > 1 ? "s" : ""}`
              : "moteurs qui te citent, sur ceux réellement mesurés"}
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden="true">
          {(data?.engines ?? PLACEHOLDER).map((engine, i) => (
            <span
              key={engine.engine ?? i}
              className={`h-1.5 w-14 rounded-full transition-colors duration-300 ${
                !data
                  ? "bg-line"
                  : engine.status === "cited"
                    ? "bg-present"
                    : engine.status === "absent"
                      ? "bg-absent"
                      : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <ul className="mt-8 px-6 pb-2 sm:px-9">
        {(data?.engines ?? PLACEHOLDER).map((engine, i) => (
          <EngineRow
            key={engine.engine ?? i}
            engine={engine}
            scanning={scanning}
          />
        ))}
      </ul>

      {data ? (
        <p className="border-t border-line px-6 py-5 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-9">
          {data.measuredCount === 0 ? (
            "Aucun moteur n’a pu être interrogé. Le détail par moteur est juste au-dessus."
          ) : data.citedCount === 0 ? (
            <>
              <span className="font-display font-semibold text-ink">
                Aucun des moteurs mesurés ne te connaît.
              </span>{" "}
              Le détail est juste en dessous.
            </>
          ) : (
            <>
              <span className="font-display font-semibold text-ink">
                {data.citedCount} moteur{data.citedCount > 1 ? "s" : ""} sur{" "}
                {data.measuredCount} te cite
                {data.citedCount > 1 ? "nt" : ""}.
              </span>{" "}
              Le détail est juste en dessous.
            </>
          )}
        </p>
      ) : null}
    </section>
  );
}

/** Squelette affiché pendant le scan, avant toute réponse. */
const PLACEHOLDER = [
  { engine: "chatgpt", label: "ChatGPT" },
  { engine: "claude", label: "Claude" },
  { engine: "perplexity", label: "Perplexity" },
  { engine: "gemini", label: "Gemini" },
] as Array<Partial<EngineView> & { engine: string; label: string }>;

function EngineRow({
  engine,
  scanning,
}: {
  engine: Partial<EngineView> & { engine: string; label: string };
  scanning: boolean;
}) {
  const status = engine.status;
  const cited = status === "cited";
  const absent = status === "absent";
  const unmeasured = status ? isUnmeasured(status) : false;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-4">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border transition-colors ${
          cited
            ? "border-cobalt bg-cobalt text-white"
            : absent
              ? "border-line-strong text-absent"
              : "border-line text-line-strong"
        }`}
      >
        {cited ? (
          <IconCheck className="h-3.5 w-3.5" />
        ) : absent ? (
          <IconCross className="h-3.5 w-3.5" />
        ) : (
          <span className="h-1 w-1 rounded-full bg-current" />
        )}
      </span>

      <span className="font-display text-[1.0625rem] font-semibold">
        {engine.label}
      </span>

      <span
        className={`ml-auto text-right text-[0.875rem] ${
          cited ? "text-cobalt" : "text-absent"
        }`}
      >
        {scanning || !status
          ? "analyse…"
          : cited
            ? `Cité — ${engine.detail}`
            : absent
              ? "Absent"
              : unmeasured
                ? `Non mesuré — ${engine.detail}`
                : `Erreur — ${engine.detail}`}
      </span>
    </li>
  );
}

/* Niveau 1 — gratuit contre compte : le diagnostic. */
function ReportCard({
  signedIn,
  onSignedIn,
}: {
  signedIn: boolean;
  onSignedIn: () => void;
}) {
  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Rapport GEO — les six prompts</h2>
        <TierBadge tone="free">
          {signedIn ? (
            <IconCheck className="h-3 w-3" />
          ) : (
            <LockIcon className="h-3 w-3" />
          )}
          Gratuit avec un compte
        </TierBadge>
      </div>

      <div className="px-6 py-7 sm:px-9">
        {signedIn ? (
          <PromptTable />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-7">
              <Masked className="max-h-[26rem]">
                <PromptTable />
              </Masked>
            </div>
            <div className="min-w-0 lg:col-span-5">
              <AuthPanel next="/espace" onDemoSignIn={onSignedIn} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PromptTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="eyebrow pb-3 pr-6 text-ink-soft">
              Question posée
            </th>
            <th scope="col" className="eyebrow pb-3 pr-6 text-ink-soft">
              Qui est cité
            </th>
            <th scope="col" className="eyebrow pb-3 text-right text-ink-soft">
              Toi
            </th>
          </tr>
        </thead>
        <tbody>
          {PROMPTS.map((row) => (
            <tr key={row.prompt} className="border-b border-line last:border-b-0">
              <td className="max-w-[24rem] py-4 pr-6 text-[0.9375rem] leading-snug text-ink">
                {row.prompt}
              </td>
              <td className="py-4 pr-6 text-[0.875rem] leading-snug text-ink-soft">
                {row.winners.join(" · ")}
              </td>
              <td className="py-4 text-right">
                <span
                  className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium ${
                    row.cited ? "text-cobalt" : "text-absent"
                  }`}
                >
                  {row.cited ? (
                    <IconCheck className="h-3.5 w-3.5" />
                  ) : (
                    <IconCross className="h-3.5 w-3.5" />
                  )}
                  {row.cited ? "Cité" : "Absent"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Niveaux 2 et 3 — payants : le plan d’action, puis le SEO en plus. */
function PaidTiers({
  purchased,
  onBuy,
}: {
  purchased: null | "geo" | "full";
  onBuy: (tier: "geo" | "full") => void;
}) {
  const geoUnlocked = purchased !== null;
  const fullUnlocked = purchased === "full";

  return (
    <section className="mt-4">
      <div className="flex flex-col gap-3 border-b border-line pb-6">
        <h2 className="text-[1.75rem] leading-tight sm:text-[2rem]">
          Le diagnostic est posé. Passe à l’action.
        </h2>
        <p className="max-w-[60ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          Savoir que tu es absent ne suffit pas. Ces deux rapports te disent quoi
          corriger, dans quel ordre, et pourquoi.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TierCard
          sku="report_geo"
          note="paiement unique"
          pitch="Ce qu’il faut corriger pour être cité, priorisé par impact."
          bullets={[
            "4 actions classées par priorité",
            "Le détail page par page",
            "Export PDF à partager en interne",
          ]}
          unlocked={geoUnlocked}
          onBuy={() => onBuy("geo")}
          preview={<ActionList />}
        />

        <TierCard
          sku="audit_seo_geo"
          note="paiement unique"
          pitch="Le plan d’action GEO, plus l’audit technique de ton site."
          bullets={[
            "Tout le plan d’action GEO",
            "Audit technique SEO : balises, structure, performance",
            "Données structurées et indexation",
          ]}
          featured
          unlocked={fullUnlocked}
          onBuy={() => onBuy("full")}
          preview={<SeoList />}
        />
      </div>

      <p className="mt-8 text-[0.8125rem] text-ink-soft">
        Besoin d’un suivi dans la durée plutôt que d’un rapport ?{" "}
        <a
          href="/#offres"
          className="text-cobalt underline decoration-line-strong underline-offset-2 hover:decoration-cobalt"
        >
          Wield Radar suit ta progression chaque mois.
        </a>
      </p>
    </section>
  );
}

function TierCard({
  sku,
  note,
  pitch,
  bullets,
  preview,
  unlocked,
  onBuy,
  featured = false,
}: {
  sku: Sku;
  note: string;
  pitch: string;
  bullets: string[];
  preview: React.ReactNode;
  unlocked: boolean;
  onBuy: () => void;
  featured?: boolean;
}) {
  const product = CATALOG[sku];
  const name = product.name;
  const price = formatPrice(product.amountCents);

  return (
    <article
      className={`flex flex-col rounded-md border bg-surface ${
        featured ? "border-cobalt" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-7 py-6 sm:px-8">
        <div>
          <h3 className="text-[1.375rem] leading-snug">{name}</h3>
          <p className="mt-2 max-w-[36ch] text-[0.9375rem] leading-snug text-ink-soft">
            {pitch}
          </p>
        </div>
        <p className="text-right">
          <span className="block font-display text-[1.75rem] font-extrabold leading-none tabular-nums text-ink">
            {price}
          </span>
          <span className="mt-1 block text-[0.75rem] text-absent">{note}</span>
        </p>
      </div>

      <div className="px-7 py-6 sm:px-8">
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-[0.9375rem] leading-snug">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" />
              <span className="text-ink-soft">{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7">
          {unlocked ? preview : <Masked className="max-h-52">{preview}</Masked>}
        </div>
      </div>

      <div className="mt-auto border-t border-line px-7 py-6 sm:px-8">
        {unlocked ? (
          <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-cobalt">
            <IconCheck className="h-4 w-4" />
            Débloqué
          </p>
        ) : (
          <CheckoutButton
            sku={sku}
            label={`Débloquer pour ${price}`}
            variant={featured ? "primary" : "outline"}
            onDemo={onBuy}
          />
        )}
      </div>
    </article>
  );
}

function ActionList() {
  return (
    <ul className="space-y-5">
      {ACTIONS.map((action) => (
        <li key={action.title} className="border-l-2 border-cobalt pl-4">
          <p className="eyebrow text-absent">{action.priority}</p>
          <p className="mt-1.5 font-display text-[1rem] font-semibold leading-snug text-ink">
            {action.title}
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
            {action.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

/* La gravité est portée par le mot, jamais par la seule couleur. */
const SEO_STATUS = {
  ok: { label: "Conforme", className: "text-cobalt" },
  warn: { label: "À améliorer", className: "text-ink-soft" },
  fail: { label: "Manquant", className: "font-semibold text-ink" },
} as const;

function SeoList() {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {SEO_CHECKS.map((check) => {
        const status = SEO_STATUS[check.status];
        return (
          <li
            key={check.label}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
          >
            <span className="text-[0.9375rem] text-ink">{check.label}</span>
            <span className="ml-auto text-[0.8125rem] text-ink-soft">
              {check.note}
            </span>
            <span
              className={`w-[6.5rem] shrink-0 text-right text-[0.8125rem] ${status.className}`}
            >
              {status.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
