import { lireProduits } from "../../lib/supabase/public";
import CatalogueGrid from "../../components/CatalogueGrid";

// Page rendue à chaque visite ; la liste des produits vient du cache de
// lib/supabase/public.js (60 s, vidé par les actions du dashboard).

export const metadata = {
  title: "Produits",
  description:
    "Carreaux ciment, faïence, terre cuite, mosaïques et créations sur mesure : tous les produits BOCARO de carreaux céramiques faits main en Tunisie.",
  alternates: { canonical: "/produits" },
  openGraph: { url: "/produits", title: "Produits | BOCARO" },
};

export default async function ProduitsPage() {
  const { data: produits, error } = await lireProduits();

  // Base injoignable : page d'erreur (statut 500) plutôt qu'un catalogue
  // vide, que les visiteurs et Google prendraient pour un site sans produits.
  if (error) throw new Error(`Catalogue non chargé : ${error.message}`);

  return <CatalogueGrid produits={produits ?? []} />;
}
