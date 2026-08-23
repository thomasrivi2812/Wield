import assert from "node:assert/strict";
import test from "node:test";
import { streamAudit, type AuditEvent } from "./api";

/** Sert un flux découpé exactement aux endroits demandés. */
function serve(chunks: Uint8Array[], ok = true, body?: unknown) {
  globalThis.fetch = (async () => {
    if (!ok) {
      return {
        ok: false,
        json: async () => body,
      } as unknown as Response;
    }
    return {
      ok: true,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      }),
    } as unknown as Response;
  }) as typeof fetch;
}

const enc = (s: string) => new TextEncoder().encode(s);

const LINES =
  '{"type":"start","prompts":["a"],"engines":[]}\n' +
  '{"type":"prompt","engine":"chatgpt","index":0,"cited":true}\n' +
  '{"type":"done","id":"x","query":"menuiserie à Nîmes","mode":"live","citedCount":1,"measuredCount":1,"promptCount":6,"engines":[]}\n';

async function collect(chunks: Uint8Array[]): Promise<AuditEvent[]> {
  const events: AuditEvent[] = [];
  await streamAudit({ query: "test" }, (e) => events.push(e));
  return events;
}

test("un bloc par ligne", async () => {
  serve(LINES.split("\n").filter(Boolean).map((l) => enc(`${l}\n`)));
  const events = await collect([]);
  assert.deepEqual(events.map((e) => e.type), ["start", "prompt", "done"]);
});

test("tout en un seul bloc", async () => {
  serve([enc(LINES)]);
  assert.equal((await collect([])).length, 3);
});

test("des blocs coupés au milieu des lignes", async () => {
  const bytes = enc(LINES);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += 7) chunks.push(bytes.slice(i, i + 7));
  serve(chunks);
  const events = await collect([]);
  assert.deepEqual(events.map((e) => e.type), ["start", "prompt", "done"]);
});

test("un caractère accentué coupé entre deux blocs reste intact", async () => {
  const bytes = enc(LINES);
  // Le « î » de Nîmes fait deux octets : on coupe entre les deux.
  const split = bytes.indexOf(0xc3, bytes.indexOf(enc("Nimes")[0]));
  const cut = split > 0 ? split + 1 : Math.floor(bytes.length / 2);
  serve([bytes.slice(0, cut), bytes.slice(cut)]);

  const events = await collect([]);
  const done = events.find((e) => e.type === "done");
  assert.ok(done && done.type === "done");
  assert.equal(done.query, "menuiserie à Nîmes");
});

test("dernière ligne sans saut de ligne final", async () => {
  serve([enc(LINES.trimEnd())]);
  assert.equal((await collect([])).length, 3);
});

test("une ligne illisible n'interrompt pas le flux", async () => {
  serve([enc('{"type":"start","prompts":[],"engines":[]}\nPAS DU JSON\n{"type":"error","message":"fin"}\n')]);
  const events = await collect([]);
  assert.deepEqual(events.map((e) => e.type), ["start", "error"]);
});

test("un refus immédiat remonte son message, pas une erreur générique", async () => {
  serve([], false, { error: "Trop d’audits depuis cette adresse." });
  await assert.rejects(
    () => streamAudit({ query: "test" }, () => {}),
    /Trop d’audits/,
  );
});
