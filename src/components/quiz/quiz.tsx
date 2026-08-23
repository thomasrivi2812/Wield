"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Em } from "@/components/ui/em";
import { IconArrow, IconCheck } from "@/components/ui/icons";
import { LEVELS, MAX_SCORE, QUESTIONS, levelFor } from "./questions";

type Step = "intro" | number | "result";

export function Quiz() {
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<number[]>([]);

  function answer(value: number) {
    const next = [...answers];
    next[step as number] = value;
    setAnswers(next);
    const index = (step as number) + 1;
    setStep(index >= QUESTIONS.length ? "result" : index);
  }

  function restart() {
    setAnswers([]);
    setStep("intro");
  }

  const score = answers.reduce((sum, v) => sum + v, 0);

  return (
    <div className="bg-bg">
      <Container>
        <div className="mx-auto max-w-[46rem] py-16 lg:py-24">
          {step === "intro" ? <Intro onStart={() => setStep(0)} /> : null}

          {typeof step === "number" ? (
            <Question
              index={step}
              chosen={answers[step]}
              onAnswer={answer}
              onBack={() => setStep(step === 0 ? "intro" : step - 1)}
            />
          ) : null}

          {step === "result" ? (
            <Result score={score} onRestart={restart} />
          ) : null}
        </div>
      </Container>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <p className="eyebrow flex items-center gap-3 text-ink-soft">
        <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
        Diagnostic
      </p>

      <h1 className="mt-7 text-[2.25rem] leading-[1.05] sm:text-[3rem] lg:text-[3.5rem]">
        Où en est ta boîte avec l&apos;<Em>IA</Em> ?
      </h1>

      <p className="mt-7 text-[1.125rem] leading-[1.65] text-ink-soft">
        Huit questions, deux minutes, sans compte. À la fin, tu sais où tu te
        situes — et surtout ce qui bloque le palier suivant.
      </p>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {LEVELS.map((level) => (
          <li key={level.name} className="flex items-baseline gap-5 py-3.5">
            <span className="font-display text-[1.0625rem] font-bold text-ink">
              {level.name}
            </span>
            <span className="ml-auto text-[0.8125rem] tabular-nums text-absent">
              {level.from} à {level.to} points
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Button onClick={onStart} size="lg">
          Commencer le diagnostic
          <IconArrow />
        </Button>
      </div>
    </div>
  );
}

function Question({
  index,
  chosen,
  onAnswer,
  onBack,
}: {
  index: number;
  chosen: number | undefined;
  onAnswer: (value: number) => void;
  onBack: () => void;
}) {
  const question = QUESTIONS[index];
  const progress = ((index + 1) / QUESTIONS.length) * 100;

  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <p className="eyebrow text-ink-soft">
          Question {index + 1} sur {QUESTIONS.length}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-[0.875rem] text-ink-soft underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink"
        >
          Revenir
        </button>
      </div>

      <div
        className="mt-4 h-1 w-full rounded-full bg-line"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={QUESTIONS.length}
        aria-label="Avancement du diagnostic"
      >
        <div
          className="h-1 rounded-full bg-cobalt transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <fieldset className="mt-12">
        <legend className="text-[1.625rem] leading-[1.2] font-display font-extrabold tracking-[-0.03em] text-ink sm:text-[2rem]">
          {question.label}
        </legend>

        <div className="mt-9 flex flex-col gap-3">
          {question.options.map((option, value) => {
            const active = chosen === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onAnswer(value)}
                aria-pressed={active}
                className={`group flex items-center gap-4 rounded-sm border px-5 py-4 text-left transition-colors ${
                  active
                    ? "border-cobalt bg-cobalt-soft"
                    : "border-line-strong bg-surface hover:border-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? "border-cobalt bg-cobalt text-white"
                      : "border-line-strong text-transparent group-hover:border-ink"
                  }`}
                >
                  <IconCheck className="h-3 w-3" />
                </span>
                <span className="text-[1rem] leading-snug text-ink">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function Result({ score, onRestart }: { score: number; onRestart: () => void }) {
  const level = levelFor(score);

  return (
    <div>
      <p className="eyebrow flex items-center gap-3 text-ink-soft">
        <span aria-hidden="true" className="h-px w-8 bg-cobalt" />
        Ton résultat
      </p>

      <h1 className="mt-7 text-[2.25rem] leading-[1.05] sm:text-[3rem]">
        Ta boîte est au niveau <Em>{level.name}</Em>.
      </h1>

      <ScoreMeter score={score} levelName={level.name} />

      <p className="mt-10 text-[1.125rem] leading-[1.7] text-ink-soft">
        {level.verdict}
      </p>

      <h2 className="mt-12 text-[1.5rem] leading-tight">
        Les trois prochains pas
      </h2>
      <ol className="mt-5 divide-y divide-line border-y border-line">
        {level.steps.map((step) => (
          <li key={step} className="flex gap-4 py-4">
            <IconCheck className="mt-1 h-4 w-4 shrink-0 text-cobalt" />
            <span className="text-[1rem] leading-snug text-ink">{step}</span>
          </li>
        ))}
      </ol>

      {/* La sortie naturelle : Wield Studio */}
      <div className="mt-12 rounded-md border border-line-invert bg-slate p-8 text-ink-invert lg:p-10">
        <p className="eyebrow text-cobalt-light">Wield Studio</p>
        <p className="mt-5 max-w-[26ch] font-display text-[1.625rem] font-extrabold leading-[1.15] tracking-[-0.03em] sm:text-[1.875rem]">
          On installe ces trois pas avec toi.
        </p>
        <p className="mt-5 max-w-[52ch] text-[1rem] leading-[1.65] text-ink-invert-soft">
          Former les équipes, monter les automatismes qui tiennent, brancher
          l&apos;IA sur tes outils métier. On repart de ton diagnostic, pas d&apos;un
          catalogue.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Button href="/#offres" size="lg">
            Découvrir Wield Studio
          </Button>
          <Link
            href="/#test"
            className="text-[0.9375rem] text-ink-invert-soft underline decoration-line-invert underline-offset-4 transition-colors hover:text-ink-invert"
          >
            Ou tester ma visibilité sur les IA
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onRestart}
          className="text-[0.875rem] text-ink-soft underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink"
        >
          Refaire le diagnostic
        </button>
      </div>
    </div>
  );
}

/**
 * Jauge : une valeur unique rapportée à un maximum. Une seule teinte, la piste
 * en gris, et les quatre paliers nommés sous la barre — jamais la couleur seule.
 */
function ScoreMeter({ score, levelName }: { score: number; levelName: string }) {
  return (
    <figure className="mt-10 rounded-md border border-line bg-surface p-7 sm:p-8">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-4">
        <span className="eyebrow text-ink-soft">Score de maturité</span>
        <span className="font-display text-[2rem] font-extrabold leading-none tabular-nums text-ink">
          <span className="text-cobalt">{score}</span>
          <span className="text-absent">/{MAX_SCORE}</span>
        </span>
      </figcaption>

      <div className="mt-6 h-2.5 w-full rounded-full bg-bg">
        <div
          className="h-2.5 rounded-full bg-cobalt"
          style={{ width: `${Math.max((score / MAX_SCORE) * 100, 2)}%` }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-4 gap-2">
        {LEVELS.map((level) => {
          const active = level.name === levelName;
          return (
            <li
              key={level.name}
              className={`border-t pt-2.5 text-[0.75rem] leading-snug ${
                active
                  ? "border-cobalt font-semibold text-ink"
                  : "border-line text-absent"
              }`}
            >
              {level.name}
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
