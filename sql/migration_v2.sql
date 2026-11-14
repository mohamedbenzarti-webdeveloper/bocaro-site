-- ============================================================
-- MIGRATION v2 — à exécuter dans Supabase → SQL Editor → Run
-- (en plus du sql/schema.sql déjà exécuté précédemment)
-- Ajoute : description, dimensions multiples, images multiples
-- (upload direct au lieu d'une simple URL)
-- ============================================================

-- Nouveau champ description ------------------------------------------
alter table produits add column if not exists description text;

-- Dimensions devient un tableau (comme couleurs) ----------------------
-- On convertit l'ancienne valeur texte existante en tableau à 1 élément
-- pour ne pas perdre les produits déjà créés.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'produits' and column_name = 'dimensions' and data_type = 'text'
  ) then
    alter table produits rename column dimensions to dimensions_old;
    alter table produits add column dimensions text[] not null default '{}';
    update produits set dimensions = array[dimensions_old] where dimensions_old is not null and dimensions_old <> '';
    alter table produits drop column dimensions_old;
  end if;
end $$;

-- Images multiples : on remplace image_url (texte unique) par
-- images (tableau). L'ancienne image, si elle existe, est conservée
-- comme première image du tableau.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'produits' and column_name = 'image_url'
  ) then
    alter table produits add column if not exists images text[] not null default '{}';
    update produits set images = array[image_url] where image_url is not null and image_url <> '';
    alter table produits drop column image_url;
  end if;
end $$;

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

-- Seul un utilisateur connecté (le directeur) peut envoyer des images
drop policy if exists "Upload reserve aux connectes" on storage.objects;
create policy "Upload reserve aux connectes"
  on storage.objects for insert
  with check (bucket_id = 'produits' and auth.role() = 'authenticated');

-- Seul un utilisateur connecté peut supprimer des images
drop policy if exists "Suppression images reservee aux connectes" on storage.objects;
create policy "Suppression images reservee aux connectes"
  on storage.objects for delete
  using (bucket_id = 'produits' and auth.role() = 'authenticated');
