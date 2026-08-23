import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL, reduce, type State } from "./audit-flow";

const start = {
  type: "start" as const,
  prompts: ["q1", "q2", "q3"],
  engines: [
    { engine: "chatgpt" as const, label: "ChatGPT", willQuery: true },
    { engine: "gemini" as const, label: "Gemini", willQuery: false },
  ],
};

const run = (...events: Parameters<typeof reduce>[1][]): State =>
  events.reduce(reduce, INITIAL);

test("avant le premier événement, on ne prétend rien savoir", () => {
  assert.equal(INITIAL.phase, "connecting");
  assert.deepEqual(INITIAL.engines, []);
});

test("le départ fixe le nombre de questions et les moteurs", () => {
  const state = run(start);
  assert.equal(state.phase, "running");
  assert.equal(state.promptCount, 3);
  assert.deepEqual(state.engines.map((e) => e.willQuery), [true, false]);
});

test("chaque réponse s'ajoute au bon moteur, dans l'ordre", () => {
  const state = run(
    start,
    { type: "prompt", engine: "chatgpt", index: 0, cited: false },
    { type: "prompt", engine: "chatgpt", index: 1, cited: true },
  );
  assert.deepEqual(state.engines[0].answers, [false, true]);
  assert.deepEqual(state.engines[1].answers, []);
});

test("le verdict d'un moteur n'efface pas ses réponses", () => {
  const state = run(
    start,
    { type: "prompt", engine: "chatgpt", index: 0, cited: true },
    { type: "engine", engine: "chatgpt", status: "cited", detail: "2ᵉ source" },
  );
  assert.deepEqual(state.engines[0].answers, [true]);
  assert.equal(state.engines[0].status, "cited");
});

test("un moteur inconnu dans le flux ne casse rien", () => {
  const state = run(start, {
    type: "prompt",
    engine: "perplexity",
    index: 0,
    cited: true,
  });
  assert.deepEqual(state.engines.map((e) => e.answers.length), [0, 0]);
});

test("audit enregistré : on passe à l'ouverture du résultat", () => {
  const state = run(start, {
    type: "done",
    id: "abc",
    query: "q",
    mode: "live",
    citedCount: 1,
    measuredCount: 1,
    promptCount: 3,
    engines: [],
  });
  assert.equal(state.phase, "saving");
  assert.equal(state.result?.id, "abc");
});

test("audit non enregistré : on montre le score sans prétendre avoir une URL", () => {
  const state = run(start, {
    type: "done",
    id: null,
    query: "q",
    mode: "demo",
    citedCount: 0,
    measuredCount: 0,
    promptCount: 3,
    engines: [],
  });
  assert.equal(state.phase, "orphan");
});

test("une erreur du flux porte son message", () => {
  const state = run(start, { type: "error", message: "plafond atteint" });
  assert.equal(state.phase, "error");
  assert.equal(state.message, "plafond atteint");
});

test("une panne réseau, hors flux, mène au même écran", () => {
  const state = run(start, { type: "failed", message: "réseau coupé" });
  assert.equal(state.phase, "error");
  assert.equal(state.message, "réseau coupé");
});
