import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PlanSection } from "./plan-section";
import { ReportSection } from "./report-section";
import { ScoreCard } from "./score-card";
import type { Action } from "@/lib/audit/plan";
import type { StoredPrompt } from "@/lib/audit/store";

const AUDIT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

/** Le bouton d'achat appelle useRouter : hors de Next, il faut le contexte. */
const router = {
  push: () => {},
  replace: () => {},
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => {},
} as never;

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>{node}</AppRouterContext.Provider>,
  );

const PROMPTS: StoredPrompt[] = [
  {
    engine: "chatgpt",
    prompt: "Quel prestataire fiable pour la menuiserie à Lyon ?",
    cited: true,
    position: 2,
    winners: ["concurrent-a.fr"],
  },
  {
    engine: "claude",
    prompt: "Quel prestataire fiable pour la menuiserie à Lyon ?",
    cited: false,
    position: null,
    winners: ["pagesjaunes.fr"],
  },
];

const PLAN: Action[] = [
  {
    priority: "haute",
    title: "Reprendre la main sur les annuaires",
    body: "Corps du conseil payant.",
    evidence: "pagesjaunes.fr (2×) parmi les sources les plus citées.",
  },
];

test("le score s'affiche « cité sur mesuré », jamais sur quatre", () => {
  const html = render(
    <ScoreCard
      citedCount={1}
      measuredCount={2}
      engines={[
        { engine: "chatgpt", label: "ChatGPT", status: "cited", detail: "2ᵉ source" },
        { engine: "claude", label: "Claude", status: "absent", detail: "" },
        { engine: "gemini", label: "Gemini", status: "not_configured", detail: "pas de clé" },
      ]}
    />,
  );

  // On lit le texte rendu plutôt que le balisage : la mise en forme du
  // chiffre peut changer, la règle « cité sur mesuré » non.
  const text = html.replace(/<[^>]*>/g, "");
  assert.match(text, /1\/2/);
  assert.ok(!text.includes("/4"), "le score ne doit pas se lire sur 4");
  assert.match(html, /Non mesuré/);
});

test("visiteur non connecté : aucune question de l'audit dans le HTML", () => {
  const html = render(
    <ReportSection prompts={null} auditId={AUDIT} />,
  );

  assert.ok(!html.includes("menuiserie à Lyon"), "la question a fuité");
  assert.ok(!html.includes("concurrent-a.fr"), "un concurrent a fuité");
  assert.match(html, /Crée ton compte/);
});

test("propriétaire connecté : les questions réelles, regroupées", () => {
  const html = render(
    <ReportSection prompts={PROMPTS} auditId={AUDIT} />,
  );

  assert.match(html, /Quel prestataire fiable pour la menuiserie à Lyon/);
  assert.match(html, /concurrent-a\.fr/);
  assert.match(html, /2ᵉ source/);
  // Une seule ligne pour une question posée à deux moteurs.
  assert.equal(html.match(/Quel prestataire fiable/g)?.length, 1);
});

test("plan non payé : ni le conseil, ni le constat dans le HTML", () => {
  const html = render(
    <PlanSection plan={null} auditId={AUDIT} sellable signedIn />,
  );

  assert.ok(!html.includes("Corps du conseil payant"), "le conseil a fuité");
  assert.ok(!html.includes("pagesjaunes.fr"), "le constat a fuité");
  assert.match(html, /4,99/);
});

test("plan payé : le conseil et son constat", () => {
  const html = render(
    <PlanSection plan={PLAN} auditId={AUDIT} sellable signedIn />,
  );

  assert.match(html, /Reprendre la main sur les annuaires/);
  assert.match(html, /Corps du conseil payant/);
  assert.match(html, /Constat/);
  assert.match(html, /pagesjaunes\.fr \(2×\)/);
});

test("rien de mesuré : aucun bouton d'achat", () => {
  const html = render(
    <PlanSection plan={null} auditId={AUDIT} sellable={false} signedIn />,
  );

  assert.ok(!html.includes("Débloquer"), "on ne vend pas un rapport vide");
  assert.match(html, /Rien à vendre/);
});

test("non connecté : le bouton renvoie au panneau de compte de la page", () => {
  const html = render(
    <PlanSection plan={null} auditId={AUDIT} sellable signedIn={false} />,
  );

  assert.match(html, /href="#compte"/);
  assert.match(html, /Crée ton compte pour acheter/);
});
