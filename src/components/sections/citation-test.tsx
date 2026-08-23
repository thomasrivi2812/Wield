"use client";

import { Reveal } from "@/components/ui/reveal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Em } from "@/components/ui/em";
import { Eyebrow } from "@/components/ui/section";
import { IconCheck, IconCross } from "@/components/ui/icons";

const SAMPLE = [
  { name: "ChatGPT", cited: true, note: "3ᵉ source citée" },
  { name: "Claude", cited: false, note: "Absent" },
  { name: "Perplexity", cited: false, note: "Absent" },
  { name: "Gemini", cited: false, note: "Absent" },
];

export function CitationTest() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return router.push("/audit");
    const d = domain.trim();
    const params = new URLSearchParams({ q });
    if (d) params.set("d", d);
    router.push(`/audit?${params}`);
  }

  return (
    <section id="test" className="scroll-mt-20 border-b border-line bg-bg">
      <Container>
        <div className="grid gap-14 py-20 lg:grid-cols-12 lg:gap-16 lg:py-24">
          <Reveal className="min-w-0 lg:col-span-5">
            <Eyebrow>L&apos;outil</Eyebrow>

            <h2 className="mt-7 text-[2.5rem] leading-[1.05] sm:text-[2.75rem] lg:text-[3.25rem]">
              Es-tu <Em>cité par les IA</Em> ? Teste en 30 secondes.
            </h2>

            <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-ink-soft">
              On envoie les questions que tes clients posent vraiment aux quatre
              moteurs de réponse, et on regarde qui sort. Toi, ou tes
              concurrents.
            </p>

            <form onSubmit={submit} className="mt-9">
              <label htmlFor="secteur" className="eyebrow block text-ink-soft">
                Ton secteur ou ta boîte
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="secteur"
                  name="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ex. menuiserie industrielle, Lyon"
                  className="h-[3.25rem] flex-1 rounded-sm border border-line-strong bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-[3.25rem] shrink-0 rounded-sm bg-cobalt px-6 font-display font-semibold text-white transition-colors hover:bg-cobalt-hover active:translate-y-px"
                >
                  Tester ma visibilité
                </button>
              </div>
              <label
                htmlFor="domaine"
                className="eyebrow mt-6 block text-ink-soft"
              >
                Ton site
              </label>
              <input
                id="domaine"
                name="d"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="ma-boite.fr"
                className="mt-3 h-[3.25rem] w-full rounded-sm border border-line-strong bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
              />
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
                Sans ton domaine, on voit qui est cité — mais pas si c&apos;est
                toi. Un compte gratuit est demandé avant le lancement&nbsp;:
                chaque audit interroge les moteurs en direct. Aucune carte
                bancaire.
              </p>
            </form>
          </Reveal>

          {/* Aperçu statique : le vrai résultat vit sur /audit */}
          <Reveal delay={140} className="min-w-0 lg:col-span-7">
            <div className="rounded-md border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4 sm:px-8">
                <p className="eyebrow text-ink-soft">Exemple de résultat</p>
                <p className="flex items-center gap-4 text-[0.75rem] text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-present" /> cité
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-absent" /> absent
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-7 sm:px-8">
                <p className="font-display text-[3.5rem] leading-none font-extrabold tracking-tight tabular-nums sm:text-[4rem]">
                  <span className="text-cobalt">1</span>
                  <span className="text-absent">/4</span>
                </p>
                <div className="flex gap-1.5" aria-hidden="true">
                  {SAMPLE.map((engine) => (
                    <span
                      key={engine.name}
                      className={`h-1.5 w-12 rounded-full ${
                        engine.cited ? "bg-present" : "bg-absent"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <ul className="mt-7 px-6 pb-2 sm:px-8">
                {SAMPLE.map((engine) => (
                  <li
                    key={engine.name}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line py-4"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xs border ${
                        engine.cited
                          ? "border-cobalt bg-cobalt text-white"
                          : "border-line-strong text-absent"
                      }`}
                    >
                      {engine.cited ? (
                        <IconCheck className="h-3.5 w-3.5" />
                      ) : (
                        <IconCross className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span className="font-display text-[1.0625rem] font-semibold">
                      {engine.name}
                    </span>
                    <span
                      className={`ml-auto text-right text-[0.875rem] ${
                        engine.cited ? "text-cobalt" : "text-absent"
                      }`}
                    >
                      {engine.cited ? `Cité — ${engine.note}` : engine.note}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="border-t border-line px-6 py-5 text-[0.9375rem] leading-relaxed text-ink-soft sm:px-8">
                <span className="font-display font-semibold text-ink">
                  Trois moteurs sur quatre ne te connaissent pas.
                </span>{" "}
                C&apos;est exactement ce que Wield Radar corrige.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
