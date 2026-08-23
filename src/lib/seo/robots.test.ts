import assert from "node:assert/strict";
import test from "node:test";
import { isAllowed, parseRobots } from "./robots";

test("sans robots.txt, tout est autorisé", () => {
  assert.equal(isAllowed(parseRobots(""), "GPTBot"), true);
});

test("Disallow: / bloque l'agent visé", () => {
  const robots = parseRobots("User-agent: GPTBot\nDisallow: /");
  assert.equal(isAllowed(robots, "GPTBot"), false);
  assert.equal(isAllowed(robots, "ClaudeBot"), true);
});

test("Disallow vide autorise tout, à l'inverse de Disallow: /", () => {
  assert.equal(
    isAllowed(parseRobots("User-agent: *\nDisallow:"), "GPTBot"),
    true,
  );
});

test("le groupe nommé l'emporte sur l'étoile", () => {
  const robots = parseRobots(
    "User-agent: *\nDisallow: /\n\nUser-agent: ClaudeBot\nAllow: /",
  );
  assert.equal(isAllowed(robots, "ClaudeBot"), true);
  assert.equal(isAllowed(robots, "PerplexityBot"), false);
});

test("plusieurs User-agent qui se suivent partagent les règles", () => {
  const robots = parseRobots(
    "User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /",
  );
  assert.equal(isAllowed(robots, "GPTBot"), false);
  assert.equal(isAllowed(robots, "ClaudeBot"), false);
});

test("la règle la plus longue gagne", () => {
  const robots = parseRobots(
    "User-agent: *\nDisallow: /blog\nAllow: /blog/public",
  );
  assert.equal(isAllowed(robots, "GPTBot", "/blog/prive"), false);
  assert.equal(isAllowed(robots, "GPTBot", "/blog/public/a"), true);
});

test("à longueur égale, Allow l'emporte", () => {
  const robots = parseRobots("User-agent: *\nDisallow: /a\nAllow: /a");
  assert.equal(isAllowed(robots, "GPTBot", "/a"), true);
});

test("le joker et le dollar sont appliqués", () => {
  const robots = parseRobots("User-agent: *\nDisallow: /*.pdf$");
  assert.equal(isAllowed(robots, "GPTBot", "/doc/notice.pdf"), false);
  assert.equal(isAllowed(robots, "GPTBot", "/doc/notice.pdf.html"), true);
});

test("la casse de l'agent est ignorée", () => {
  const robots = parseRobots("user-agent: gptbot\ndisallow: /");
  assert.equal(isAllowed(robots, "GPTBot"), false);
});

test("les commentaires sont ignorés", () => {
  const robots = parseRobots("# bloc\nUser-agent: * # tous\nDisallow: / # tout");
  assert.equal(isAllowed(robots, "GPTBot"), false);
});

test("les sitemaps sont collectés", () => {
  assert.deepEqual(
    parseRobots("Sitemap: https://a.fr/sitemap.xml\nUser-agent: *\nDisallow:")
      .sitemaps,
    ["https://a.fr/sitemap.xml"],
  );
});
