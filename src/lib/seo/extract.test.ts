import assert from "node:assert/strict";
import test from "node:test";
import { extract } from "./extract";

test("titre, description, canonique et langue", () => {
  const out = extract(`
    <html lang="fr"><head>
      <title>Menuiserie Dupont &amp; Fils</title>
      <meta name="description" content="Agencement sur mesure à Lyon.">
      <link rel="canonical" href="https://dupont.fr/">
    </head><body><h1>Menuiserie</h1></body></html>`);

  assert.equal(out.title, "Menuiserie Dupont & Fils");
  assert.equal(out.description, "Agencement sur mesure à Lyon.");
  assert.equal(out.canonical, "https://dupont.fr/");
  assert.equal(out.lang, "fr");
  assert.deepEqual(out.h1, ["Menuiserie"]);
});

test("les attributs en apostrophes ou sans guillemets sont lus", () => {
  assert.equal(extract("<html lang=fr><head></head>").lang, "fr");
  assert.equal(
    extract(`<head><meta name='description' content='Salut'></head>`).description,
    "Salut",
  );
});

test("og:description n'est pas la meta description", () => {
  assert.equal(
    extract(`<head><meta property="og:description" content="X"></head>`)
      .description,
    null,
  );
});

test("les H1 multiples sont tous comptés, balises internes retirées", () => {
  const out = extract("<h1>Un <span>titre</span></h1><h1>Deux</h1>");
  assert.deepEqual(out.h1, ["Un titre", "Deux"]);
});

test("les types JSON-LD sont collectés, y compris dans un @graph", () => {
  const out = extract(`<script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"Organization","name":"A"},
      {"@type":["LocalBusiness","Store"]}]}
  </script>`);
  assert.deepEqual(out.schemaTypes, ["LocalBusiness", "Organization", "Store"]);
  assert.equal(out.brokenSchema, 0);
});

test("un JSON-LD illisible est signalé, pas ignoré en silence", () => {
  const out = extract(
    `<script type="application/ld+json">{ pas du json }</script>`,
  );
  assert.deepEqual(out.schemaTypes, []);
  assert.equal(out.brokenSchema, 1);
});

test("le script n'entre pas dans le texte visible", () => {
  const out = extract(
    "<body><script>var x = 'beaucoup de code ici vraiment';</script><p>Bonjour</p></body>",
  );
  assert.equal(out.textLength, "Bonjour".length);
});

test("un document vide ne fabrique rien", () => {
  const out = extract("");
  assert.deepEqual(out, {
    title: null,
    description: null,
    h1: [],
    canonical: null,
    lang: null,
    schemaTypes: [],
    brokenSchema: 0,
    textLength: 0,
  });
});
