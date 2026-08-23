/**
 * Les noms de variables attendus, et les erreurs qui coûtent le plus de temps.
 *
 * Un nom presque juste est pire qu'un nom absent : la variable est là, on la
 * voit dans le tableau de bord, et pourtant l'application ne la lit pas.
 * Le préfixe NEXT_PUBLIC_ est la source numéro un — il est obligatoire pour
 * tout ce que le navigateur doit voir, et interdit pour tout le reste.
 */

export type Requirement = {
  name: string;
  /** Sans elle, quoi ne marche pas. */
  unlocks: string;
  required: boolean;
};

export const REQUIREMENTS: Requirement[] = [
  { name: "NEXT_PUBLIC_SITE_URL", unlocks: "liens de connexion, retours Stripe", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_URL", unlocks: "comptes, historique, plafond", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", unlocks: "comptes, historique, plafond", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", unlocks: "enregistrement des audits et des achats", required: true },
  { name: "NEXT_PUBLIC_AUTH_PROVIDERS", unlocks: "boutons de connexion (défaut : google)", required: false },
  { name: "ANTHROPIC_API_KEY", unlocks: "moteur Claude", required: false },
  { name: "OPENAI_API_KEY", unlocks: "moteur ChatGPT", required: false },
  { name: "PERPLEXITY_API_KEY", unlocks: "moteur Perplexity", required: false },
  { name: "GOOGLE_AI_API_KEY", unlocks: "moteur Gemini", required: false },
  { name: "STRIPE_SECRET_KEY", unlocks: "paiements", required: false },
  { name: "STRIPE_WEBHOOK_SECRET", unlocks: "validation des paiements", required: false },
  { name: "RESEND_API_KEY", unlocks: "e-mails transactionnels", required: false },
  { name: "DIAGNOSTIC_TOKEN", unlocks: "diagnostic à distance", required: false },
];

/** Nom fautif -> nom attendu. */
export const ALIASES: Record<string, string> = {
  SUPABASE_URL: "NEXT_PUBLIC_SUPABASE_URL",
  SUPABASE_ANON_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  SUPABASE_PUBLISHABLE_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  SUPABASE_SECRET_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  SUPABASE_KEY: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  SITE_URL: "NEXT_PUBLIC_SITE_URL",
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
  ANTHROPIC_KEY: "ANTHROPIC_API_KEY",
  OPENAI_KEY: "OPENAI_API_KEY",
  GEMINI_API_KEY: "GOOGLE_AI_API_KEY",
  GOOGLE_API_KEY: "GOOGLE_AI_API_KEY",
  STRIPE_KEY: "STRIPE_SECRET_KEY",
  STRIPE_API_KEY: "STRIPE_SECRET_KEY",
  AUTH_PROVIDERS: "NEXT_PUBLIC_AUTH_PROVIDERS",
};

export type Misnamed = { found: string; expected: string };

/**
 * Repère les variables au nom presque juste, quand la bonne est absente.
 * Si les deux sont présentes, il n'y a rien à signaler : la bonne gagne.
 */
export function findMisnamed(present: Set<string>): Misnamed[] {
  const out: Misnamed[] = [];
  for (const [found, expected] of Object.entries(ALIASES)) {
    if (present.has(found) && !present.has(expected)) {
      out.push({ found, expected });
    }
  }
  return out;
}

/** Un NEXT_PUBLIC_ oublié devant un nom par ailleurs correct. */
export function findMissingPrefix(present: Set<string>): Misnamed[] {
  const out: Misnamed[] = [];
  for (const { name } of REQUIREMENTS) {
    if (!name.startsWith("NEXT_PUBLIC_")) continue;
    const bare = name.slice("NEXT_PUBLIC_".length);
    if (present.has(bare) && !present.has(name) && !ALIASES[bare]) {
      out.push({ found: bare, expected: name });
    }
  }
  return out;
}
