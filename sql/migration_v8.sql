-- ============================================================
-- BOCARO — Migration v8 : demandes de devis mises en pause
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (après la migration v6)
-- ============================================================
--
-- Le formulaire de devis du simulateur et la section « Devis » du
-- dashboard ont été retirés du site. Mais la base acceptait toujours des
-- demandes envoyées directement à l'API avec la clé publique du site :
-- sans formulaire, cette porte ne servait plus qu'aux robots (voir l'audit,
-- problème C3). Elle est fermée ici.
--
-- La table "demandes_devis" et les demandes déjà reçues sont CONSERVÉES :
-- rien n'est effacé. Pour réactiver les devis plus tard, réexécuter
-- sql/migration_v6.sql (qui recrée la fonction et la règle d'envoi).
-- ============================================================

-- 1. Plus aucun envoi possible, ni par un visiteur ni par un compte connecté.
drop policy if exists "Envoi public d'une demande de devis" on demandes_devis;
revoke insert on table public.demandes_devis from anon, authenticated;

-- 2. La fonction anti-spam ne sert plus qu'à cette règle : supprimée
--    (elle n'est plus appelable par les visiteurs).
drop function if exists public.devis_quota_ok(text);

-- Les règles de lecture, modification et suppression réservées aux
-- administrateurs (migration v5) restent en place : les demandes déjà
-- reçues restent consultables depuis Supabase (Table Editor).

-- Facultatif — supprimer définitivement les demandes déjà reçues.
-- Données personnelles de clients : à décider (durée de conservation).
-- Retirer les deux tirets pour exécuter :
-- delete from demandes_devis;

-- Vérification : aucune règle d'insertion ne doit apparaître, et la
-- deuxième requête doit renvoyer "false" pour le visiteur anonyme.
select policyname, cmd from pg_policies where tablename = 'demandes_devis';
select has_table_privilege('anon', 'public.demandes_devis', 'INSERT') as anon_peut_inserer;
