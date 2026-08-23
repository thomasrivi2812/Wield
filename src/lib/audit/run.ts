import { auditCost, sumUsage } from "./cost";
import { detectCitation } from "./detect";
import { buildPrompts } from "./prompts";
import type {
  Usage as AuditUsage,
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
    costUsd: auditCost(engines).totalUsd,
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

  const spent: Array<AuditUsage | undefined> = [];

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
      spent.push(answer.usage);
      notify({
        type: "prompt",
        engine: adapter.id,
        index,
        cited: verdict.cited,
        // Trois suffisent à l'écran, et la ligne du flux reste courte.
        winners: verdict.winners.slice(0, 3),
      });
    }

    const citedCount = results.filter((r) => r.cited).length;
    const best = results.find((r) => r.cited && r.position);

    const done: EngineResult = {
      ...base,
      status: citedCount > 0 ? "cited" : "absent",
      latencyMs: Date.now() - started,
      prompts: results,
      usage: spent.some(Boolean) ? sumUsage(spent) : undefined,
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
      // Une panne au bout de quatre questions a déjà coûté quatre appels.
      usage: spent.some(Boolean) ? sumUsage(spent) : undefined,
    };
    // Le message du fournisseur est la seule chose qui explique la panne :
    // il part dans les journaux de l'hébergeur et reste en base. Le
    // navigateur, lui, ne reçoit qu'« indisponible ».
    console.error(`[audit] ${adapter.id} a échoué :`, failed.detail);
    notify({ type: "engine", engine: failed.engine, status: failed.status, detail: failed.detail });
    return failed;
  } finally {
    clearTimeout(timeout);
  }
}
