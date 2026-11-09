import ProductForm from "../ProductForm";

export default function NouveauProduitPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-bocaro-950 mb-8">
        Ajouter un produit
      </h1>
      <ProductForm />
    </div>
  );
}
