import assert from "node:assert/strict";
import test from "node:test";
import { grantAccess } from "./store";

const AUDIT = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ME = "11111111-1111-4111-8111-111111111111";
const SOMEONE = "22222222-2222-4222-8222-222222222222";

test("visiteur non connecté : le score seulement", () => {
  assert.deepEqual(grantAccess(ME, AUDIT, null, []), {
    owner: false,
    plan: false,
    seo: false,
  });
});

test("connecté mais pas propriétaire : rien de plus, même avec des achats", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, SOMEONE, [{ sku: "pack", audit_id: null }]),
    { owner: false, plan: false, seo: false },
  );
});

test("audit anonyme : personne n'en est propriétaire", () => {
  assert.deepEqual(grantAccess(null, AUDIT, ME, []), {
    owner: false,
    plan: false,
    seo: false,
  });
});

test("propriétaire sans achat : le détail, pas le plan", () => {
  assert.deepEqual(grantAccess(ME, AUDIT, ME, []), {
    owner: true,
    plan: false,
    seo: false,
  });
});

test("le rapport GEO donne le plan, pas le SEO", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, ME, [{ sku: "report_geo", audit_id: AUDIT }]),
    { owner: true, plan: true, seo: false },
  );
});

test("l'audit SEO + GEO donne les deux", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, ME, [{ sku: "audit_seo_geo", audit_id: AUDIT }]),
    { owner: true, plan: true, seo: true },
  );
});

test("un rapport acheté sur un autre audit ne déborde pas sur celui-ci", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, ME, [{ sku: "audit_seo_geo", audit_id: OTHER }]),
    { owner: true, plan: false, seo: false },
  );
});

test("le pack couvre tous les audits du compte", () => {
  assert.deepEqual(grantAccess(ME, AUDIT, ME, [{ sku: "pack", audit_id: null }]), {
    owner: true,
    plan: true,
    seo: true,
  });
});

test("un guide acheté ne débloque aucun rapport d'audit", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, ME, [{ sku: "guide_citable", audit_id: AUDIT }]),
    { owner: true, plan: false, seo: false },
  );
});

test("l'abonnement Brief ne débloque pas les rapports", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, ME, [{ sku: "brief", audit_id: null }]),
    { owner: true, plan: false, seo: false },
  );
});

test("plusieurs achats se cumulent", () => {
  assert.deepEqual(
    grantAccess(ME, AUDIT, ME, [
      { sku: "report_geo", audit_id: AUDIT },
      { sku: "audit_seo_geo", audit_id: AUDIT },
    ]),
    { owner: true, plan: true, seo: true },
  );
});
