-- ============================================================
-- BOCARO — Migration v6 : anti-spam des demandes de devis
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- (après la migration v5)
-- ============================================================
--
-- Les demandes sont envoyées directement depuis le navigateur avec la
-- clé publique : un robot peut donc appeler l'API sans passer par le
-- formulaire (et son champ piège). Les limites ci-dessous sont
-- appliquées PAR LA BASE, quel que soit le moyen d'envoi :
--   - 3 demandes maximum par numéro de téléphone sur 24 h ;
--   - 30 demandes maximum, tous visiteurs confondus, sur 10 minutes
--     (frein d'urgence contre une rafale ; largement au-dessus d'un
--     usage normal).
-- Une demande refusée renvoie une erreur ; le formulaire affiche alors
-- son message d'échec (le client peut toujours passer par WhatsApp).
-- ============================================================

create index if not exists demandes_devis_created_at_idx on demandes_devis (created_at);
create index if not exists demandes_devis_telephone_idx on demandes_devis (telephone, created_at);

-- security definer : un visiteur anonyme ne peut pas LIRE les devis,
-- mais la fonction doit pouvoir les compter.
create or replace function public.devis_quota_ok(tel text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from demandes_devis
       where telephone = tel and created_at > now() - interval '24 hours') < 3
    and
    (select count(*) from demandes_devis
       where created_at > now() - interval '10 minutes') < 30;
$$;

revoke all on function public.devis_quota_ok(text) from public;
grant execute on function public.devis_quota_ok(text) to anon, authenticated;

drop policy if exists "Envoi public d'une demande de devis" on demandes_devis;
create policy "Envoi public d'une demande de devis"
  on demandes_devis for insert
  to anon, authenticated
  with check (
    char_length(nom) between 2 and 120
    and char_length(telephone) between 6 and 30
    and (email is null or char_length(email) <= 200)
    and (ville is null or char_length(ville) <= 120)
    and (message is null or char_length(message) <= 2000)
    and (surface is null or (surface > 0 and surface <= 100000))
    and (produit_nom is null or char_length(produit_nom) <= 200)
    and statut = 'nouveau'
    and public.devis_quota_ok(telephone)
  );
