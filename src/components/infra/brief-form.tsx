"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/ui/icons";

const QUESTIONS = [
  {
    name: "besoin",
    label: "De quoi as-tu besoin ?",
    options: [
      "Une boutique en ligne",
      "Une landing page",
      "Un site métier",
      "Refaire un site existant",
      "Je ne sais pas encore",
    ],
  },
  {
    name: "etat",
    label: "Où en es-tu aujourd’hui ?",
    options: [
      "Rien pour l’instant",
      "Un site qui ne convient plus",
      "Un site correct à améliorer",
    ],
  },
  {
    name: "horizon",
    label: "Pour quand ?",
    options: ["Le plus vite possible", "D’ici trois mois", "Pas d’urgence"],
  },
];

export function BriefForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-md border border-cobalt bg-surface p-8 sm:p-10">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cobalt text-white">
          <IconCheck className="h-5 w-5" />
        </span>

        <h2 className="mt-7 text-[1.75rem] leading-tight">
          C’est parti de notre côté.
        </h2>

        <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-[1.7] text-ink-soft">
          Tu reçois une réponse par e-mail sous 24 à 48 h ouvrées : un plan
          d’action concret — ce qu’on construit, dans quel ordre, avec quels
          outils — et un devis chiffré. Pas de rendez-vous obligatoire avant.
        </p>

        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-8 text-[0.875rem] text-ink-soft underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink"
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="rounded-md border border-line bg-surface p-8 sm:p-10"
    >
      <h2 className="text-[1.75rem] leading-tight">Exprime ton besoin</h2>
      <p className="mt-3 text-[0.9375rem] text-ink-soft">
        Trois questions, deux minutes. Assez pour te répondre sérieusement.
      </p>

      <div className="mt-9 flex flex-col gap-9">
        {QUESTIONS.map((question, qi) => (
          <fieldset key={question.name}>
            <legend className="font-display text-[1.0625rem] font-semibold text-ink">
              {question.label}
            </legend>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {question.options.map((option, oi) => {
                const id = `${question.name}-${oi}`;
                return (
                  <div key={option}>
                    <input
                      type="radio"
                      id={id}
                      name={question.name}
                      value={option}
                      required={oi === 0 ? true : undefined}
                      defaultChecked={false}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className="inline-flex cursor-pointer items-center rounded-full border border-line-strong bg-surface px-4 py-2 text-[0.9375rem] text-ink-soft transition-colors hover:border-ink hover:text-ink peer-checked:border-cobalt peer-checked:bg-cobalt-soft peer-checked:text-cobalt peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cobalt"
                    >
                      {option}
                    </label>
                  </div>
                );
              })}
            </div>

            {qi === QUESTIONS.length - 1 ? null : null}
          </fieldset>
        ))}

        <div>
          <label
            htmlFor="detail"
            className="font-display text-[1.0625rem] font-semibold text-ink"
          >
            En quelques lignes, ton projet
          </label>
          <textarea
            id="detail"
            name="detail"
            rows={4}
            className="mt-4 w-full resize-y rounded-sm border border-line-strong bg-surface px-4 py-3 text-[0.9375rem] leading-relaxed text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
            placeholder="Ce que tu vends, à qui, et ce qui coince aujourd’hui."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="societe"
              className="eyebrow block text-ink-soft"
            >
              Ton entreprise
            </label>
            <input
              id="societe"
              name="societe"
              required
              className="mt-3 h-12 w-full rounded-sm border border-line-strong bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
              placeholder="Menuiserie Exemple"
            />
          </div>
          <div>
            <label htmlFor="email" className="eyebrow block text-ink-soft">
              Ton e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-3 h-12 w-full rounded-sm border border-line-strong bg-surface px-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
              placeholder="prenom@ta-pme.fr"
            />
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
        <Button size="lg">Envoyer ma demande</Button>
        <p className="text-[0.8125rem] text-ink-soft">
          Réponse sous 24 à 48 h ouvrées.
        </p>
      </div>
    </form>
  );
}
