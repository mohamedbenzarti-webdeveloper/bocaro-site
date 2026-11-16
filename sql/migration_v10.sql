-- ============================================================
-- BOCARO — Migration v10 : suppression des demandes de devis
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (uniquement sur une base qui a reçu les anciennes migrations v4 à v9)
-- ============================================================
--
-- La table "demandes_devis" a été supprimée : les devis passent
-- désormais uniquement par WhatsApp. Ce script retire tout ce qui en
-- dépendait encore (tâche planifiée nocturne, fonctions), pour que la
-- base ne lance plus chaque nuit une purge sur une table absente.
-- Il peut être exécuté plusieurs fois sans erreur.
-- ============================================================

-- 1. Tâche planifiée de purge (migration v9), si pg_cron est installé.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'purger-demandes-devis';
  end if;
end;
$$;

-- 2. Fonctions liées aux devis (migrations v6 et v9).
drop function if exists public.purger_demandes_devis();
drop function if exists public.devis_quota_ok(text);

-- 3. La table elle-même (déjà supprimée à la main : sans effet dans ce cas).
drop table if exists public.demandes_devis;

-- L'extension pg_cron n'est pas désinstallée (elle ne sert plus au site ;
-- la désactiver si besoin dans Supabase → Integrations → Cron).

-- Vérification : les trois valeurs doivent être 0.
select
  (select count(*) from pg_tables where schemaname = 'public' and tablename = 'demandes_devis') as table_restante,
  (select count(*) from pg_proc where proname in ('purger_demandes_devis', 'devis_quota_ok')) as fonctions_restantes,
  (select count(*) from pg_class where relname = 'demandes_devis_created_at_idx') as index_restants;
