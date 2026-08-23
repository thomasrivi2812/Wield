import assert from "node:assert/strict";
import test from "node:test";
import { safeNext } from "./safe-next";

test("un chemin interne passe tel quel", () => {
  assert.equal(safeNext("/guides"), "/guides");
  assert.equal(safeNext("/audit?q=abc&d=x.fr"), "/audit?q=abc&d=x.fr");
});

test("une valeur absente retombe sur la destination par défaut", () => {
  assert.equal(safeNext(null), "/espace");
  assert.equal(safeNext(undefined), "/espace");
  assert.equal(safeNext(""), "/espace");
});

test("une URL absolue est refusée", () => {
  assert.equal(safeNext("https://evil.com"), "/espace");
  assert.equal(safeNext("http://evil.com/x"), "/espace");
});

test("la double barre oblique est refusée", () => {
  assert.equal(safeNext("//evil.com"), "/espace");
  assert.equal(safeNext("//evil.com/path"), "/espace");
});

test("la barre inversée est refusée", () => {
  assert.equal(safeNext("/\\evil.com"), "/espace");
});

test("un schéma glissé dans le chemin est refusé", () => {
  assert.equal(safeNext("/javascript:alert(1)"), "/espace");
  assert.equal(safeNext("/data:text/html,x"), "/espace");
});

test("un chemin relatif sans barre est refusé", () => {
  assert.equal(safeNext("guides"), "/espace");
  assert.equal(safeNext("../admin"), "/espace");
});
