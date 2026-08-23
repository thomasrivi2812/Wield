"use client";

import { useActionState, useState } from "react";
import { signInWithEmail, signInWithProvider } from "@/app/auth/actions";
import { ProviderMark } from "@/components/auth/provider-marks";
import { PROVIDERS, parseEnabledProviders } from "@/lib/auth-providers";
import { supabaseBrowser } from "@/lib/supabase/client";

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
  "flex h-12 w-full items-center justify-center gap-3 rounded-sm border border-line-strong bg-surface font-display text-[0.9375rem] font-semibold text-ink transition-colors hover:border-ink hover:bg-bg";

/**
 * Mur de connexion.
 *
 * N'affiche que les fournisseurs déclarés dans NEXT_PUBLIC_AUTH_PROVIDERS :
 * un bouton qui mène à une erreur fait croire que le site est cassé.
 * Le lien e-mail est toujours proposé — il ne demande aucune configuration
 * et reste le recours quand aucun fournisseur n'est activé.
 */
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
  const providers = parseEnabledProviders(
    process.env.NEXT_PUBLIC_AUTH_PROVIDERS,
  );
  const [email, setEmail] = useState("");
  const [state, submitEmail, pending] = useActionState(signInWithEmail, null);

  // Sans Supabase, on garde le parcours de démonstration mais on montre les
  // mêmes fournisseurs, pour que la maquette reflète le produit visé.
  const shown = providers;

  return (
    <div className="rounded-md border border-line bg-surface p-7 sm:p-9">
      <h3 className="text-[1.375rem] leading-snug">{title}</h3>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{lede}</p>

      <div className="mt-7 flex flex-col gap-3">
        {shown.map((id) =>
          configured ? (
            <form key={id} action={signInWithProvider}>
              <input type="hidden" name="provider" value={id} />
              <input type="hidden" name="next" value={next} />
              <button type="submit" className={BUTTON}>
                <ProviderMark id={id} />
                {PROVIDERS[id].label}
              </button>
            </form>
          ) : (
            <button
              key={id}
              type="button"
              onClick={onDemoSignIn}
              className={BUTTON}
            >
              <ProviderMark id={id} />
              {PROVIDERS[id].label}
            </button>
          ),
        )}

        {shown.length ? (
          <div className="flex items-center gap-4 py-1">
            <span className="h-px flex-1 bg-line" />
            <span className="eyebrow text-absent">ou</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        ) : null}

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
          ? "Pas de mot de passe à retenir. Aucune carte demandée, aucune donnée revendue."
          : "Connexion non branchée sur ce déploiement : ces boutons déroulent la démonstration."}
      </p>
    </div>
  );
}
