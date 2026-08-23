"use client";

import { useState } from "react";

/**
 * Mur de connexion du rapport gratuit.
 * Marques en monochrome pour tenir la charte : avant mise en ligne, le bouton
 * Google doit repasser aux couleurs officielles imposées par Google.
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.125rem] w-[1.125rem]">
      <path
        fill="currentColor"
        d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1l3.2 2.5c1.9-1.7 3-4.3 3-7.3 0-.7-.1-1.4-.2-2.1H12Z"
      />
      <path
        fill="currentColor"
        opacity="0.75"
        d="M6.3 14.3 5.6 15l-2.5 2A10 10 0 0 0 12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 1-3.5 1a6 6 0 0 1-5.7-4.1Z"
      />
      <path
        fill="currentColor"
        opacity="0.5"
        d="M3.1 7A10 10 0 0 0 2 12c0 1.8.4 3.5 1.1 5l3.2-2.7a6 6 0 0 1 0-3.8L3.1 7Z"
      />
      <path
        fill="currentColor"
        opacity="0.9"
        d="M12 5.9c1.5 0 2.9.5 4 1.5l2.9-2.9A10 10 0 0 0 3.1 7l3.2 2.6A6 6 0 0 1 12 5.9Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[1.125rem] w-[1.125rem]">
      <path
        fill="currentColor"
        d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7 1.9-1 2.6-2a9 9 0 0 0 1.2-2.4c-.1 0-2.3-.9-2.3-3.3ZM14.2 6.2c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.5.6-1 1.7-.9 2.6 1 .1 2-.5 2.6-1.2Z"
      />
    </svg>
  );
}

function MailMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[1.125rem] w-[1.125rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.8 7 8.2 6 8.2-6" strokeLinecap="round" />
    </svg>
  );
}

const PROVIDERS = [
  { id: "google", label: "Continuer avec Google", Mark: GoogleMark },
  { id: "apple", label: "Continuer avec Apple", Mark: AppleMark },
] as const;

export function AuthPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-md border border-line bg-surface p-7 sm:p-9">
      <h3 className="text-[1.375rem] leading-snug">
        Crée ton compte pour voir le rapport
      </h3>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
        Gratuit, sans carte bancaire. Tu récupères les six prompts testés, qui
        est cité à ta place, et ton taux de citation moteur par moteur.
      </p>

      <div className="mt-7 flex flex-col gap-3">
        {PROVIDERS.map(({ id, label, Mark }) => (
          <button
            key={id}
            type="button"
            onClick={onSignedIn}
            className="flex h-12 items-center justify-center gap-3 rounded-sm border border-line-strong bg-surface font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-bg"
          >
            <Mark />
            {label}
          </button>
        ))}

        <div className="flex items-center gap-4 py-1">
          <span className="h-px flex-1 bg-line" />
          <span className="eyebrow text-absent">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSignedIn();
          }}
          className="flex flex-col gap-3"
        >
          <label htmlFor="auth-email" className="sr-only">
            Ton adresse e-mail professionnelle
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-absent">
              <MailMark />
            </span>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@ta-pme.fr"
              className="h-12 w-full rounded-sm border border-line-strong bg-surface pl-12 pr-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-sm bg-cobalt px-6 font-display font-semibold text-white transition-colors hover:bg-cobalt-hover active:translate-y-px"
          >
            Recevoir mon lien de connexion
          </button>
        </form>
      </div>

      <p className="mt-6 text-[0.75rem] leading-relaxed text-ink-soft">
        Aucune carte demandée, aucune donnée revendue. Désinscription en un clic.
      </p>
    </div>
  );
}
