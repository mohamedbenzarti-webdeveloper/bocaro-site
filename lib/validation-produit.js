// Validation d'un produit avant enregistrement (actions du dashboard).
// Les champs du formulaire ont des limites dans le navigateur, mais une
// action serveur peut être appelée directement : ces règles sont donc
// vérifiées côté serveur, et la base impose les mêmes limites
// (sql/migration_v11.sql, vérifié par un test).

import { productColourTranslations, productTypeTranslations } from "./translations";

export const LIMITES = {
  nom: 120,
  description: 2000,
  dimension: 40,
  dimensions: 20,
  couleurs: 20,
  images: 12,
  prixMax: 100000,
};

export const TYPES_PRODUIT = Object.keys(productTypeTranslations);
export const COULEURS_PRODUIT = Object.keys(productColourTranslations);

/**
 * Vérifie un produit lu par lireFormulaire. → message d'erreur (en
 * français, affiché dans le dashboard) ou null si tout est correct.
 */
export function erreurProduit(p) {
  if (!p.nom) return "Le nom du produit (français) est obligatoire.";
  for (const champ of ["nom", "nom_en", "nom_ar"]) {
    if (p[champ] && p[champ].length > LIMITES.nom) return `Nom trop long (${LIMITES.nom} caractères au maximum).`;
  }
  for (const champ of ["description", "description_en", "description_ar"]) {
    if (p[champ] && p[champ].length > LIMITES.description) {
      return `Description trop longue (${LIMITES.description} caractères au maximum).`;
    }
  }
  if (!TYPES_PRODUIT.includes(p.type)) return "Type de produit inconnu.";
  if (p.dimensions.length > LIMITES.dimensions) return `Trop de dimensions (${LIMITES.dimensions} au maximum).`;
  if (p.dimensions.some((d) => d.length > LIMITES.dimension)) {
    return `Dimension trop longue (${LIMITES.dimension} caractères au maximum).`;
  }
  if (p.couleurs.length > LIMITES.couleurs) return `Trop de couleurs (${LIMITES.couleurs} au maximum).`;
  if (p.couleurs.some((c) => !COULEURS_PRODUIT.includes(c))) return "Couleur inconnue.";
  if (!Number.isFinite(p.prix) || p.prix < 0 || p.prix > LIMITES.prixMax) {
    return `Prix invalide (nombre entre 0 et ${LIMITES.prixMax} DT).`;
  }
  if (p.images.length > LIMITES.images) return `Trop de photos (${LIMITES.images} au maximum).`;
  return null;
}
