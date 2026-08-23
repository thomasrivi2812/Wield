import { detectCitation } from "./detect";
import { buildPrompts } from "./prompts";
import type {
  AuditInput,
  AuditResult,
  EngineAdapter,
  EngineResult,
  ProgressListener,
  PromptResult,
} from "./types";

/** Au-delà, on rend la main : mieux vaut un moteur en erreur qu'une page qui pend. */
const ENGINE_TIMEOUT_MS = 90_000;

/**
 * @param engineList injectable pour les tests ; en production, le registre.
 * @param onProgress reçoit chaque avancée réelle. L'appelant décide quoi en
 *   faire ; une exception de sa part ne doit pas interrompre l'audit.
 */
export async function runAudit(
  input: AuditInput,
  engineList?: EngineAdapter[],
  onProgress?: ProgressListener,
): Promise<AuditResult> {
  // Import différé : les quatre SDK ne sont chargés que pour un audit réel.
  const list = engineList ?? (await import("./providers")).adapters();
  const prompts = buildPrompts(input.query);

  // Un écouteur qui jette ne doit pas emporter l'audit avec lui : le client
  // peut avoir fermé son onglet en cours de route.
  const notify: ProgressListener = (event) => {
    try {
      onProgress?.(event);
    } catch {
      // rien à faire : la progression est un confort, pas le résultat
    }
  };

  notify({
    type: "start",
    prompts,
    engines: list.map((adapter) => ({
      engine: adapter.id,
      label: adapter.label,
      willQuery: Boolean(adapter.ask),
    })),
  });

  const engines = await Promise.all(
    list.map((adapter) => runEngine(adapter, prompts, input, notify)),
  );

  const measured = engines.filter(
    (e) => e.status === "cited" || e.status === "absent",
  );

  return {
    ...input,
    mode: measured.length > 0 ? "live" : "demo",
    citedCount: engines.filter((e) => e.status === "cited").length,
    measuredCount: measured.length,
    engines,
    prompts,
  };
}

async function runEngine(
  adapter: EngineAdapter,
  prompts: string[],
  input: AuditInput,
  notify: ProgressListener,
): Promise<EngineResult> {
  const base: Pick<EngineResult, "engine" | "label" | "latencyMs" | "prompts"> = {
    engine: adapter.id,
    label: adapter.label,
    latencyMs: null,
    prompts: [],
  };

  if (!adapter.ask) {
    const skipped: EngineResult = {
      ...base,
      status: adapter.configured ? "not_implemented" : "not_configured",
      detail: adapter.unavailableReason ?? "moteur indisponible",
    };
    notify({ type: "engine", engine: skipped.engine, status: skipped.status, detail: skipped.detail });
    return skipped;
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

  try {
    const results: PromptResult[] = [];

    // En série : les fournisseurs limitent le débit par compte, et six
    // requêtes simultanées par moteur suffisent à déclencher un 429.
    for (const [index, prompt] of prompts.entries()) {
      const answer = await adapter.ask(prompt, controller.signal);
      const verdict = detectCitation(answer, input.brand, input.domain);
      results.push({
        prompt,
        answer: answer.text,
        sources: answer.sources,
        ...verdict,
      });
      notify({ type: "prompt", engine: adapter.id, index, cited: verdict.cited });
    }

    const citedCount = results.filter((r) => r.cited).length;
    const best = results.find((r) => r.cited && r.position);

    const done: EngineResult = {
      ...base,
      status: citedCount > 0 ? "cited" : "absent",
      latencyMs: Date.now() - started,
      prompts: results,
      detail:
        citedCount === 0
          ? "aucune mention"
          : best?.position
            ? `${best.position}ᵉ source citée · ${citedCount} question${citedCount > 1 ? "s" : ""} sur ${prompts.length}`
            : `cité sur ${citedCount} question${citedCount > 1 ? "s" : ""} sur ${prompts.length}`,
    };
    notify({ type: "engine", engine: done.engine, status: done.status, detail: done.detail });
    return done;
  } catch (error) {
    const failed: EngineResult = {
      ...base,
      status: "error",
      latencyMs: Date.now() - started,
      detail: error instanceof Error ? error.message : "erreur inconnue",
    };
    // Le détail réel reste pour la base et les journaux ; la route publique
    // le remplace avant de l'envoyer au navigateur.
    notify({ type: "engine", engine: failed.engine, status: failed.status, detail: failed.detail });
    return failed;
  } finally {
    clearTimeout(timeout);
  }
}
