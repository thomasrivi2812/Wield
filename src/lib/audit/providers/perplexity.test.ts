import assert from "node:assert/strict";
import test from "node:test";
import { parsePerplexity, type PerplexityCompletion } from "./parse";

const build = (content: unknown, searchResults: unknown[] | null) =>
  ({
    choices: [{ index: 0, message: { role: "assistant", content } }],
    search_results: searchResults,
  }) as unknown as PerplexityCompletion;

test("lit un contenu en chaîne et les sources dédiées", () => {
  const answer = parsePerplexity(
    build("Voici deux entreprises.", [
      { title: "Concurrent A", url: "https://www.concurrent-a.fr/x" },
      { title: "Ma boîte", url: "https://ma-boite.fr" },
    ]),
  );
  assert.equal(answer.text, "Voici deux entreprises.");
  assert.deepEqual(
    answer.sources.map((s: { domain: string }) => s.domain),
    ["concurrent-a.fr", "ma-boite.fr"],
  );
});

test("lit un contenu découpé en fragments", () => {
  const answer = parsePerplexity(
    build(
      [
        { type: "text", text: "Deux " },
        { type: "text", text: "entreprises." },
      ],
      [],
    ),
  );
  assert.equal(answer.text, "Deux entreprises.");
});

test("déduplique les sources", () => {
  const answer = parsePerplexity(
    build("x", [
      { title: "A", url: "https://a.fr" },
      { title: "A bis", url: "https://a.fr" },
    ]),
  );
  assert.equal(answer.sources.length, 1);
});

test("supporte l'absence de sources et de contenu", () => {
  assert.deepEqual(parsePerplexity(build(null, null)), { text: "", sources: [] });
});

test("une source sans URL est ignorée", () => {
  const answer = parsePerplexity(build("x", [{ title: "Sans lien" }]));
  assert.deepEqual(answer.sources, []);
});
