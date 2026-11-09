import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import ProductForm from "../ProductForm";

export default async function ModifierProduitPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: produit } = await supabase
    .from("produits")
    .select("*")
    .eq("id", id)
    .single();

  if (!produit) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-bocaro-950 mb-8">
        Modifier « {produit.nom} »
      </h1>
      <ProductForm produit={produit} />
    </div>
  );
}
