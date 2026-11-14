// Outils partagés par les tests de composants.
import { render } from "@testing-library/react";
import { LanguageProvider } from "../context/LanguageContext";
import { getDict } from "../lib/translations";

/** Affiche un composant dans le contexte de langue du site (fr par défaut). */
export function rendreAvecLangue(ui, { locale = "fr", ...options } = {}) {
  const Enveloppe = ({ children }) => (
    <LanguageProvider initialLocale={locale} dict={getDict(locale)}>
      {children}
    </LanguageProvider>
  );
  return render(ui, { wrapper: Enveloppe, ...options });
}

/** Catalogue d'exemple, du plus récent au plus ancien (comme la base). */
export function produitsExemple() {
  return [
    {
      id: "p1",
      nom: "Étoile",
      nom_en: "Star",
      nom_ar: "نجمة",
      description: "Motif étoilé bleu",
      type: "Carreau ciment",
      dimensions: ["10 x 10 cm", "20 x 20 cm"],
      couleurs: ["Bleu Méditerranée", "Blanc"],
      prix: 120,
      images: ["https://projet-test.supabase.co/storage/v1/object/public/produits/etoile.webp"],
    },
    {
      id: "p2",
      nom: "Avoine",
      description: "Géométrie ocre",
      type: "Carreau ciment",
      dimensions: ["15 x 15 cm"],
      couleurs: ["Jaune ocre"],
      prix: 90,
      images: [
        "https://projet-test.supabase.co/storage/v1/object/public/produits/avoine.webp",
        "https://projet-test.supabase.co/storage/v1/object/public/produits/avoine-situation.webp",
      ],
    },
    {
      id: "p3",
      nom: "Brique",
      description: "Terre cuite artisanale",
      type: "Terre cuite",
      dimensions: ["20 x 20 cm"],
      couleurs: ["Rouge brique", "Terracotta"],
      prix: 60,
      images: [],
    },
    {
      id: "p4",
      nom: "Lagon",
      description: "Faïence émaillée turquoise",
      type: "Faïence",
      dimensions: ["10 x 10 cm"],
      couleurs: ["Turquoise", "Bleu Méditerranée"],
      prix: 150,
      images: ["https://projet-test.supabase.co/storage/v1/object/public/produits/lagon.webp"],
    },
  ];
}

/** n produits simples, pour tester la pagination. */
export function produitsNombreux(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `n${i + 1}`,
    nom: `Carreau ${String(i + 1).padStart(2, "0")}`,
    type: "Carreau ciment",
    dimensions: ["20 x 20 cm"],
    couleurs: ["Blanc"],
    prix: 100 + i,
    images: [],
  }));
}
