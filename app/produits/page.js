import { lireProduits } from "../../lib/supabase/public";
import CatalogueGrid from "../../components/CatalogueGrid";

// Cache la page pendant 60 secondes, puis régénère en arrière-plan
// (ISR — Incremental Static Regeneration). Les Server Actions
// (créer / modifier / supprimer un produit) appellent
// revalidatePath("/produits") pour invalider le cache immédiatement.
export const revalidate = 60;

export const metadata = {
  title: "Produits",
  description:
    "Carreaux ciment, faïence, terre cuite, mosaïques et créations sur mesure : tous les produits BOCARO de carreaux céramiques faits main en Tunisie.",
  alternates: { canonical: "/produits" },
  openGraph: { url: "/produits", title: "Produits | BOCARO" },
};

export default async function ProduitsPage() {
  const { data: produits, error } = await lireProduits();

  if (error) {
    console.error("Erreur de chargement des produits :", error.message);
  }

  return <CatalogueGrid produits={produits ?? []} />;
}
