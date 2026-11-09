-- ============================================================
-- BOCARO — Migration v4 : demandes de devis du simulateur
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================

create table if not exists demandes_devis (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Coordonnées du client
  nom text not null,
  telephone text not null,
  email text,
  ville text,
  message text,

  -- Projet
  surface numeric,            -- m² à carreler (facultatif)
  produit_id uuid,
  produit_nom text,
  piece text,                 -- salon, cuisine, salle-de-bain, chambre, terrasse
  format text,                -- ex. "30 x 30 cm"
  prix_unitaire numeric,      -- DT / m² au moment de la demande
  total_estime numeric,       -- surface x 1,10 x prix (indicatif)
  joint_mm numeric,
  joint_couleur text,
  locale text,

  -- Suivi côté direction
  statut text not null default 'nouveau'
);

alter table demandes_devis enable row level security;

grant insert on table public.demandes_devis to anon, authenticated;
grant select, update, delete on table public.demandes_devis to authenticated;

-- Tout visiteur peut envoyer une demande (avec des limites de taille
-- pour éviter les abus) ; seul le directeur connecté peut les lire.
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
    and statut = 'nouveau'
  );

drop policy if exists "Lecture des devis reservee aux connectes" on demandes_devis;
create policy "Lecture des devis reservee aux connectes"
  on demandes_devis for select
  using (auth.role() = 'authenticated');

drop policy if exists "Modification des devis reservee aux connectes" on demandes_devis;
create policy "Modification des devis reservee aux connectes"
  on demandes_devis for update
  using (auth.role() = 'authenticated');

drop policy if exists "Suppression des devis reservee aux connectes" on demandes_devis;
create policy "Suppression des devis reservee aux connectes"
  on demandes_devis for delete
  using (auth.role() = 'authenticated');
