import { cache } from "react";
import { notFound } from "next/navigation";
import { lireProduit } from "../../../lib/supabase/public";
import ProductDetail from "../../../components/ProductDetail";
import { SITE_URL } from "../../../lib/site";

// Page rendue à chaque visite ; le produit vient du cache de
// lib/supabase/public.js (60 s, vidé par les actions du dashboard).

// Une seule requête par affichage, partagée entre generateMetadata et la page.
// Produit absent → null (page 404). Base injoignable → exception : la page
// d'erreur (app/error.js) s'affiche avec un statut 500, pour que Google ne
// retire pas la fiche de son index pendant une panne passagère.
const chargerProduit = cache(async (id) => {
  const { data, error } = await lireProduit(id);
  if (error) throw new Error(`Produit ${id} non chargé : ${error.message}`);
  return data;
});

function resume(produit) {
  const texte =
    produit.description?.trim() ||
    `${produit.nom} : ${produit.type?.toLowerCase() ?? "carreau"} fait main par BOCARO en Tunisie.`;
  return texte.length > 158 ? `${texte.slice(0, 155).trimEnd()}…` : texte;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const produit = await chargerProduit(id);
  if (!produit) return { title: "Produit introuvable", robots: { index: false } };

  const titre = produit.type ? `${produit.nom} — ${produit.type}` : produit.nom;
  const image = produit.images?.[0];
  return {
    title: titre,
    description: resume(produit),
    alternates: { canonical: `/produits/${id}` },
    openGraph: {
      type: "website",
      url: `/produits/${id}`,
      title: `${titre} | BOCARO`,
      description: resume(produit),
      ...(image ? { images: [{ url: image, alt: produit.nom }] } : {}),
    },
  };
}

export default async function ProduitPage({ params }) {
  const { id } = await params;
  const produit = await chargerProduit(id);

  if (!produit) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produit.nom,
    description: resume(produit),
    category: produit.type ?? undefined,
    image: produit.images?.length ? produit.images : undefined,
    brand: { "@type": "Brand", name: "BOCARO" },
    url: `${SITE_URL}/produits/${id}`,
    ...(Number(produit.prix) > 0
      ? {
          offers: {
            "@type": "Offer",
            price: Number(produit.prix),
            priceCurrency: "TND",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/produits/${id}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductDetail produit={produit} />
    </>
  );
}
