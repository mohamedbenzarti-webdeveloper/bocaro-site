-- ============================================================
-- BOCARO — Migration v11 : contraintes sur les produits
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (après la migration v5)
-- ============================================================
--
-- Le dashboard vérifie déjà chaque produit (lib/validation-produit.js).
-- La base impose ici les mêmes limites, quel que soit le moyen d'écriture
-- (API appelée directement, Table Editor de Supabase…). Les valeurs
-- doivent rester identiques à LIMITES dans lib/validation-produit.js
-- (un test le vérifie).
--
-- NOT VALID : les produits déjà enregistrés ne sont pas contrôlés (le
-- script ne peut donc pas échouer sur une ancienne donnée) ; tout ajout
-- ou modification l'est. Voir l'étape facultative en bas pour contrôler
-- aussi les produits existants.
--
-- Les couleurs ne sont pas limitées à la palette ici : la liste change
-- avec le code, seule l'application la contrôle.
-- ============================================================

alter table public.produits drop constraint if exists produits_nom_longueur;
alter table public.produits add constraint produits_nom_longueur check (
  char_length(btrim(nom)) between 1 and 120
  and (nom_en is null or char_length(nom_en) <= 120)
  and (nom_ar is null or char_length(nom_ar) <= 120)
) not valid;

alter table public.produits drop constraint if exists produits_description_longueur;
alter table public.produits add constraint produits_description_longueur check (
  (description is null or char_length(description) <= 2000)
  and (description_en is null or char_length(description_en) <= 2000)
  and (description_ar is null or char_length(description_ar) <= 2000)
) not valid;

alter table public.produits drop constraint if exists produits_type_connu;
alter table public.produits add constraint produits_type_connu check (
  type in ('Carreau ciment', 'Terre cuite', 'Faïence', 'Mosaïque', 'Sur mesure')
) not valid;

alter table public.produits drop constraint if exists produits_prix_valide;
alter table public.produits add constraint produits_prix_valide check (
  prix >= 0 and prix <= 100000
) not valid;

alter table public.produits drop constraint if exists produits_listes_taille;
alter table public.produits add constraint produits_listes_taille check (
  coalesce(array_length(dimensions, 1), 0) <= 20
  and coalesce(array_length(couleurs, 1), 0) <= 20
  and coalesce(array_length(images, 1), 0) <= 12
) not valid;

-- Vérification : les cinq contraintes doivent apparaître.
select conname from pg_constraint
where conrelid = 'public.produits'::regclass and conname like 'produits\_%' escape '\'
order by conname;

-- Facultatif — contrôler aussi les produits existants (échoue en nommant
-- la contrainte si un ancien produit ne la respecte pas : le corriger dans
-- le dashboard puis réexécuter). Retirer les deux tirets :
-- alter table public.produits validate constraint produits_nom_longueur;
-- alter table public.produits validate constraint produits_description_longueur;
-- alter table public.produits validate constraint produits_type_connu;
-- alter table public.produits validate constraint produits_prix_valide;
-- alter table public.produits validate constraint produits_listes_taille;
