-- Ce que chaque audit a réellement coûté.
--
-- C'est le chiffre sur lequel se fixe un prix de vente : sans lui, on vend au
-- jugé. Les jetons sont mesurés ; le coût en dollars vaut NULL tant qu'aucun
-- tarif n'est renseigné pour le fournisseur — NULL n'est pas zéro.
--
-- Rejouable : ce script peut être collé plusieurs fois sans erreur.

alter table public.audits
  add column if not exists cost_usd numeric(10, 5);

alter table public.audit_engines
  add column if not exists input_tokens  int,
  add column if not exists output_tokens int,
  add column if not exists searches      int,
  add column if not exists cost_usd      numeric(10, 5);

comment on column public.audits.cost_usd is
  'Coût total de l''audit en dollars. NULL = non chiffré, jamais gratuit.';
comment on column public.audit_engines.cost_usd is
  'Coût de ce moteur. Facturé par le fournisseur quand il le communique, calculé depuis le tarif configuré sinon.';
