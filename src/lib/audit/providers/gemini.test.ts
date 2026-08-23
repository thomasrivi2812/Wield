import assert from "node:assert/strict";
import test from "node:test";
import type { GenerateContentResponse } from "@google/genai";
import { parseGemini } from "./parse";

const build = (chunks: unknown[], text?: string) =>
  ({
    text,
    candidates: [{ groundingMetadata: { groundingChunks: chunks } }],
  }) as unknown as GenerateContentResponse;

test("collecte les fragments web de l'ancrage", () => {
  const answer = parseGemini(
    build(
      [
        { web: { uri: "https://www.concurrent-a.fr/x", title: "Concurrent A" } },
        { web: { uri: "https://ma-boite.fr", title: "Ma boîte" } },
      ],
      "Voici deux entreprises.",
    ),
  );
  assert.equal(answer.text, "Voici deux entreprises.");
  assert.deepEqual(
    answer.sources.map((s: { domain: string }) => s.domain),
    ["concurrent-a.fr", "ma-boite.fr"],
  );
});

test("ignore les fragments sans URL exploitable", () => {
  // Un fragment peut venir d'une carte ou d'une image : pas de source web.
  const answer = parseGemini(
    build([
      { maps: { title: "Un lieu" } },
      { web: { title: "Sans uri" } },
      { web: { uri: "https://a.fr", title: "A" } },
    ]),
  );
  assert.deepEqual(
    answer.sources.map((s: { domain: string }) => s.domain),
    ["a.fr"],
  );
});

test("déduplique les URL répétées", () => {
  const answer = parseGemini(
    build([
      { web: { uri: "https://a.fr", title: "A" } },
      { web: { uri: "https://a.fr", title: "A" } },
    ]),
  );
  assert.equal(answer.sources.length, 1);
});

test("une réponse sans ancrage reste exploitable", () => {
  assert.deepEqual(
    parseGemini({ text: "x", candidates: [] } as unknown as GenerateContentResponse),
    { text: "x", sources: [] },
  );
});

test("le titre retombe sur l'URL quand il manque", () => {
  const answer = parseGemini(build([{ web: { uri: "https://a.fr" } }]));
  assert.equal(answer.sources[0].title, "https://a.fr");
});
