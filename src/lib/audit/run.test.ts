import assert from "node:assert/strict";
import test from "node:test";
import { runAudit } from "./run";
import type { EngineAdapter, EngineId, Source } from "./types";

const source = (domain: string): Source => ({
  title: domain,
  url: `https://${domain}/`,
  domain,
});

function answering(id: EngineId, domains: string[]): EngineAdapter {
  return {
    id,
    label: id,
    configured: true,
    async ask() {
      return { text: "Voici des entreprises.", sources: domains.map(source) };
    },
  };
}

function failing(id: EngineId): EngineAdapter {
  return {
    id,
    label: id,
    configured: true,
    async ask() {
      throw new Error("429 trop de requêtes");
    },
  };
}

function unconfigured(id: EngineId): EngineAdapter {
  return { id, label: id, configured: false, unavailableReason: "clé absente" };
}

function unimplemented(id: EngineId): EngineAdapter {
  return {
    id,
    label: id,
    configured: true,
    unavailableReason: "adaptateur pas encore écrit",
  };
}

const input = { query: "menuiserie, Lyon", domain: "ma-boite.fr" };

test("un moteur qui cite la marque compte comme cité", async () => {
  const result = await runAudit(input, [
    answering("claude", ["ma-boite.fr", "concurrent.fr"]),
  ]);
  assert.equal(result.engines[0].status, "cited");
  assert.equal(result.citedCount, 1);
  assert.equal(result.measuredCount, 1);
  assert.equal(result.mode, "live");
});

test("un moteur interrogé qui ne cite pas est absent", async () => {
  const result = await runAudit(input, [answering("claude", ["concurrent.fr"])]);
  assert.equal(result.engines[0].status, "absent");
  assert.equal(result.citedCount, 0);
  assert.equal(result.measuredCount, 1);
});

test("un moteur sans clé n'est jamais compté comme absent", async () => {
  const result = await runAudit(input, [unconfigured("chatgpt")]);
  assert.equal(result.engines[0].status, "not_configured");
  assert.equal(result.measuredCount, 0, "il ne doit pas entrer au dénominateur");
  assert.equal(result.mode, "demo");
});

test("un adaptateur non écrit n'est jamais compté comme absent", async () => {
  const result = await runAudit(input, [unimplemented("gemini")]);
  assert.equal(result.engines[0].status, "not_implemented");
  assert.equal(result.measuredCount, 0);
});

test("un moteur en panne n'entre pas au dénominateur", async () => {
  const result = await runAudit(input, [failing("perplexity")]);
  assert.equal(result.engines[0].status, "error");
  assert.match(result.engines[0].detail, /429/);
  assert.equal(result.measuredCount, 0);
});

test("la panne d'un moteur n'empêche pas les autres", async () => {
  const result = await runAudit(input, [
    failing("perplexity"),
    answering("claude", ["ma-boite.fr"]),
  ]);
  assert.deepEqual(
    result.engines.map((e) => e.status),
    ["error", "cited"],
  );
  assert.equal(result.citedCount, 1);
  assert.equal(result.measuredCount, 1);
});

test("le score mélangé se lit « cités sur mesurés »", async () => {
  const result = await runAudit(input, [
    answering("claude", ["ma-boite.fr"]),
    answering("perplexity", ["concurrent.fr"]),
    unconfigured("chatgpt"),
    unimplemented("gemini"),
  ]);
  assert.equal(result.citedCount, 1);
  assert.equal(result.measuredCount, 2, "seuls les deux moteurs interrogés comptent");
  assert.equal(result.mode, "live");
});

test("l'ordre d'affichage suit le registre, pas le résultat", async () => {
  const result = await runAudit(input, [
    unconfigured("chatgpt"),
    answering("claude", ["ma-boite.fr"]),
    unimplemented("gemini"),
  ]);
  assert.deepEqual(
    result.engines.map((e) => e.engine),
    ["chatgpt", "claude", "gemini"],
  );
});

test("les six questions sont bien posées à chaque moteur", async () => {
  const result = await runAudit(input, [answering("claude", ["concurrent.fr"])]);
  assert.equal(result.prompts.length, 6);
  assert.equal(result.engines[0].prompts.length, 6);
});
