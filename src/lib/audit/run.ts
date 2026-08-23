import { detectCitation } from "./detect";
import { buildPrompts } from "./prompts";
import { adapters } from "./providers";
import type {
  AuditInput,
  AuditResult,
  EngineAdapter,
  EngineResult,
  PromptResult,
} from "./types";

/** Au-delà, on rend la main : mieux vaut un moteur en erreur qu'une page qui pend. */
const ENGINE_TIMEOUT_MS = 90_000;

export async function runAudit(input: AuditInput): Promise<AuditResult> {
  const prompts = buildPrompts(input.query);
  const engines = await Promise.all(
    adapters().map((adapter) => runEngine(adapter, prompts, input)),
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
): Promise<EngineResult> {
  const base: Pick<EngineResult, "engine" | "label" | "latencyMs" | "prompts"> = {
    engine: adapter.id,
    label: adapter.label,
    latencyMs: null,
    prompts: [],
  };

  if (!adapter.ask) {
    return {
      ...base,
      status: adapter.configured ? "not_implemented" : "not_configured",
      detail: adapter.unavailableReason ?? "moteur indisponible",
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

  try {
    const results: PromptResult[] = [];

    // En série : les fournisseurs limitent le débit par compte, et six
    // requêtes simultanées par moteur suffisent à déclencher un 429.
    for (const prompt of prompts) {
      const answer = await adapter.ask(prompt, controller.signal);
      const verdict = detectCitation(answer, input.brand, input.domain);
      results.push({
        prompt,
        answer: answer.text,
        sources: answer.sources,
        ...verdict,
      });
    }

    const citedCount = results.filter((r) => r.cited).length;
    const best = results.find((r) => r.cited && r.position);

    return {
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
  } catch (error) {
    return {
      ...base,
      status: "error",
      latencyMs: Date.now() - started,
      detail: error instanceof Error ? error.message : "erreur inconnue",
    };
  } finally {
    clearTimeout(timeout);
  }
}
