/**
 * Les fournisseurs de connexion proposés.
 *
 * Deux règles :
 *
 * 1. On n'affiche qu'un fournisseur réellement activé dans Supabase. Un
 *    bouton qui mène à une page d'erreur coûte plus qu'un bouton absent :
 *    l'utilisateur croit que le site est cassé. D'où la liste explicite dans
 *    NEXT_PUBLIC_AUTH_PROVIDERS.
 * 2. Le fournisseur transmis par le formulaire est vérifié côté serveur
 *    contre ce catalogue. Sans ça, n'importe qui déclencherait une
 *    redirection OAuth vers un fournisseur non prévu.
 */

export type ProviderId = "google" | "azure" | "apple" | "linkedin_oidc" | "github";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  /** Portées supplémentaires exigées par le fournisseur. */
  scopes?: string;
  /** Ce que ça coûte à mettre en place, affiché dans la doc. */
  note: string;
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  google: {
    id: "google",
    label: "Continuer avec Google",
    note: "Google Workspace : le plus répandu chez les PME françaises.",
  },
  azure: {
    id: "azure",
    label: "Continuer avec Microsoft",
    // Azure ne renvoie pas l'adresse sans cette portée explicite, et un
    // compte sans e-mail ne sert à rien pour envoyer un rapport.
    scopes: "email",
    note: "Microsoft 365 : l'autre moitié du parc, souvent oubliée.",
  },
  apple: {
    id: "apple",
    label: "Continuer avec Apple",
    note: "Demande un compte développeur Apple payant (99 €/an).",
  },
  linkedin_oidc: {
    id: "linkedin_oidc",
    label: "Continuer avec LinkedIn",
    note: "Identité professionnelle vérifiée — pertinent en B2B.",
  },
  github: {
    id: "github",
    label: "Continuer avec GitHub",
    note: "Utile pour le segment technique de Wield Studio.",
  },
};

export const ALL_PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && Object.hasOwn(PROVIDERS, value);
}

/**
 * Ce qu'on affiche quand la variable n'est pas renseignée du tout.
 * Google seul : c'est le fournisseur que presque tout le monde active en
 * premier, et ne rien afficher serait une régression silencieuse.
 * Pour n'avoir que le lien e-mail, met la variable à vide explicitement.
 */
export const DEFAULT_PROVIDERS: ProviderId[] = ["google"];

/**
 * Les fournisseurs activés, dans l'ordre déclaré.
 * Une entrée inconnue est ignorée plutôt que d'afficher un bouton mort.
 *
 * Variable absente -> valeur par défaut. Variable vide -> aucun fournisseur :
 * la distinction est volontaire, « pas configuré » n'est pas « désactivé ».
 */
export function parseEnabledProviders(
  raw: string | undefined | null,
): ProviderId[] {
  if (raw === undefined || raw === null) return [...DEFAULT_PROVIDERS];
  if (!raw.trim()) return [];
  const seen = new Set<ProviderId>();
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (isProviderId(id)) seen.add(id);
  }
  return [...seen];
}

export function enabledProviders(): ProviderId[] {
  return parseEnabledProviders(process.env.NEXT_PUBLIC_AUTH_PROVIDERS);
}
