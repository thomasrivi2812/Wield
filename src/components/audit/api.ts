import type { AuditProgress } from "@/lib/audit/types";

/** Forme de la réponse publique de POST /api/audit. */
export type EngineView = {
  engine: string;
  label: string;
  status:
    | "cited"
    | "absent"
    | "error"
    | "not_configured"
    | "not_implemented";
  detail: string;
};

export type AuditView = {
  id: string | null;
  query: string;
  mode: "live" | "demo";
  citedCount: number;
  measuredCount: number;
  promptCount: number;
  engines: EngineView[];
};

export type AuditEvent =
  | AuditProgress
  | ({ type: "done" } & AuditView)
  | { type: "error"; message: string };

/** Vrai quand aucun moteur n'a pu être interrogé. */
export function isUnmeasured(status: EngineView["status"]): boolean {
  return status === "not_configured" || status === "not_implemented";
}

/**
 * Lance l'audit et rend compte au fil de l'eau.
 *
 * La réponse est du NDJSON : un objet JSON complet par ligne. Les refus
 * immédiats (requête invalide, plafond atteint) arrivent en JSON classique
 * avec un statut d'erreur — il faut donc gérer les deux.
 */
export async function streamAudit(
  input: { query: string; domain?: string; anonId?: string },
  onEvent: (event: AuditEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      signIn?: boolean;
    } | null;
    const failure = new Error(
      payload?.error ?? "L’audit a échoué. Réessaie dans un instant.",
    ) as Error & { signIn?: boolean };
    // La session a pu expirer entre l'affichage de la page et l'envoi :
    // l'appelant recharge, et retombe sur le mur de connexion.
    failure.signIn = payload?.signIn === true;
    throw failure;
  }

  if (!response.body) {
    throw new Error("Réponse vide du serveur.");
  }

  const reader = response.body.getReader();
  // `stream: true` : un caractère accentué peut être coupé entre deux blocs.
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let cut = buffer.indexOf("\n");
      while (cut !== -1) {
        emit(buffer.slice(0, cut), onEvent);
        buffer = buffer.slice(cut + 1);
        cut = buffer.indexOf("\n");
      }
    }

    // Le flux peut se terminer sans saut de ligne final.
    buffer += decoder.decode();
    emit(buffer, onEvent);
  } finally {
    reader.releaseLock();
  }
}

function emit(line: string, onEvent: (event: AuditEvent) => void): void {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    onEvent(JSON.parse(trimmed) as AuditEvent);
  } catch {
    // Une ligne illisible ne doit pas interrompre le reste du flux.
  }
}
