-- ============================================================
-- BOCARO — Migration v12 : date de dernière modification des produits
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================
--
-- Le sitemap (app/sitemap.js) indique à Google quand chaque fiche produit
-- a changé. Sans cette colonne, il ne connaissait que la date de création :
-- une photo ou un prix modifié n'était pas signalé.
-- La date est tenue par la base elle-même (déclencheur), quel que soit le
-- moyen de modification (dashboard, Table Editor…).
-- ============================================================

alter table public.produits add column if not exists updated_at timestamptz;
update public.produits set updated_at = created_at where updated_at is null;
alter table public.produits alter column updated_at set default now();
alter table public.produits alter column updated_at set not null;

create or replace function public.produits_date_modification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists produits_date_modification on public.produits;
create trigger produits_date_modification
  before update on public.produits
  for each row execute function public.produits_date_modification();

-- Vérification : chaque produit a une date de modification.
select count(*) as produits, count(updated_at) as avec_date from public.produits;
