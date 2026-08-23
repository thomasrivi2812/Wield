import assert from "node:assert/strict";
import test from "node:test";
import { toOrigin } from "./scan";

test("un domaine nu devient une origine https", () => {
  assert.equal(toOrigin("exemple.fr"), "https://exemple.fr");
  assert.equal(toOrigin("  www.exemple.fr  "), "https://www.exemple.fr");
});

test("une URL complète est ramenée à son origine", () => {
  assert.equal(toOrigin("https://exemple.fr/a/b?x=1"), "https://exemple.fr");
  assert.equal(toOrigin("http://exemple.fr"), "http://exemple.fr");
});

test("ce qui n'est pas un domaine est refusé", () => {
  for (const bad of ["", "   ", "localhost", "javascript:alert(1)", "au secours"]) {
    assert.equal(toOrigin(bad), null, bad);
  }
});
