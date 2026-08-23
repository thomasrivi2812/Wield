import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "openai/resources/responses/responses";
import { parseOpenAI } from "./parse";

const citation = (url: string, title: string) => ({
  type: "url_citation" as const,
  url,
  title,
  start_index: 0,
  end_index: 1,
});

const message = (text: string, annotations: unknown[]) =>
  ({
    type: "message",
    id: "msg_1",
    role: "assistant",
    status: "completed",
    content: [{ type: "output_text", text, annotations, logprobs: [] }],
  }) as unknown as Response["output"][number];

const response = (
  output: Response["output"],
  outputText = "",
): Response => ({ output, output_text: outputText }) as unknown as Response;

test("collecte les citations posées sur le texte", () => {
  const answer = parseOpenAI(
    response(
      [
        message("Voici deux entreprises.", [
          citation("https://www.concurrent-a.fr/x", "Concurrent A"),
          citation("https://ma-boite.fr", "Ma boîte"),
        ]),
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

test("déduplique une même URL citée plusieurs fois", () => {
  const answer = parseOpenAI(
    response([
      message("a", [citation("https://a.fr", "A"), citation("https://a.fr", "A")]),
      message("b", [citation("https://a.fr", "A")]),
    ]),
  );
  assert.equal(answer.sources.length, 1);
});

test("ignore les éléments de sortie qui ne sont pas des messages", () => {
  const answer = parseOpenAI(
    response(
      [
        { type: "web_search_call", id: "ws_1", status: "completed" } as unknown as Response["output"][number],
        message("Réponse.", []),
      ],
      "Réponse.",
    ),
  );
  assert.equal(answer.text, "Réponse.");
  assert.deepEqual(answer.sources, []);
});

test("une réponse sans sortie reste exploitable", () => {
  assert.deepEqual(parseOpenAI(response([])), { text: "", sources: [] });
});
