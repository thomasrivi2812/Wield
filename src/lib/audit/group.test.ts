import assert from "node:assert/strict";
import test from "node:test";
import { groupPrompts } from "./group";
import type { StoredPrompt } from "./store";

const row = (over: Partial<StoredPrompt>): StoredPrompt => ({
  engine: "chatgpt",
  prompt: "Quel prestataire ?",
  cited: false,
  position: null,
  winners: [],
  ...over,
});

const LABELS = { chatgpt: "ChatGPT", claude: "Claude" };

test("une question posée à deux moteurs donne une seule ligne", () => {
  const grouped = groupPrompts(
    [
      row({ engine: "chatgpt", cited: true, position: 2 }),
      row({ engine: "claude", cited: false }),
    ],
    LABELS,
  );

  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0].citedBy, ["ChatGPT"]);
  assert.deepEqual(grouped[0].absentFrom, ["Claude"]);
  assert.equal(grouped[0].bestPosition, 2);
});

test("la meilleure position gagne", () => {
  const grouped = groupPrompts([
    row({ engine: "chatgpt", cited: true, position: 5 }),
    row({ engine: "claude", cited: true, position: 1 }),
  ]);
  assert.equal(grouped[0].bestPosition, 1);
});

test("les domaines sont dédoublonnés et normalisés", () => {
  const grouped = groupPrompts([
    row({ engine: "chatgpt", winners: ["www.A.fr", "b.fr"] }),
    row({ engine: "claude", winners: ["a.fr"] }),
  ]);
  assert.deepEqual(grouped[0].winners, ["a.fr", "b.fr"]);
});

test("l'ordre des questions est conservé", () => {
  const grouped = groupPrompts([
    row({ prompt: "B" }),
    row({ prompt: "A" }),
    row({ prompt: "B", engine: "claude" }),
  ]);
  assert.deepEqual(grouped.map((g) => g.prompt), ["B", "A"]);
});

test("une position absente ne fabrique pas de rang", () => {
  const grouped = groupPrompts([row({ cited: true, position: null })]);
  assert.equal(grouped[0].bestPosition, null);
});

test("aucune donnée, aucune ligne", () => {
  assert.deepEqual(groupPrompts([]), []);
});
