-- ============================================================
-- BOCARO — Migration v13 : double authentification des administrateurs
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (après la migration v5)
-- ============================================================
--
-- Avant : le mot de passe suffisait pour modifier le catalogue et les
-- photos. Désormais, une session d'administrateur n'a les droits
-- d'écriture qu'après la saisie d'un code à 6 chiffres (application
-- d'authentification : Google Authenticator, Microsoft Authenticator…).
-- Supabase note ce niveau dans la session : "aal2" (code validé) ou
-- "aal1" (mot de passe seul).
--
-- 1. est_admin()  : le compte figure-t-il dans la table admins ?
--                   (sert seulement à guider la connexion : faut-il
--                   demander le code, ou refuser le compte)
-- 2. is_admin()   : administrateur ET code validé. Toutes les règles
--                   d'écriture (produits, photos — migrations v5 et v7)
--                   appellent déjà is_admin() : elles exigent donc le code
--                   sans autre modification.
--
-- Première connexion après cette migration : le site demande de
-- configurer l'application d'authentification (QR code à scanner).
--
-- Téléphone perdu : Supabase → Authentication → Users → le compte →
-- supprimer le facteur « TOTP » ; à la connexion suivante, le site
-- propose d'en configurer un nouveau.
-- ============================================================

create or replace function public.est_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Vérification : dans le SQL Editor (sans session), les deux renvoient false.
select public.est_admin() as membre, public.is_admin() as admin_avec_code;
