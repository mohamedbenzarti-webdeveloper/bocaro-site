// Photos des produits dans le bucket Supabase "produits".
// Les produits enregistrent l'URL publique complète de chaque photo ; ces
// fonctions retrouvent le chemin du fichier dans le bucket pour pouvoir le
// supprimer quand la photo ou le produit disparaît.

export const BUCKET = "produits";
const PREFIXE = `/storage/v1/object/public/${BUCKET}/`;

/** URL publique → chemin dans le bucket (null si l'URL vient d'ailleurs). */
export function cheminDepuisUrl(url) {
  if (typeof url !== "string") return null;
  const i = url.indexOf(PREFIXE);
  if (i === -1) return null;
  try {
    return decodeURIComponent(url.slice(i + PREFIXE.length).split("?")[0]) || null;
  } catch {
    return null;
  }
}

/**
 * Supprime du bucket les fichiers correspondant à ces URL. Ne lève jamais
 * d'exception : renvoie le message d'erreur éventuel, pour que l'action
 * appelante prévienne l'administrateur sans annuler ce qui est déjà fait.
 */
export async function supprimerFichiers(supabase, urls) {
  const chemins = [...new Set((urls ?? []).map(cheminDepuisUrl).filter(Boolean))];
  if (chemins.length === 0) return null;
  const { error } = await supabase.storage.from(BUCKET).remove(chemins);
  return error ? error.message : null;
}
