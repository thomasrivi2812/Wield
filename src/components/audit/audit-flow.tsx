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
 * Rien de ce qui bouge ici n'est décoratif. Chaque case remplie est une
 * réponse réellement obtenue, chaque domaine affiché a réellement été cité.
 * On saurait faire une barre qui avance toute seule ; on ne saurait pas la
 * justifier sur un produit dont l'argument est « on mesure, on n'invente pas ».
 *
 * Dès que l'audit est enregistré, on remplace l'URL par /audit/<id> : c'est
 * elle qui porte le résultat, et le retour de Stripe en a besoin.
 */

export type EngineRun = {
  engine: string;
  label: string;
  willQuery: boolean;
  /** Verdict par question, dans l'ordre d'arrivée. */
  answers: boolean[];
  status?: string;
  detail?: string;
};

export type State = {
  phase: "connecting" | "running" | "saving" | "orphan" | "error";
  promptCount: number;
  engines: EngineRun[];
  /** Domaines cités, et combien de fois. Se remplit pendant le scan. */
  domains: Record<string, number>;
  message?: string;
  result?: AuditView;
};

export const INITIAL: State = {
  phase: "connecting",
  promptCount: 6,
  engines: [],
  domains: {},
};

export function reduce(
  state: State,
  event: AuditEvent | { type: "failed"; message: string },
): State {
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

    case "prompt": {
      const domains = { ...state.domains };
      for (const raw of event.winners) {
        const domain = raw.trim().toLowerCase().replace(/^www\./, "");
        if (domain) domains[domain] = (domains[domain] ?? 0) + 1;
      }
      return {
        ...state,
        domains,
        engines: state.engines.map((engine) =>
          engine.engine === event.engine
            ? { ...engine, answers: [...engine.answers, event.cited] }
            : engine,
        ),
      };
    }

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
          message: error instanceof Error ? error.message : "L’audit a échoué.",
        });
      },
    );

    return () => controller.abort();
  }, [query, domain]);

  // La redirection est un effet à part : elle ne doit pas partir du réducteur,
  // qui peut être rejoué en développement.
  const auditId = state.phase === "saving" ? state.result?.id : null;
  useEffect(() => {
    if (auditId) router.replace(`/audit/${auditId}`);
  }, [auditId, router]);

  const mine = domain?.trim().toLowerCase().replace(/^www\./, "") || null;

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
            <>
              <Matrix state={state} />
              <Leaderboard state={state} mine={mine} />
            </>
          )}
        </div>
      </Container>
    </div>
  );
}

function counts(state: State) {
  const asked = state.engines.filter((e) => e.willQuery);
  return {
    total: asked.length * state.promptCount,
    answered: state.engines.reduce((sum, e) => sum + e.answers.length, 0),
  };
}

function Headline({ state }: { state: State }) {
  const { total, answered } = counts(state);

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
    default:
      return <>L’audit n’a pas pu aboutir.</>;
  }
}

/* ------------------------------------------------------------------ */

const PLACEHOLDER: EngineRun[] = [
  { engine: "chatgpt", label: "ChatGPT", willQuery: true, answers: [] },
  { engine: "claude", label: "Claude", willQuery: true, answers: [] },
  { engine: "perplexity", label: "Perplexity", willQuery: true, answers: [] },
  { engine: "gemini", label: "Gemini", willQuery: true, answers: [] },
];

/**
 * La matrice : un moteur par ligne, une question par colonne.
 * C'est la forme de la mesure elle-même — on voit d'un coup d'œil combien de
 * questions ont été posées, à qui, et ce qu'elles ont donné.
 */
function Matrix({ state }: { state: State }) {
  const engines = state.engines.length ? state.engines : PLACEHOLDER;
  const { total, answered } = counts(state);
  const progress = total > 0 ? answered / total : 0;

  return (
    <section className="animate-rise overflow-hidden rounded-md border border-line bg-surface">
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

      {/*
        Le trait de progression est un compte de réponses, pas une estimation
        de durée : il n'avance que quand un moteur a répondu.
      */}
      <div className="h-0.5 w-full bg-line" aria-hidden="true">
        <div
          className="h-full bg-cobalt transition-[width] duration-700 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="overflow-x-auto px-6 py-7 sm:px-9">
        <table className="w-full min-w-[30rem] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th scope="col" className="eyebrow w-px pb-4 pr-6 whitespace-nowrap text-absent">
                Moteur
              </th>
              {Array.from({ length: state.promptCount }, (_, i) => (
                <th
                  key={i}
                  scope="col"
                  className="eyebrow w-9 pb-4 text-center text-absent tabular-nums"
                >
                  {i + 1}
                </th>
              ))}
              <th scope="col" className="eyebrow w-full pb-4 pl-6 text-right text-absent">
                État
              </th>
            </tr>
          </thead>
          <tbody>
            {engines.map((engine, row) => (
              <Row
                key={engine.engine}
                engine={engine}
                promptCount={state.promptCount}
                row={row}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="border-t border-line px-6 py-5 text-[0.8125rem] leading-relaxed text-absent sm:px-9">
        Une case par question posée. Cobalt&nbsp;: ce moteur t’a cité.
        Gris&nbsp;: il a répondu sans toi. Compte une à deux minutes — c’est le
        temps que met un moteur à chercher, pas une animation d’attente.
      </p>
    </section>
  );
}

function Row({
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
    <tr
      className="animate-rise"
      style={{ animationDelay: `${row * 70}ms` }}
    >
      <th
        scope="row"
        className="w-px py-2.5 pr-6 font-display text-[1rem] font-semibold whitespace-nowrap"
      >
        <span className="flex items-center gap-2.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500 ${
              cited
                ? "bg-cobalt"
                : finished
                  ? "bg-absent"
                  : "animate-pulse-soft bg-line-strong"
            }`}
            aria-hidden="true"
          />
          {engine.label}
        </span>
      </th>

      {Array.from({ length: promptCount }, (_, i) => (
        <td key={i} className="py-2.5 text-center">
          <Cell
            answer={engine.answers[i]}
            answered={i < engine.answers.length}
            pending={
              engine.willQuery && !finished && i === engine.answers.length
            }
            queried={engine.willQuery}
          />
        </td>
      ))}

      <td
        className={`py-2.5 pl-6 text-right text-[0.8125rem] whitespace-nowrap ${
          cited ? "text-cobalt" : "text-absent"
        }`}
      >
        {skipped
          ? "non mesuré"
          : failed
            ? "erreur"
            : cited
              ? "cité"
              : absent
                ? "absent"
                : engine.answers.length === 0
                  ? "en attente"
                  : `${engine.answers.length}/${promptCount}`}
      </td>
    </tr>
  );
}

/** Une case = une question posée à un moteur. */
function Cell({
  answer,
  answered,
  pending,
  queried,
}: {
  answer?: boolean;
  answered: boolean;
  pending: boolean;
  queried: boolean;
}) {
  if (!queried) {
    return (
      <span
        aria-hidden="true"
        className="mx-auto block h-[3px] w-4 rounded-full bg-line"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`mx-auto block h-6 w-6 rounded-xs border transition-all duration-500 ${
        answered
          ? answer
            ? "scale-100 border-cobalt bg-cobalt"
            : "scale-100 border-line-strong bg-line-strong"
          : pending
            ? "animate-pulse-soft scale-100 border-line-strong bg-transparent"
            : "scale-90 border-line bg-transparent"
      }`}
    />
  );
}

/**
 * Ce que les moteurs citent, au fil de l'eau.
 *
 * C'est la partie qui fait mal, et c'est voulu : on regarde les concurrents
 * s'accumuler pendant que son propre domaine n'apparaît pas. Aucun de ces
 * noms n'est fabriqué — ils sortent des réponses reçues à l'instant.
 */
function Leaderboard({ state, mine }: { state: State; mine: string | null }) {
  const ranked = Object.entries(state.domains)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain))
    .slice(0, 8);

  const found = mine ? state.domains[mine] : undefined;

  return (
    <section className="animate-rise rounded-md border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-9">
        <h2 className="eyebrow text-ink-soft">Ce que les moteurs citent</h2>
        <span className="eyebrow text-absent tabular-nums">
          {ranked.length} domaine{ranked.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="px-6 py-7 sm:px-9">
        {ranked.length === 0 ? (
          <p className="text-[0.9375rem] text-absent">
            Les sources citées apparaîtront ici, au fur et à mesure des réponses.
          </p>
        ) : (
          <ol className="space-y-px">
            {ranked.map(({ domain, count }, i) => {
              const isMine = mine !== null && domain === mine;
              return (
                <li
                  key={domain}
                  className="animate-rise flex items-center gap-4 border-b border-line py-3 last:border-b-0"
                  style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}
                >
                  <span className="w-6 shrink-0 font-display text-[0.75rem] font-semibold text-absent tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`min-w-0 truncate text-[0.9375rem] ${
                      isMine ? "font-display font-semibold text-cobalt" : "text-ink"
                    }`}
                  >
                    {domain}
                  </span>
                  {isMine ? (
                    <span className="eyebrow shrink-0 rounded-xs bg-cobalt-soft px-2 py-1 text-cobalt">
                      toi
                    </span>
                  ) : null}

                  {/* Barre de fréquence : la part de réponses où ce domaine sort. */}
                  <span
                    aria-hidden="true"
                    className="ml-auto hidden h-1.5 w-24 shrink-0 rounded-full bg-line sm:block"
                  >
                    <span
                      className={`block h-full rounded-full transition-[width] duration-500 ${
                        isMine ? "bg-cobalt" : "bg-absent"
                      }`}
                      style={{
                        width: `${Math.round((count / ranked[0].count) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-[0.8125rem] text-absent tabular-nums">
                    ×{count}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {mine && ranked.length > 0 && found === undefined ? (
          <p className="mt-6 border-t border-line pt-5 text-[0.9375rem] leading-relaxed text-ink">
            <span className="font-display font-semibold">{mine}</span> n’est pas
            encore ressorti sur les réponses reçues.
          </p>
        ) : null}
      </div>
    </section>
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
