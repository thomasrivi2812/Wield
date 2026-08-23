import assert from "node:assert/strict";
import test from "node:test";
import { ALIASES, REQUIREMENTS, findMisnamed, findMissingPrefix } from "./env-names";

test("chaque alias pointe vers une variable réellement attendue", () => {
  const expected = new Set(REQUIREMENTS.map((r) => r.name));
  for (const target of Object.values(ALIASES)) {
    assert.ok(expected.has(target), `${target} n'est pas dans REQUIREMENTS`);
  }
});

test("aucun alias ne porte le nom d’une variable attendue", () => {
  const expected = new Set(REQUIREMENTS.map((r) => r.name));
  for (const found of Object.keys(ALIASES)) {
    if (found === "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") continue; // piège volontaire
    assert.equal(expected.has(found), false, `${found} est à la fois attendu et fautif`);
  }
});

test("SUPABASE_URL est signalée quand la bonne manque", () => {
  assert.deepEqual(findMisnamed(new Set(["SUPABASE_URL"])), [
    { found: "SUPABASE_URL", expected: "NEXT_PUBLIC_SUPABASE_URL" },
  ]);
});

test("rien à signaler quand la bonne variable est là aussi", () => {
  const present = new Set(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  assert.deepEqual(findMisnamed(present), []);
});

test("une clé de service préfixée NEXT_PUBLIC_ est signalée", () => {
  assert.deepEqual(findMisnamed(new Set(["NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"])), [
    { found: "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", expected: "SUPABASE_SERVICE_ROLE_KEY" },
  ]);
});

test("un préfixe NEXT_PUBLIC_ oublié est repéré", () => {
  assert.deepEqual(findMissingPrefix(new Set(["AUTH_PROVIDERS"])), []);
  assert.deepEqual(findMissingPrefix(new Set(["SITE_URL"])), []);
});

test("aucun faux positif sur un environnement correct", () => {
  const present = new Set(REQUIREMENTS.map((r) => r.name));
  assert.deepEqual(findMisnamed(present), []);
  assert.deepEqual(findMissingPrefix(present), []);
});

test("un environnement vide ne signale rien", () => {
  assert.deepEqual(findMisnamed(new Set()), []);
  assert.deepEqual(findMissingPrefix(new Set()), []);
});
