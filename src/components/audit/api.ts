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

export type AuditState =
  | { phase: "scanning" }
  | { phase: "done"; data: AuditView }
  | { phase: "error"; message: string };

export async function requestAudit(
  input: { query: string; domain?: string; anonId?: string },
  signal?: AbortSignal,
): Promise<AuditView> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (payload as { error?: string } | null)?.error ??
        "L’audit a échoué. Réessaie dans un instant.",
    );
  }

  return payload as AuditView;
}

/** Vrai quand aucun moteur n'a pu être interrogé. */
export function isUnmeasured(status: EngineView["status"]): boolean {
  return status === "not_configured" || status === "not_implemented";
}
