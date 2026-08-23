/**
 * Traduction des refus d'authentification Supabase.
 *
 * « L'envoi a échoué, réessaie dans un instant » est le pire message
 * possible : la moitié de ces causes sont des erreurs de configuration
 * permanentes, et réessayer ne fera jamais rien. Chaque cas connu dit ce qui
 * bloque et où le corriger.
 */

export type AuthFailure = {
  message: string;
  /** Vrai quand réessayer a une chance d'aboutir. */
  retryable: boolean;
};

export type RawAuthError = {
  code?: string;
  status?: number;
  message?: string;
};

const BY_CODE: Record<string, AuthFailure> = {
  over_email_send_rate_limit: {
    message:
      "Trop d’e-mails envoyés à cette adresse. Supabase limite l’expéditeur intégré à quelques envois par heure — attends une heure, ou branche un vrai SMTP dans Authentication → Emails.",
    retryable: false,
  },
  over_request_rate_limit: {
    message:
      "Trop de tentatives depuis cette adresse. Attends quelques minutes avant de recommencer.",
    retryable: true,
  },
  email_address_invalid: {
    message: "Cette adresse e-mail est refusée par le serveur. Vérifie la saisie.",
    retryable: false,
  },
  email_address_not_authorized: {
    message:
      "Cette adresse n’est pas autorisée par ton expéditeur SMTP. Tant que ton domaine n’est pas vérifié, la plupart des fournisseurs n’acceptent d’envoyer qu’à ta propre adresse.",
    retryable: false,
  },
  signup_disabled: {
    message:
      "La création de compte est désactivée sur ce projet Supabase. Active « Allow new users to sign up » dans Authentication → Sign In / Providers.",
    retryable: false,
  },
  email_provider_disabled: {
    message:
      "La connexion par e-mail est désactivée sur ce projet Supabase. Active le fournisseur « Email » dans Authentication → Sign In / Providers.",
    retryable: false,
  },
  validation_failed: {
    message: "La demande a été refusée par Supabase. Vérifie l’adresse saisie.",
    retryable: false,
  },
  unexpected_failure: {
    message:
      "Supabase n’a pas pu envoyer l’e-mail. C’est presque toujours l’expéditeur : si tu as activé un SMTP personnalisé, vérifie l’hôte, le port et les identifiants — un SMTP à moitié configuré remplace l’expéditeur intégré et bloque tous les envois.",
    retryable: false,
  },
};

/**
 * Ce que l'utilisateur doit lire. `retryable` sert à ne proposer de
 * recommencer que quand ça peut marcher.
 */
export function explainAuthError(error: RawAuthError | null): AuthFailure {
  if (!error) {
    return { message: "L’envoi a échoué.", retryable: true };
  }

  const known = error.code ? BY_CODE[error.code] : undefined;
  if (known) return known;

  // Les versions plus anciennes de Supabase ne renvoient pas de `code` : on se
  // rabat sur le statut, puis sur le texte, plutôt que d'abandonner.
  if (error.status === 429) return BY_CODE.over_email_send_rate_limit;

  const text = (error.message ?? "").toLowerCase();
  if (text.includes("rate limit") || text.includes("for security purposes")) {
    return BY_CODE.over_email_send_rate_limit;
  }
  if (text.includes("signups not allowed") || text.includes("signup is disabled")) {
    return BY_CODE.signup_disabled;
  }
  if (text.includes("error sending") || text.includes("smtp")) {
    return BY_CODE.unexpected_failure;
  }
  if (text.includes("redirect")) {
    return {
      message:
        "L’adresse de retour n’est pas autorisée. Ajoute-la dans Supabase → Authentication → URL Configuration → Redirect URLs.",
      retryable: false,
    };
  }

  return {
    message:
      "L’envoi a échoué. La cause exacte est dans les journaux du déploiement (Vercel → Logs, ligne « [auth] lien e-mail »).",
    retryable: true,
  };
}
