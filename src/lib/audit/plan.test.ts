import assert from "node:assert/strict";
import test from "node:test";
import { buildPlan, rankWinners, type PlanInput, type PlanPrompt } from "./plan";

const prompt = (over: Partial<PlanPrompt> = {}): PlanPrompt => ({
  prompt: "Quel prestataire fiable pour la menuiserie ?",
  engine: "chatgpt",
  cited: false,
  position: null,
  winners: [],
  ...over,
});

const base = (over: Partial<PlanInput> = {}): PlanInput => ({
  query: "menuiserie industrielle à Lyon",
  citedCount: 0,
  measuredCount: 2,
  engines: [
    { engine: "chatgpt", label: "ChatGPT", status: "absent" },
    { engine: "claude", label: "Claude", status: "absent" },
  ],
  prompts: [prompt()],
  ...over,
});

test("rien de mesuré, donc rien à vendre", () => {
  assert.deepEqual(buildPlan(base({ measuredCount: 0 })), []);
});

test("chaque action porte un constat", () => {
  const plan = buildPlan(
    base({
      prompts: [
        prompt({ winners: ["concurrent-a.fr", "pagesjaunes.fr"] }),
        prompt({ winners: ["pagesjaunes.fr"] }),
      ],
    }),
  );

  assert.ok(plan.length > 0);
  for (const action of plan) {
    assert.ok(action.evidence.trim().length > 0, `sans constat : ${action.title}`);
  }
});

test("zéro citation ouvre sur l'absence, en priorité haute", () => {
  const [first] = buildPlan(base());
  assert.equal(first.priority, "haute");
  assert.match(first.evidence, /0 citation sur 2 moteurs/);
});

test("le compte des domaines ignore les répétitions dans une même réponse", () => {
  assert.deepEqual(
    rankWinners([
      prompt({ winners: ["www.Concurrent-A.fr", "concurrent-a.fr"] }),
      prompt({ winners: ["concurrent-a.fr", "autre.fr"] }),
    ]),
    [
      { domain: "concurrent-a.fr", count: 2 },
      { domain: "autre.fr", count: 1 },
    ],
  );
});

test("des annuaires en tête donnent un conseil d'annuaire, pas de contenu", () => {
  const plan = buildPlan(
    base({
      prompts: [
        prompt({ winners: ["pagesjaunes.fr", "societe.com"] }),
        prompt({ winners: ["pagesjaunes.fr"] }),
      ],
    }),
  );
  const action = plan.find((a) => a.title.includes("annuaires"));
  assert.ok(action, "l'action annuaire manque");
  assert.match(action.evidence, /pagesjaunes\.fr \(2×\)/);
});

test("un sous-domaine d'annuaire compte comme un annuaire", () => {
  const plan = buildPlan(
    base({ prompts: [prompt({ winners: ["fr.linkedin.com"] })] }),
  );
  assert.ok(plan.some((a) => a.title.includes("annuaires")));
});

test("cité mais loin déclenche le conseil de position", () => {
  const plan = buildPlan(
    base({
      citedCount: 1,
      engines: [
        { engine: "chatgpt", label: "ChatGPT", status: "cited" },
        { engine: "claude", label: "Claude", status: "absent" },
      ],
      prompts: [prompt({ cited: true, position: 6, winners: ["a.fr"] })],
    }),
  );
  const action = plan.find((a) => a.title.includes("Remonter"));
  assert.ok(action);
  assert.match(action.evidence, /6ᵉ source/);
});

test("cité en première source ne déclenche pas le conseil de position", () => {
  const plan = buildPlan(
    base({
      citedCount: 1,
      engines: [{ engine: "chatgpt", label: "ChatGPT", status: "cited" }],
      measuredCount: 1,
      prompts: [prompt({ cited: true, position: 1 })],
    }),
  );
  assert.equal(plan.find((a) => a.title.includes("Remonter")), undefined);
});

test("un moteur muet parmi d'autres est nommé", () => {
  const plan = buildPlan(
    base({
      citedCount: 1,
      engines: [
        { engine: "chatgpt", label: "ChatGPT", status: "cited" },
        { engine: "claude", label: "Claude", status: "absent" },
        { engine: "gemini", label: "Gemini", status: "not_configured" },
      ],
      prompts: [prompt({ cited: true, position: 1 })],
    }),
  );
  const action = plan.find((a) => a.title.includes("Claude"));
  assert.ok(action, "Claude devrait être nommé");
  // Gemini n'a pas été interrogé : il n'a rien à faire dans le diagnostic.
  assert.ok(!action.title.includes("Gemini"));
});

test("tous les moteurs muets : pas d'action « écart entre moteurs »", () => {
  const plan = buildPlan(base());
  assert.equal(
    plan.find((a) => a.title.startsWith("Traiter le cas")),
    undefined,
  );
});

test("les questions manquées sont reprises telles quelles", () => {
  const plan = buildPlan(
    base({ prompts: [prompt({ prompt: "Qui fabrique des agencements bois ?" })] }),
  );
  const action = plan.find((a) => a.title.includes("plan de contenu"));
  assert.ok(action);
  assert.match(action.body, /— Qui fabrique des agencements bois \?/);
});

test("une même question posée à deux moteurs n'apparaît qu'une fois", () => {
  const plan = buildPlan(
    base({
      prompts: [
        prompt({ engine: "chatgpt", prompt: "Même question ?" }),
        prompt({ engine: "claude", prompt: "Même question ?" }),
      ],
    }),
  );
  const action = plan.find((a) => a.title.includes("plan de contenu"));
  assert.ok(action);
  assert.equal(action.body.match(/— Même question \?/g)?.length, 1);
  assert.match(action.evidence, /^1 question sans citation/);
});
