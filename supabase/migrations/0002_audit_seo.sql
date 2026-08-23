-- Ce qu'il fallait pour servir réellement ce qui est vendu.
--
-- 1. La marque et le domaine n'étaient pas enregistrés : sans eux, impossible
--    de rejouer un audit ni de lancer le scan technique du site.
-- 2. Le scan SEO est stocké à côté de l'audit : il est payé une fois, il ne
--    doit pas être refait à chaque affichage de la page.
--
-- Rejouable : ce script peut être collé plusieurs fois sans erreur.

alter table public.audits
  add column if not exists brand           text,
  add column if not exists domain          text,
  add column if not exists seo_scan        jsonb,
  add column if not exists seo_scanned_at  timestamptz;

comment on column public.audits.domain is
  'Domaine de la marque, tel que saisi. Sert à la détection et au scan technique.';
comment on column public.audits.seo_scan is
  'Résultat du scan technique, écrit au premier affichage après paiement.';
