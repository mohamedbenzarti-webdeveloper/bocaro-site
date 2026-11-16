-- À exécuter dans Supabase : Project → SQL Editor → New query → coller → Run
-- Peut être réexécuté sans erreur ni retour en arrière sur la sécurité.
-- (pour un projet Supabase tout neuf, ce seul fichier suffit — pas
-- besoin de migration_v2.sql en plus, il est déjà inclus ici)

create extension if not exists "pgcrypto";

create table if not exists produits (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type text not null,
  description text,
  dimensions text[] not null default '{}',
  couleurs text[] not null default '{}',
  prix numeric not null,
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Active la sécurité au niveau des lignes (RLS)
alter table produits enable row level security;

-- Droits de base sur la table (nécessaires en plus des règles RLS
-- ci-dessous : sans ça, Postgres refuse tout accès avant même de
-- vérifier les policies, avec l'erreur "permission denied for table produits").
grant select, insert, update, delete on table public.produits to authenticated;
grant select on table public.produits to anon;

-- Tout le monde (site public) peut LIRE les produits
drop policy if exists "Lecture publique des produits" on produits;
create policy "Lecture publique des produits"
  on produits for select
  using (true);

-- Écriture : règles provisoires « utilisateur connecté », remplacées par
-- « administrateur » dans migration_v5.sql. Elles ne sont créées que si la
-- v5 n'a pas encore été exécutée (table admins absente) : réexécuter ce
-- fichier sur une base à jour ne rouvre donc jamais l'écriture à tout
-- compte connecté.
do $$
begin
  if to_regclass('public.admins') is null then
    drop policy if exists "Ajout reserve aux connectes" on produits;
    create policy "Ajout reserve aux connectes"
      on produits for insert
      with check (auth.role() = 'authenticated');

    drop policy if exists "Modification reservee aux connectes" on produits;
    create policy "Modification reservee aux connectes"
      on produits for update
      using (auth.role() = 'authenticated');

    drop policy if exists "Suppression reservee aux connectes" on produits;
    create policy "Suppression reservee aux connectes"
      on produits for delete
      using (auth.role() = 'authenticated');

    drop policy if exists "Upload reserve aux connectes" on storage.objects;
    create policy "Upload reserve aux connectes"
      on storage.objects for insert
      with check (bucket_id = 'produits' and auth.role() = 'authenticated');

    drop policy if exists "Suppression images reservee aux connectes" on storage.objects;
    create policy "Suppression images reservee aux connectes"
      on storage.objects for delete
      using (bucket_id = 'produits' and auth.role() = 'authenticated');
  end if;
end;
$$;

-- Bucket de stockage pour les photos produits --------------------------
insert into storage.buckets (id, name, public)
values ('produits', 'produits', true)
on conflict (id) do nothing;

-- Pas de politique de lecture (SELECT) pour les visiteurs : le bucket est
-- public, ses images sont servies par leur URL publique sans politique.
-- Une politique SELECT sans rôle laisserait n'importe qui LISTER tous les
-- fichiers du bucket avec la clé publique du site. La lecture via l'API
-- est réservée aux administrateurs (sql/migration_v7.sql).
drop policy if exists "Lecture publique des images" on storage.objects;
