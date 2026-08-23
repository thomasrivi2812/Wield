"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { IconCheck, IconCross } from "@/components/ui/icons";
import { AuthPanel } from "./auth-panel";
import { LockIcon, Masked, TierBadge } from "./lock";
import { ACTIONS, ENGINES, PROMPTS, SEO_CHECKS } from "./data";

type Phase = "scanning" | "ready";

export function AuditFlow({ query }: { query: string }) {
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanned, setScanned] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [purchased, setPurchased] = useState<null | "geo" | "full">(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    ENGINES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setScanned(i + 1), 520 * (i + 1)));
    });
    timers.current.push(
      setTimeout(() => setPhase("ready"), 520 * ENGINES.length + 400),
    );
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const score = ENGINES.filter((e) => e.cited).length;
  const revealed = phase === "ready" ? ENGINES.length : scanned;

  return (
    <div className="bg-bg">
      <Container>
        <div className="flex flex-col gap-6 py-14 lg:py-20">
          <Header query={query} phase={phase} />

          <ScoreCard
            score={score}
            revealed={revealed}
            phase={phase}
            engines={ENGINES}
          />

          <ReportCard signedIn={signedIn} onSignedIn={() => setSignedIn(true)} />

          <PaidTiers purchased={purchased} onBuy={setPurchased} />
        </div>
      </Container>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header({ query, phase }: { query: string; phase: Phase }) {
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
        {phase === "scanning"
          ? "Interrogation de ChatGPT, Claude, Perplexity et Gemini sur six questions de ton secteur…"
          : "Six questions posées aux quatre moteurs de réponse, à l’instant."}
      </p>
    </div>
  );
}

/* Niveau 0 — libre, sans compte : le score. C’est l’hameçon. */
function ScoreCard({
  score,
  revealed,
  phase,
  engines,
}: {
  score: number;
  revealed: number;
  phase: Phase;
  engines: typeof ENGINES;
}) {
  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Score de citation</h2>
        <TierBadge tone="free">
          <IconCheck className="h-3 w-3" />
          Libre d’accès
        </TierBadge>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 sm:px-9">
        <p className="font-display text-[3.5rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-[4.5rem]">
          <span className={phase === "ready" ? "text-cobalt" : "text-absent"}>
            {phase === "ready" ? score : "—"}
          </span>
          <span className="text-absent">/{engines.length}</span>
        </p>
        <div className="flex gap-1.5" aria-hidden="true">
          {engines.map((engine, i) => (
            <span
              key={engine.name}
              className={`h-1.5 w-14 rounded-full transition-colors duration-300 ${
                i < revealed
                  ? engine.cited
                    ? "bg-present"
                    : "bg-absent"
                  : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <ul className="mt-8 px-6 pb-2 sm:px-9">
        {engines.map((engine, i) => {
          const shown = i < revealed;
          return (
            <li
              key={engine.name}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-4"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border transition-colors ${
                  !shown
                    ? "border-line text-line-strong"
                    : engine.cited
                      ? "border-cobalt bg-cobalt text-white"
                      : "border-line-strong text-absent"
                }`}
              >
                {shown ? (
                  engine.cited ? (
                    <IconCheck className="h-3.5 w-3.5" />
                  ) : (
                    <IconCross className="h-3.5 w-3.5" />
                  )
                ) : (
                  <span className="h-1 w-1 rounded-full bg-current" />
                )}
              </span>

              <span className="font-display text-[1.0625rem] font-semibold">
                {engine.name}
              </span>

              <span
                className={`ml-auto text-right text-[0.875rem] ${
                  shown && engine.cited ? "text-cobalt" : "text-absent"
                }`}
              >
                {!shown
                  ? "analyse…"
                  : engine.cited
                    ? `Cité — ${engine.detail}`
                    : "Absent"}
              </span>
            </li>
          );
        })}
      </ul>

      {phase === "ready" ? (
        <p className="border-t border-line px-6 py-5 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-9">
          <span className="font-display font-semibold text-ink">
            Trois moteurs sur quatre ne te connaissent pas.
          </span>{" "}
          Le détail est juste en dessous.
        </p>
      ) : null}
    </section>
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
              <AuthPanel onSignedIn={onSignedIn} />
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
          name="Plan d’action GEO"
          price="2,99 €"
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
          name="Audit SEO + GEO"
          price="10 €"
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
  name,
  price,
  note,
  pitch,
  bullets,
  preview,
  unlocked,
  onBuy,
  featured = false,
}: {
  name: string;
  price: string;
  note: string;
  pitch: string;
  bullets: string[];
  preview: React.ReactNode;
  unlocked: boolean;
  onBuy: () => void;
  featured?: boolean;
}) {
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
          <Button
            onClick={onBuy}
            size="lg"
            variant={featured ? "primary" : "outline"}
            className="w-full"
          >
            <LockIcon className="h-4 w-4" />
            Débloquer pour {price}
          </Button>
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
