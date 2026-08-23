"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { IconCheck, IconCross } from "@/components/ui/icons";
import { anonId } from "@/lib/anon-id";
import { ScoreCard } from "./score-card";
import { Elapsed } from "./elapsed";
import { streamAudit, type AuditEvent, type AuditView } from "./api";

/**
 * Le scan en direct.
 *
 * Rien de ce qui bouge ici n'est décoratif : chaque case qui se remplit est
 * une réponse réellement obtenue d'un moteur. Une barre qui avance toute
 * seule serait plus jolie et complètement fausse — on saurait la faire, on
 * ne saurait pas la justifier.
 *
 * Dès que l'audit est enregistré, on remplace l'URL par /audit/<id> : c'est
 * elle qui porte le résultat, et le retour de Stripe en a besoin.
 */

export type EngineRun = {
  engine: string;
  label: string;
  willQuery: boolean;
  /** Verdict par question, dans l'ordre. */
  answers: boolean[];
  status?: string;
  detail?: string;
};

export type State = {
  phase: "connecting" | "running" | "saving" | "orphan" | "error";
  promptCount: number;
  engines: EngineRun[];
  message?: string;
  result?: AuditView;
};

export const INITIAL: State = { phase: "connecting", promptCount: 6, engines: [] };

export function reduce(state: State, event: AuditEvent | { type: "failed"; message: string }): State {
  switch (event.type) {
    case "start":
      return {
        ...state,
        phase: "running",
        promptCount: event.prompts.length,
        engines: event.engines.map((e) => ({
          engine: e.engine,
          label: e.label,
          willQuery: e.willQuery,
          answers: [],
        })),
      };

    case "prompt":
      return {
        ...state,
        engines: state.engines.map((engine) =>
          engine.engine === event.engine
            ? { ...engine, answers: [...engine.answers, event.cited] }
            : engine,
        ),
      };

    case "engine":
      return {
        ...state,
        engines: state.engines.map((engine) =>
          engine.engine === event.engine
            ? { ...engine, status: event.status, detail: event.detail }
            : engine,
        ),
      };

    case "done":
      return { ...state, phase: event.id ? "saving" : "orphan", result: event };

    case "error":
    case "failed":
      return { ...state, phase: "error", message: event.message };

    default:
      return state;
  }
}

export function AuditFlow({ query, domain }: { query: string; domain?: string }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reduce, INITIAL);

  useEffect(() => {
    const controller = new AbortController();

    streamAudit({ query, domain, anonId: anonId() }, dispatch, controller.signal).catch(
      (error: unknown) => {
        if (controller.signal.aborted) return;
        dispatch({
          type: "failed",
          message:
            error instanceof Error ? error.message : "L’audit a échoué.",
        });
      },
    );

    return () => controller.abort();
  }, [query, domain]);

  // La redirection est un effet à part : elle ne doit pas partir depuis le
  // réducteur, qui peut être rejoué en développement.
  const auditId = state.phase === "saving" ? state.result?.id : null;
  useEffect(() => {
    if (auditId) router.replace(`/audit/${auditId}`);
  }, [auditId, router]);

  return (
    <div className="bg-bg">
      <Container>
        <div className="flex flex-col gap-6 py-14 lg:py-20">
          <header className="flex flex-col gap-5 border-b border-line pb-8">
            <p className="eyebrow flex items-center gap-3 text-ink-soft">
              <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
              Audit de visibilité IA
            </p>
            <h1 className="animate-rise text-[2.125rem] leading-[1.06] sm:text-[2.75rem] lg:text-[3.25rem]">
              {query}
            </h1>
            <p
              className="text-[0.9375rem] text-ink-soft"
              aria-live="polite"
              aria-atomic="true"
            >
              <Headline state={state} />
            </p>
          </header>

          {state.phase === "error" ? (
            <ErrorCard message={state.message ?? "L’audit a échoué."} />
          ) : state.phase === "orphan" && state.result ? (
            <Orphan result={state.result} />
          ) : (
            <LiveCard state={state} />
          )}
        </div>
      </Container>
    </div>
  );
}

function Headline({ state }: { state: State }) {
  const total = state.engines.filter((e) => e.willQuery).length * state.promptCount;
  const answered = state.engines.reduce((sum, e) => sum + e.answers.length, 0);

  switch (state.phase) {
    case "connecting":
      return <>Préparation des questions…</>;
    case "running":
      return (
        <>
          {answered} réponse{answered > 1 ? "s" : ""} sur {total} obtenue
          {answered > 1 ? "s" : ""} · <Elapsed />
        </>
      );
    case "saving":
      return <>Audit terminé. Ouverture du résultat…</>;
    case "orphan":
      return <>Résultat obtenu.</>;
    default:
      return <>L’audit n’a pas pu aboutir.</>;
  }
}

/* ------------------------------------------------------------------ */

/**
 * La carte de progression. Une ligne par moteur, une case par question.
 * Cobalt = ce moteur t'a cité sur cette question. Le remplissage est la
 * seule chose animée, et il suit les réponses réelles.
 */
function LiveCard({ state }: { state: State }) {
  const engines = state.engines.length ? state.engines : PLACEHOLDER;

  return (
    <section className="animate-rise rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Interrogation des moteurs</h2>
        <span className="eyebrow inline-flex items-center gap-2 text-ink-soft">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-cobalt"
          />
          en cours
        </span>
      </div>

      <ul className="px-6 sm:px-9">
        {engines.map((engine, row) => (
          <EngineProgress
            key={engine.engine}
            engine={engine}
            promptCount={state.promptCount}
            row={row}
          />
        ))}
      </ul>

      <p className="border-t border-line px-6 py-5 text-[0.8125rem] leading-relaxed text-absent sm:px-9">
        Six questions d’acheteur par moteur, posées à leurs API avec recherche
        web. Compte une à deux minutes : c’est le temps que met un moteur à
        chercher, pas une animation d’attente.
      </p>
    </section>
  );
}

const PLACEHOLDER: EngineRun[] = [
  { engine: "chatgpt", label: "ChatGPT", willQuery: true, answers: [] },
  { engine: "claude", label: "Claude", willQuery: true, answers: [] },
  { engine: "perplexity", label: "Perplexity", willQuery: true, answers: [] },
  { engine: "gemini", label: "Gemini", willQuery: true, answers: [] },
];

function EngineProgress({
  engine,
  promptCount,
  row,
}: {
  engine: EngineRun;
  promptCount: number;
  row: number;
}) {
  const finished = engine.status !== undefined;
  const cited = engine.status === "cited";
  const absent = engine.status === "absent";
  const skipped =
    engine.status === "not_configured" || engine.status === "not_implemented";
  const failed = engine.status === "error";

  return (
    <li
      className="animate-rise flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line py-4 first:border-t-0"
      style={{ animationDelay: `${row * 70}ms` }}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border transition-colors duration-500 ${
          cited
            ? "border-cobalt bg-cobalt text-white"
            : absent || failed
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

      {engine.willQuery ? (
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: promptCount }, (_, i) => {
            const answer = engine.answers[i];
            const answered = i < engine.answers.length;
            const pending = !answered && !finished && i === engine.answers.length;
            return (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${
                  answered
                    ? answer
                      ? "bg-cobalt"
                      : "bg-absent"
                    : pending
                      ? "animate-pulse-soft bg-line-strong"
                      : "bg-line"
                }`}
              />
            );
          })}
        </span>
      ) : null}

      <span
        className={`ml-auto text-right text-[0.875rem] ${cited ? "text-cobalt" : "text-absent"}`}
      >
        {skipped
          ? `Non mesuré — ${engine.detail}`
          : failed
            ? `Erreur — ${engine.detail}`
            : finished
              ? cited
                ? `Cité — ${engine.detail}`
                : "Absent"
              : engine.answers.length === 0
                ? "en attente…"
                : `${engine.answers.length} réponse${engine.answers.length > 1 ? "s" : ""} sur ${promptCount}`}
      </span>
    </li>
  );
}

/* Audit non enregistré : pas de base branchée, donc pas d'URL à donner. */
function Orphan({ result }: { result: AuditView }) {
  return (
    <>
      <ScoreCard
        citedCount={result.citedCount}
        measuredCount={result.measuredCount}
        engines={result.engines}
        demo={result.mode === "demo"}
      />
      <p className="rounded-md border border-line bg-surface px-6 py-5 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-9">
        Cet audit n’a pas pu être enregistré : la base de données n’est pas
        branchée sur ce déploiement. Le score ci-dessus est réel, mais il n’a
        pas d’adresse propre, et le détail par question n’est donc pas
        consultable.
      </p>
    </>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <section className="animate-rise rounded-md border border-line bg-surface p-8 sm:p-10">
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
