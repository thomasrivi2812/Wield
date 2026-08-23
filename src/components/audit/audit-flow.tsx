"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { anonId } from "@/lib/anon-id";
import { ScoreCard } from "./score-card";
import { requestAudit, type AuditState } from "./api";

/**
 * Le scan en direct.
 *
 * Dès que l'audit est enregistré, on remplace l'URL par /audit/<id> : c'est
 * elle qui porte le résultat. Sans identifiant stable, un rechargement
 * relancerait quatre moteurs — et surtout, le retour de Stripe n'aurait nulle
 * part où revenir.
 */
export function AuditFlow({ query, domain }: { query: string; domain?: string }) {
  const router = useRouter();
  const [state, setState] = useState<AuditState>({ phase: "scanning" });

  useEffect(() => {
    const controller = new AbortController();

    requestAudit({ query, domain, anonId: anonId() }, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.id) {
          router.replace(`/audit/${data.id}`);
          return;
        }
        // Sans base de données, il n'y a pas d'URL à donner : on affiche le
        // score obtenu, et on le dit.
        setState({ phase: "done", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          phase: "error",
          message:
            error instanceof Error ? error.message : "L’audit a échoué.",
        });
      });

    return () => controller.abort();
  }, [query, domain, router]);

  return (
    <div className="bg-bg">
      <Container>
        <div className="flex flex-col gap-6 py-14 lg:py-20">
          <header className="flex flex-col gap-5 border-b border-line pb-8">
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
              {state.phase === "scanning"
                ? "Interrogation des moteurs de réponse sur six questions de ton secteur… Compte une à deux minutes."
                : state.phase === "error"
                  ? "L’audit n’a pas pu aboutir."
                  : "Résultat obtenu."}
            </p>
          </header>

          {state.phase === "error" ? (
            <ErrorCard message={state.message} />
          ) : state.phase === "done" ? (
            <>
              <ScoreCard
                citedCount={state.data.citedCount}
                measuredCount={state.data.measuredCount}
                engines={state.data.engines}
                demo={state.data.mode === "demo"}
              />
              <p className="rounded-md border border-line bg-surface px-6 py-5 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-9">
                Cet audit n’a pas pu être enregistré : la base de données n’est
                pas branchée sur ce déploiement. Le score ci-dessus est réel,
                mais il n’a pas d’adresse propre, et le détail par question
                n’est donc pas consultable.
              </p>
            </>
          ) : (
            <Scanning />
          )}
        </div>
      </Container>
    </div>
  );
}

/** Pendant l'attente : la forme du résultat, sans chiffre inventé. */
function Scanning() {
  return (
    <section className="rounded-md border border-line bg-surface px-6 py-8 sm:px-9">
      <p className="font-display text-[3.5rem] leading-none font-extrabold tracking-tight tabular-nums text-absent sm:text-[4.5rem]">
        —/—
      </p>
      <ul className="mt-8" aria-hidden="true">
        {["ChatGPT", "Claude", "Perplexity", "Gemini"].map((label) => (
          <li
            key={label}
            className="flex items-center gap-4 border-t border-line py-4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border border-line">
              <span className="h-1 w-1 rounded-full bg-line-strong" />
            </span>
            <span className="font-display text-[1.0625rem] font-semibold">
              {label}
            </span>
            <span className="ml-auto text-[0.875rem] text-absent">analyse…</span>
          </li>
        ))}
      </ul>
    </section>
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
