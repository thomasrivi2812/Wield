import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG,
  GUIDE_SKUS,
  formatPrice,
  isSku,
  packListPrice,
} from "./catalog";

test("chaque référence porte sa propre clé", () => {
  for (const [key, product] of Object.entries(CATALOG)) {
    assert.equal(product.sku, key, `clé ${key} incohérente`);
  }
});

test("aucun prix nul ou négatif, et tous en centimes entiers", () => {
  for (const product of Object.values(CATALOG)) {
    assert.ok(product.amountCents > 0, `${product.sku} : prix invalide`);
    assert.equal(
      Number.isInteger(product.amountCents),
      true,
      `${product.sku} : les centimes doivent être entiers`,
    );
  }
});

test("le Brief est le seul abonnement", () => {
  const subs = Object.values(CATALOG).filter((p) => p.mode === "subscription");
  assert.deepEqual(
    subs.map((p) => p.sku),
    ["brief"],
  );
});

test("les guides listés existent tous au catalogue", () => {
  for (const sku of GUIDE_SKUS) {
    assert.ok(CATALOG[sku], `${sku} absent du catalogue`);
    assert.equal(CATALOG[sku].kind, "guide");
  }
});

test("le pack coûte moins cher que son contenu à l’unité", () => {
  assert.ok(
    CATALOG.pack.amountCents < packListPrice(),
    "un pack plus cher que le détail n’a pas de sens",
  );
});

test("le prix affiché n’invente pas de décimales", () => {
  // Le format fr-FR insère une espace insécable avant le symbole, et le
  // caractère exact dépend de la version d'ICU. On compare donc à espace
  // normalisée : ce qui compte ici, ce sont les chiffres et la virgule.
  const plain = (cents: number) => formatPrice(cents).replace(/\s/gu, " ");

  assert.equal(plain(299), "2,99 €");
  assert.equal(plain(1000), "10 €");
  assert.equal(plain(2900), "29 €");
  assert.equal(plain(12900), "129 €");
});

test("isSku refuse ce qui n’est pas au catalogue", () => {
  assert.equal(isSku("report_geo"), true);
  assert.equal(isSku("gratuit"), false);
  assert.equal(isSku(""), false);
  assert.equal(isSku(null), false);
  assert.equal(isSku("constructor"), false);
});
