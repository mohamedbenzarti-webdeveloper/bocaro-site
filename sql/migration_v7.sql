-- ============================================================
-- BOCARO — Migration v7 : stockage des photos verrouillé
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (après la migration v5)
-- ============================================================
--
-- 1. Plus de listage public du bucket "produits".
--    Avant : la politique "Lecture publique des images" (schema.sql)
--    permettait à n'importe quel visiteur de LISTER tous les fichiers du
--    bucket avec la clé publique du site, y compris des fichiers oubliés.
--    Un bucket public n'en a pas besoin : ses images restent servies par
--    leur URL publique sans aucune politique. La lecture via l'API est
--    réservée aux administrateurs, qui en ont besoin pour supprimer des
--    fichiers (la suppression exige les droits SELECT et DELETE).
--
-- 2. Seuls des fichiers image raisonnables sont acceptés : JPEG, PNG ou
--    WebP de 5 Mo au plus (le dashboard compresse les photos en WebP
--    d'environ 200 Ko avant l'envoi). Les SVG, HEIC et autres fichiers
--    sont refusés par Supabase, même envoyés hors du dashboard.
-- ============================================================

drop policy if exists "Lecture publique des images" on storage.objects;
drop policy if exists "Lecture des images reservee aux admins" on storage.objects;

create policy "Lecture des images reservee aux admins"
  on storage.objects for select to authenticated
  using (bucket_id = 'produits' and public.is_admin());

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'produits';

-- Vérification : la seule politique de lecture du bucket doit être
-- "Lecture des images reservee aux admins", et le bucket doit afficher
-- la limite de 5 Mo et les 3 types d'images.
select policyname, cmd, roles from pg_policies
where schemaname = 'storage' and tablename = 'objects';

select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'produits';
