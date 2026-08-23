import assert from "node:assert/strict";
import test from "node:test";
import { auditCost, costOf, formatUsd, sumUsage } from "./cost";
import type { EngineResult, Usage } from "./types";

const usage = (over: Partial<Usage> = {}): Usage => ({
  inputTokens: 0,
  outputTokens: 0,
  searches: 0,
  billedUsd: null,
  ...over,
});

const engine = (over: Partial<EngineResult>): EngineResult => ({
  engine: "claude",
  label: "Claude",
  status: "absent",
  detail: "",
  latencyMs: 100,
  prompts: [],
  ...over,
});

test("le tarif Anthropic connu donne un coût exact", () => {
  // 100 000 jetons d'entrée à 5 $/MTok = 0,50 $ ; 20 000 de sortie à 25 = 0,50 $
  const cost = costOf("claude", usage({ inputTokens: 100_000, outputTokens: 20_000 }));
  assert.equal(cost, 1);
});

test("un tarif absent donne « non chiffré », jamais zéro", () => {
  assert.equal(costOf("chatgpt", usage({ inputTokens: 500_000 })), null);
  assert.equal(costOf("gemini", usage({ outputTokens: 90_000 })), null);
});

test("le coût facturé par le fournisseur l'emporte sur tout calcul", () => {
  assert.equal(
    costOf("perplexity", usage({ inputTokens: 999_999, billedUsd: 0.042 })),
    0.042,
  );
});

test("pas de consommation mesurée : pas de coût", () => {
  assert.equal(costOf("claude", undefined), null);
});

test("les recherches web n'entrent au total que si leur tarif est renseigné", () => {
  // Sans PRICE_ANTHROPIC_SEARCH, seules les jetons comptent.
  assert.equal(costOf("claude", usage({ inputTokens: 1_000_000, searches: 12 })), 5);
});

test("le cumul additionne jetons et recherches, et les coûts facturés", () => {
  assert.deepEqual(
    sumUsage([
      usage({ inputTokens: 10, outputTokens: 2, searches: 1, billedUsd: 0.01 }),
      usage({ inputTokens: 5, outputTokens: 3, searches: 2, billedUsd: 0.02 }),
      undefined,
    ]),
    { inputTokens: 15, outputTokens: 5, searches: 3, billedUsd: 0.03 },
  );
});

test("aucun fournisseur ne facture : le cumul reste non chiffré", () => {
  assert.equal(sumUsage([usage({ inputTokens: 10 })]).billedUsd, null);
});

test("un moteur non interrogé ne compte ni au total ni aux non chiffrés", () => {
  const cost = auditCost([
    engine({ engine: "claude", usage: usage({ inputTokens: 1_000_000 }) }),
    engine({ engine: "gemini", status: "not_configured" }),
  ]);

  assert.equal(cost.totalUsd, 5);
  assert.deepEqual(cost.unpricedEngines, []);
  assert.equal(cost.perEngine.length, 1);
});

test("un moteur interrogé sans tarif est signalé, et n'annule pas le total", () => {
  const cost = auditCost([
    engine({ engine: "claude", usage: usage({ inputTokens: 1_000_000 }) }),
    engine({ engine: "chatgpt", usage: usage({ inputTokens: 800_000 }) }),
  ]);

  assert.equal(cost.totalUsd, 5);
  assert.deepEqual(cost.unpricedEngines, ["chatgpt"]);
});

test("aucun moteur chiffrable : total non chiffré, pas zéro", () => {
  const cost = auditCost([
    engine({ engine: "chatgpt", usage: usage({ inputTokens: 800_000 }) }),
  ]);
  assert.equal(cost.totalUsd, null);
});

test("un moteur en erreur compte quand même ce qu'il a consommé", () => {
  const cost = auditCost([
    engine({
      engine: "claude",
      status: "error",
      usage: usage({ inputTokens: 400_000 }),
    }),
  ]);
  assert.equal(cost.totalUsd, 2);
});

test("« non chiffré » ne s'écrit jamais 0", () => {
  assert.equal(formatUsd(null), "non chiffré");
  assert.equal(formatUsd(0.4123), "0,412 $");
});
