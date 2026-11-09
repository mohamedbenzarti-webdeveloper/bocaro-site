-- ============================================================
-- BOCARO — Migration v3 : traductions des produits (EN / AR)
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================

alter table produits add column if not exists nom_en text;
alter table produits add column if not exists nom_ar text;
alter table produits add column if not exists description_en text;
alter table produits add column if not exists description_ar text;

-- Rien d'autre à changer : "type" et "couleurs" restent stockés en
-- français (valeurs fixes choisies dans le dashboard) et sont
-- traduits automatiquement à l'affichage via des dictionnaires
-- côté code (lib/translations.js) — pas besoin de colonnes en plus
-- pour ces champs. Les dimensions (ex. "10 x 10 cm") sont des
-- nombres, identiques dans toutes les langues.
