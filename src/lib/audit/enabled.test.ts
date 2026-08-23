import assert from "node:assert/strict";
import test from "node:test";
import { enabledEngines } from "./enabled";

test("variable absente : les quatre moteurs", () => {
  assert.deepEqual(enabledEngines(undefined), [
    "chatgpt",
    "claude",
    "perplexity",
    "gemini",
  ]);
});

test("un seul moteur demandé", () => {
  assert.deepEqual(enabledEngines("perplexity"), ["perplexity"]);
});

test("l'ordre d'affichage ne dépend pas de l'ordre demandé", () => {
  assert.deepEqual(enabledEngines("gemini,chatgpt"), ["chatgpt", "gemini"]);
});

test("espaces et casse sont tolérés", () => {
  assert.deepEqual(enabledEngines(" Perplexity , CLAUDE "), [
    "claude",
    "perplexity",
  ]);
});

test("une valeur vide coupe tout, c'est un choix explicite", () => {
  assert.deepEqual(enabledEngines(""), []);
});

test("un nom inconnu est ignoré, il n'invente pas de moteur", () => {
  assert.deepEqual(enabledEngines("perplexity,mistral"), ["perplexity"]);
});
