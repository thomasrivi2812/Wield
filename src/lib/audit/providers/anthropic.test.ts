import assert from "node:assert/strict";
import test from "node:test";
import type { ContentBlock } from "@anthropic-ai/sdk/resources/messages";
import { parseAnthropic } from "./parse";

const searchResult = (url: string, title: string) => ({
  type: "web_search_result" as const,
  url,
  title,
  encrypted_content: "",
  page_age: null,
});

const resultBlock = (content: unknown): ContentBlock =>
  ({
    type: "web_search_tool_result",
    tool_use_id: "srvtoolu_1",
    caller: { type: "direct" },
    content,
  }) as unknown as ContentBlock;

const textBlock = (text: string): ContentBlock =>
  ({ type: "text", text, citations: null }) as unknown as ContentBlock;

test("concatène les blocs de texte et collecte les sources", () => {
  const answer = parseAnthropic([
    resultBlock([
      searchResult("https://www.concurrent-a.fr/page", "Concurrent A"),
      searchResult("https://ma-boite.fr", "Ma boîte"),
    ]),
    textBlock("Voici deux entreprises."),
    textBlock("La première est la plus citée."),
  ]);

  assert.equal(answer.text, "Voici deux entreprises.\nLa première est la plus citée.");
  assert.deepEqual(
    answer.sources.map((s: { domain: string }) => s.domain),
    ["concurrent-a.fr", "ma-boite.fr"],
  );
});

test("traverse un résultat de recherche en erreur sans planter", () => {
  // Les erreurs d'outil serveur ne lèvent pas : elles arrivent en HTTP 200
  // avec un objet d'erreur à la place de la liste de résultats.
  const answer = parseAnthropic([
    resultBlock({ type: "web_search_tool_result_error", error_code: "max_uses_exceeded" }),
    textBlock("Je n'ai pas pu chercher."),
  ]);

  assert.equal(answer.text, "Je n'ai pas pu chercher.");
  assert.deepEqual(answer.sources, []);
});

test("ignore les blocs inconnus", () => {
  const answer = parseAnthropic([
    { type: "thinking", thinking: "", signature: "" } as unknown as ContentBlock,
    textBlock("Réponse."),
  ]);

  assert.equal(answer.text, "Réponse.");
  assert.deepEqual(answer.sources, []);
});

test("une réponse sans texte ni source reste exploitable", () => {
  assert.deepEqual(parseAnthropic([]), { text: "", sources: [] });
});
