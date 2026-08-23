"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";
import { IconCheck, IconCross } from "@/components/ui/icons";

type Engine = { name: string; cited: boolean; note: string };

/** Résultat d'exemple — la version connectée interrogera les 4 modèles en direct. */
const ENGINES: Engine[] = [
  { name: "ChatGPT", cited: true, note: "3ᵉ source citée" },
  { name: "Claude", cited: false, note: "aucune mention" },
  { name: "Perplexity", cited: false, note: "aucune mention" },
  { name: "Gemini", cited: false, note: "aucune mention" },
];

type Status = "idle" | "running" | "done";

export function CitationTest() {
  const [status, setStatus] = useState<Status>("idle");
  const [scanned, setScanned] = useState(0);
  const [query, setQuery] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  function run(event: React.FormEvent) {
    event.preventDefault();
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStatus("running");
    setScanned(0);

    ENGINES.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setScanned(i + 1), 420 * (i + 1)),
      );
    });
    timers.current.push(
      setTimeout(() => setStatus("done"), 420 * ENGINES.length + 320),
    );
  }

  const score = ENGINES.filter((e) => e.cited).length;
  const revealed = status === "done" ? ENGINES.length : scanned;

  return (
    <section id="test" className="scroll-mt-20 border-b border-line bg-bg">
      <Container>
        <div className="grid gap-14 py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
          {/* Intro + formulaire */}
          <div className="lg:col-span-5">
            <Eyebrow index="02">L&apos;outil</Eyebrow>

            <h2 className="mt-7 text-[2.5rem] leading-[1.05] sm:text-[2.75rem] lg:text-[3.25rem]">
              Es-tu <Em>cité par les IA</Em> ? Teste en 30 secondes.
            </h2>

            <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-ink-soft">
              On envoie les questions que tes clients posent vraiment aux quatre
              moteurs de réponse, et on regarde qui sort. Toi, ou tes
              concurrents.
            </p>

            <form onSubmit={run} className="mt-9">
              <label
                htmlFor="secteur"
                className="eyebrow block text-ink-soft"
              >
                Ton secteur ou ta boîte
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="secteur"
                  name="secteur"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ex. menuiserie industrielle, Lyon"
                  className="h-[3.25rem] flex-1 rounded-sm border border-line-strong bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "running"}
                  className="h-[3.25rem] shrink-0 rounded-sm bg-cobalt px-6 font-display font-semibold text-white transition-colors hover:bg-cobalt-hover active:translate-y-px disabled:opacity-60"
                >
                  {status === "running" ? "Analyse…" : "Tester ma visibilité"}
                </button>
              </div>
              <p className="mt-3 text-[0.8125rem] text-ink-soft">
                Gratuit, sans compte. Résultat détaillé envoyé par e-mail si tu
                le souhaites.
              </p>
            </form>
          </div>

          {/* Carte résultat */}
          <div className="lg:col-span-7">
            <div className="rounded-md border border-line bg-surface">
              {/* En-tête de carte */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
                <p className="eyebrow text-ink-soft">Score de citation</p>
                <p className="flex items-center gap-4 text-[0.75rem] text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-present" /> cité
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-absent" /> absent
                  </span>
                </p>
              </div>

              {/* Score */}
              <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-7 sm:px-8">
                <p className="font-display text-[3.5rem] leading-none font-bold tracking-tight sm:text-[4rem]">
                  <span className={status === "done" ? "text-cobalt" : "text-absent"}>
                    {status === "done" ? score : "—"}
                  </span>
                  <span className="text-absent">/{ENGINES.length}</span>
                </p>

                <div
                  className="flex gap-1.5"
                  aria-hidden="true"
                >
                  {ENGINES.map((engine, i) => (
                    <span
                      key={engine.name}
                      className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${
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

              {/* Détail par moteur */}
              <ul className="mt-7 px-6 pb-2 sm:px-8">
                {ENGINES.map((engine, i) => {
                  const shown = i < revealed;
                  const scanning = status === "running" && !shown;
                  return (
                    <li
                      key={engine.name}
                      className="flex items-center gap-4 border-t border-line py-4"
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
                          !shown
                            ? "text-absent"
                            : engine.cited
                              ? "text-cobalt"
                              : "text-absent"
                        }`}
                      >
                        {scanning
                          ? "analyse…"
                          : !shown
                            ? "en attente"
                            : engine.cited
                              ? `Cité — ${engine.note}`
                              : "Absent"}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Pied de carte */}
              <div className="border-t border-line px-6 py-5 sm:px-8">
                {status === "done" ? (
                  <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
                    <span className="font-display font-semibold text-ink">
                      Trois moteurs sur quatre ne te connaissent pas.
                    </span>{" "}
                    C&apos;est exactement ce que Wield Radar corrige.
                  </p>
                ) : (
                  <p className="text-[0.8125rem] text-ink-soft">
                    Exemple de résultat. La version connectée interroge ChatGPT,
                    Claude, Perplexity et Gemini en direct, sur les prompts de
                    ton secteur.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
