"use client";

import { useActionState, useState } from "react";
import { signInWithEmail, signInWithGoogle } from "@/app/auth/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Mur de connexion.
 *
 * Quand Supabase est branché, les boutons font une vraie authentification.
 * Sinon on garde le parcours de démonstration — et on le dit, plutôt que de
 * laisser croire qu'un compte a été créé.
 *
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

const BUTTON =
  "flex h-12 items-center justify-center gap-3 rounded-sm border border-line-strong bg-surface font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-bg";

export function AuthPanel({
  next = "/espace",
  onDemoSignIn,
  title = "Crée ton compte pour voir le rapport",
  lede = "Gratuit, sans carte bancaire. Tu récupères les six prompts testés, qui est cité à ta place, et ton taux de citation moteur par moteur.",
}: {
  next?: string;
  onDemoSignIn?: () => void;
  title?: string;
  lede?: string;
}) {
  const configured = supabaseBrowser() !== null;
  const [email, setEmail] = useState("");
  const [state, submitEmail, pending] = useActionState(signInWithEmail, null);

  return (
    <div className="rounded-md border border-line bg-surface p-7 sm:p-9">
      <h3 className="text-[1.375rem] leading-snug">{title}</h3>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{lede}</p>

      <div className="mt-7 flex flex-col gap-3">
        {configured ? (
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button type="submit" className={`${BUTTON} w-full`}>
              <GoogleMark />
              Continuer avec Google
            </button>
          </form>
        ) : (
          <button type="button" onClick={onDemoSignIn} className={BUTTON}>
            <GoogleMark />
            Continuer avec Google
          </button>
        )}

        <div className="flex items-center gap-4 py-1">
          <span className="h-px flex-1 bg-line" />
          <span className="eyebrow text-absent">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form
          action={configured ? submitEmail : undefined}
          onSubmit={
            configured
              ? undefined
              : (e) => {
                  e.preventDefault();
                  onDemoSignIn?.();
                }
          }
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="next" value={next} />
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
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@ta-pme.fr"
              className="h-12 w-full rounded-sm border border-line-strong bg-surface pl-12 pr-4 text-[0.9375rem] text-ink placeholder:text-absent focus:border-cobalt focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-sm bg-cobalt px-6 font-display font-semibold text-white transition-colors hover:bg-cobalt-hover active:translate-y-px disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Recevoir mon lien de connexion"}
          </button>
        </form>

        {state ? (
          <p
            role="status"
            className={`text-[0.875rem] leading-relaxed ${
              state.ok ? "text-cobalt" : "text-ink"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-[0.75rem] leading-relaxed text-ink-soft">
        {configured
          ? "Aucune carte demandée, aucune donnée revendue. Désinscription en un clic."
          : "Connexion non branchée sur ce déploiement : ce bouton déroule la démonstration."}
      </p>
    </div>
  );
}
