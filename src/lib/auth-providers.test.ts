import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_PROVIDER_IDS,
  DEFAULT_PROVIDERS,
  PROVIDERS,
  isProviderId,
  parseEnabledProviders,
} from "./auth-providers";

test("chaque fournisseur porte sa propre clé", () => {
  for (const [key, info] of Object.entries(PROVIDERS)) {
    assert.equal(info.id, key);
    assert.ok(info.label.length > 0);
  }
});

test("variable absente : on retombe sur le défaut, pas sur rien", () => {
  // Ne rien afficher parce qu'une variable n'a pas été renseignée serait une
  // régression silencieuse sur un déploiement qui marchait.
  assert.deepEqual(parseEnabledProviders(undefined), DEFAULT_PROVIDERS);
  assert.deepEqual(parseEnabledProviders(null), DEFAULT_PROVIDERS);
});

test("variable vide : aucun fournisseur, volontairement", () => {
  assert.deepEqual(parseEnabledProviders(""), []);
  assert.deepEqual(parseEnabledProviders("   "), []);
});

test("le défaut renvoyé est une copie, pas la liste partagée", () => {
  const first = parseEnabledProviders(undefined);
  first.push("apple");
  assert.deepEqual(parseEnabledProviders(undefined), DEFAULT_PROVIDERS);
});

test("l’ordre déclaré est respecté", () => {
  assert.deepEqual(parseEnabledProviders("azure,google"), ["azure", "google"]);
  assert.deepEqual(parseEnabledProviders("google,azure"), ["google", "azure"]);
});

test("espaces et casse sont tolérés", () => {
  assert.deepEqual(parseEnabledProviders(" Google , AZURE "), ["google", "azure"]);
});

test("les doublons sont fusionnés", () => {
  assert.deepEqual(parseEnabledProviders("google,google,azure"), ["google", "azure"]);
});

test("un fournisseur inconnu est ignoré, pas affiché en bouton mort", () => {
  assert.deepEqual(parseEnabledProviders("google,myspace,azure"), ["google", "azure"]);
  assert.deepEqual(parseEnabledProviders("myspace"), []);
});

test("isProviderId ne se laisse pas piéger par les prototypes", () => {
  assert.equal(isProviderId("google"), true);
  assert.equal(isProviderId("constructor"), false);
  assert.equal(isProviderId("toString"), false);
  assert.equal(isProviderId(null), false);
});

test("tous les identifiants listés existent au catalogue", () => {
  for (const id of ALL_PROVIDER_IDS) {
    assert.ok(PROVIDERS[id]);
  }
});
