import assert from "node:assert/strict";
import test from "node:test";
import { detectCitation, normalize, toDomain } from "./detect";

const src = (url: string) => ({ title: url, url, domain: toDomain(url) });

test("toDomain retire le www et la casse", () => {
  assert.equal(toDomain("https://www.Exemple.FR/page?x=1"), "exemple.fr");
});

test("normalize retire accents et ponctuation", () => {
  assert.equal(normalize("Menuiserie Générale, Lyon"), "menuiserie generale lyon");
});

test("le domaine cité donne le rang et écarte la marque des concurrents", () => {
  assert.deepEqual(
    detectCitation(
      {
        text: "Voici trois entreprises.",
        sources: [src("https://concurrent-a.fr"), src("https://ma-boite.fr/a")],
      },
      undefined,
      "ma-boite.fr",
    ),
    { cited: true, position: 2, winners: ["concurrent-a.fr"] },
  );
});

test("un sous-domaine compte comme la marque", () => {
  assert.deepEqual(
    detectCitation(
      { text: "", sources: [src("https://boutique.ma-boite.fr/x")] },
      undefined,
      "ma-boite.fr",
    ),
    { cited: true, position: 1, winners: [] },
  );
});

test("la marque nommée dans le texte compte, sans rang", () => {
  assert.deepEqual(
    detectCitation(
      {
        text: "Je recommande Menuiserie Exemple pour ce type de projet.",
        sources: [src("https://annuaire.fr")],
      },
      "Menuiserie Exemple",
      "ma-boite.fr",
    ),
    { cited: true, position: null, winners: ["annuaire.fr"] },
  );
});

test("sans aucun des deux signaux, la marque est absente", () => {
  assert.deepEqual(
    detectCitation(
      {
        text: "Je recommande Concurrent A et Concurrent B.",
        sources: [src("https://concurrent-a.fr"), src("https://concurrent-b.com")],
      },
      "Menuiserie Exemple",
      "ma-boite.fr",
    ),
    {
      cited: false,
      position: null,
      winners: ["concurrent-a.fr", "concurrent-b.com"],
    },
  );
});

test("sans marque ni domaine, on ne conclut jamais « cité »", () => {
  assert.deepEqual(
    detectCitation({ text: "Trois entreprises ressortent.", sources: [src("https://x.fr")] }),
    { cited: false, position: null, winners: ["x.fr"] },
  );
});

test("un mot isolé ne déclenche pas de faux positif", () => {
  assert.deepEqual(
    detectCitation(
      { text: "Les entreprises d'agencement sont nombreuses en Rhône-Alpes.", sources: [] },
      "Agencements",
      undefined,
    ),
    { cited: false, position: null, winners: [] },
  );
});

test("les domaines répétés sont fusionnés", () => {
  assert.deepEqual(
    detectCitation(
      {
        text: "",
        sources: [src("https://a.fr/1"), src("https://a.fr/2"), src("https://b.fr")],
      },
      undefined,
      "moi.fr",
    ),
    { cited: false, position: null, winners: ["a.fr", "b.fr"] },
  );
});
