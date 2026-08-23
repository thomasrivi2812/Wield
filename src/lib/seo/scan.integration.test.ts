import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { scanSite, type Check } from "./scan";

/**
 * Le scanner contre un vrai serveur : fetch réel, en-têtes réels, robots.txt
 * réel. Les tests unitaires vérifient la lecture du HTML ; celui-ci vérifie
 * que la chaîne complète tient debout.
 */
function serve(routes: Record<string, [number, string]>) {
  const server = http.createServer((req, res) => {
    const route = routes[req.url ?? "/"];
    if (!route) {
      res.writeHead(404).end("introuvable");
      return;
    }
    res.writeHead(route[0], { "Content-Type": "text/html; charset=utf-8" });
    res.end(route[1]);
  });
  return new Promise<{ origin: string; close: () => Promise<void> }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as { port: number };
      resolve({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

const find = (checks: Check[], id: string) => checks.find((c) => c.id === id)!;

test("site correctement balisé : les vérifications passent", async () => {
  const site = await serve({
    "/": [
      200,
      `<!doctype html><html lang="fr"><head>
        <title>Menuiserie Dupont — agencement sur mesure à Lyon</title>
        <meta name="description" content="Menuiserie industrielle à Lyon depuis 1978 : agencement sur mesure pour l'hôtellerie et le commerce.">
        <link rel="canonical" href="https://dupont.fr/">
        <script type="application/ld+json">{"@type":"LocalBusiness","name":"Dupont"}</script>
      </head><body><h1>Menuiserie Dupont</h1><p>${"Nous fabriquons des agencements sur mesure. ".repeat(30)}</p></body></html>`,
    ],
    "/robots.txt": [200, "User-agent: *\nDisallow:\nSitemap: http://x/sitemap.xml"],
    "/llms.txt": [200, "# Dupont"],
  });

  try {
    const scan = await scanSite(site.origin);
    assert.equal(scan.reachable, true);
    for (const id of ["robots-ia", "title", "description", "h1", "json-ld", "canonical", "lang", "sans-js", "sitemap", "llms"]) {
      assert.equal(find(scan.checks, id).status, "ok", `${id} devrait passer`);
    }
    // Servi en HTTP : la vérification doit le dire, sans complaisance.
    assert.equal(find(scan.checks, "https").status, "fail");
  } finally {
    await site.close();
  }
});

test("robots.txt qui bloque les moteurs de réponse : nommés un par un", async () => {
  const site = await serve({
    "/": [200, "<html><head><title>Test</title></head><body>x</body></html>"],
    "/robots.txt": [
      200,
      "User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nDisallow:",
    ],
  });

  try {
    const check = find((await scanSite(site.origin)).checks, "robots-ia");
    assert.equal(check.status, "fail");
    assert.match(check.note, /GPTBot/);
    assert.match(check.note, /ClaudeBot/);
    assert.ok(!check.note.includes("PerplexityBot"), "Perplexity n'est pas bloqué");
  } finally {
    await site.close();
  }
});

test("page vide sans JavaScript et sans balisage : les défauts sont relevés", async () => {
  const site = await serve({
    "/": [200, `<html><head></head><body><div id="root"></div><script>app()</script></body></html>`],
  });

  try {
    const scan = await scanSite(site.origin);
    assert.equal(find(scan.checks, "title").status, "fail");
    assert.equal(find(scan.checks, "description").status, "fail");
    assert.equal(find(scan.checks, "h1").status, "fail");
    assert.equal(find(scan.checks, "json-ld").status, "fail");
    assert.equal(find(scan.checks, "sans-js").status, "fail");
    // Sans robots.txt, rien n'est bloqué : on ne transforme pas une absence en faute.
    assert.equal(find(scan.checks, "robots-ia").status, "ok");
  } finally {
    await site.close();
  }
});

test("site injoignable : aucune vérification inventée", async () => {
  const site = await serve({ "/": [500, "panne"] });
  try {
    const scan = await scanSite(site.origin);
    assert.equal(scan.reachable, false);
    assert.deepEqual(scan.checks, []);
    assert.match(scan.failure!, /500/);
  } finally {
    await site.close();
  }
});

test("domaine illisible : refusé sans requête réseau", async () => {
  const scan = await scanSite("pas un domaine");
  assert.equal(scan.reachable, false);
  assert.deepEqual(scan.checks, []);
});
