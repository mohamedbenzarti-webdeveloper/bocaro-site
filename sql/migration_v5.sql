-- ============================================================
-- BOCARO — Migration v5 : accès d'écriture réservé aux administrateurs
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================
--
-- Avant : toute écriture (produits, images, devis) était permise à
-- n'importe quel utilisateur CONNECTÉ. Avec l'inscription publique
-- active (réglage par défaut de Supabase), un inconnu pouvait créer un
-- compte avec la clé publique du site et administrer le catalogue ou
-- lire les demandes de devis.
--
-- Après : seuls les comptes listés dans la table "admins" peuvent
-- écrire ou lire les devis. Être simplement connecté ne suffit plus.
--
-- ÉTAPE 1 — remplacer l'adresse ci-dessous par celle du compte
-- directeur (celle utilisée sur /login), AVANT d'exécuter le script.
-- ============================================================

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Personne ne lit ni ne modifie cette table via l'API : seule la
-- fonction is_admin() (security definer) la consulte.
alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Compte(s) administrateur(s) : ADAPTER l'adresse.
insert into public.admins (user_id)
select id from auth.users where email = 'REMPLACER@exemple.com'
on conflict do nothing;

-- ---------- Produits ----------
drop policy if exists "Ajout reserve aux connectes" on produits;
drop policy if exists "Modification reservee aux connectes" on produits;
drop policy if exists "Suppression reservee aux connectes" on produits;
drop policy if exists "Ajout reserve aux admins" on produits;
drop policy if exists "Modification reservee aux admins" on produits;
drop policy if exists "Suppression reservee aux admins" on produits;

create policy "Ajout reserve aux admins"
  on produits for insert to authenticated
  with check (public.is_admin());
create policy "Modification reservee aux admins"
  on produits for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Suppression reservee aux admins"
  on produits for delete to authenticated
  using (public.is_admin());

-- ---------- Images (bucket "produits") ----------
drop policy if exists "Upload reserve aux connectes" on storage.objects;
drop policy if exists "Suppression images reservee aux connectes" on storage.objects;
drop policy if exists "Upload reserve aux admins" on storage.objects;
drop policy if exists "Modification images reservee aux admins" on storage.objects;
drop policy if exists "Suppression images reservee aux admins" on storage.objects;

create policy "Upload reserve aux admins"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'produits' and public.is_admin());
create policy "Modification images reservee aux admins"
  on storage.objects for update to authenticated
  using (bucket_id = 'produits' and public.is_admin());
create policy "Suppression images reservee aux admins"
  on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and public.is_admin());

-- ---------- Demandes de devis ----------
-- L'envoi public (anon) reste autorisé, avec ses limites de taille
-- (migration v4) ; lecture / traitement / suppression : admins seuls.
drop policy if exists "Lecture des devis reservee aux connectes" on demandes_devis;
drop policy if exists "Modification des devis reservee aux connectes" on demandes_devis;
drop policy if exists "Suppression des devis reservee aux connectes" on demandes_devis;
drop policy if exists "Lecture des devis reservee aux admins" on demandes_devis;
drop policy if exists "Modification des devis reservee aux admins" on demandes_devis;
drop policy if exists "Suppression des devis reservee aux admins" on demandes_devis;

create policy "Lecture des devis reservee aux admins"
  on demandes_devis for select to authenticated
  using (public.is_admin());
create policy "Modification des devis reservee aux admins"
  on demandes_devis for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Suppression des devis reservee aux admins"
  on demandes_devis for delete to authenticated
  using (public.is_admin());

-- Vérification : doit renvoyer l'adresse du compte directeur.
select u.email from public.admins a join auth.users u on u.id = a.user_id;
