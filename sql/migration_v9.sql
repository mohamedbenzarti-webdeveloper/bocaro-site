-- ============================================================
-- BOCARO — Migration v9 : durée de conservation des demandes de devis
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (après la migration v8)
-- ============================================================
--
-- Les demandes de devis contiennent des données personnelles (nom,
-- téléphone, e-mail, ville, projet). Elles étaient conservées sans limite
-- de durée. Désormais :
--   1. les demandes de plus de 12 mois sont supprimées tout de suite ;
--   2. une tâche planifiée refait cette suppression chaque nuit à 3 h.
--
-- La durée est annoncée aux visiteurs dans la politique de confidentialité
-- (lib/legal.js, RETENTION_DEVIS_MOIS). Pour la changer, modifier les DEUX
-- endroits (un test vérifie qu'ils restent identiques).
-- ============================================================

-- 1. Fonction de purge. SECURITY DEFINER : exécutée avec les droits de son
--    propriétaire, pour que la tâche planifiée puisse supprimer malgré RLS.
--    Personne d'autre ne peut l'appeler (droits retirés ci-dessous).
create or replace function public.purger_demandes_devis()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  supprimees integer;
begin
  delete from public.demandes_devis
  where created_at < now() - interval '12 months';
  get diagnostics supprimees = row_count;
  return supprimees;
end;
$$;

revoke all on function public.purger_demandes_devis() from public, anon, authenticated;

-- 2. Suppression immédiate des demandes trop anciennes.
select public.purger_demandes_devis() as demandes_supprimees;

-- 3. Tâche planifiée quotidienne (extension pg_cron de Supabase).
--    Si la ligne suivante échoue : Supabase → Integrations → Cron →
--    « Enable », puis réexécuter ce script.
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'purger-demandes-devis';
select cron.schedule(
  'purger-demandes-devis',
  '0 3 * * *',
  $$ select public.purger_demandes_devis(); $$
);

-- Vérification : la tâche doit apparaître, active, chaque nuit à 3 h ;
-- la plus ancienne demande restante doit dater de moins de 12 mois.
select jobname, schedule, active from cron.job where jobname = 'purger-demandes-devis';
select count(*) as demandes_restantes, min(created_at) as plus_ancienne from public.demandes_devis;

-- Facultatif — les devis étant désactivés sur le site, supprimer dès
-- maintenant TOUTES les demandes reçues. Retirer les deux tirets :
-- delete from public.demandes_devis;
