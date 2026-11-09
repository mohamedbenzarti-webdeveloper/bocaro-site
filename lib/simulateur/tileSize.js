export const TAILLE_PAR_DEFAUT = { w: 20, h: 20 };

/**
 * Lit un format produit ("10 x 10 cm", "15x20", "7,5 x 7,5 cm"...) et
 * renvoie sa largeur/hauteur en cm, ou null s'il est illisible.
 */
export function parseFormat(format) {
  if (typeof format !== "string") return null;
  const m = format
    .replace(/,/g, ".")
    .match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  return w > 0 && h > 0 ? { w, h } : null;
}

/** Format actif d'un produit : celui choisi s'il existe, sinon le premier lisible. */
export function formatActif(produit, choisi) {
  const formats = produit?.dimensions ?? [];
  if (choisi && formats.includes(choisi)) return choisi;
  return formats.find((f) => parseFormat(f)) ?? null;
}

/** Réglages complets pour le moteur de rendu (taille réelle en cm incluse). */
export function reglagesPourRendu(produit, reglages) {
  const taille =
    parseFormat(formatActif(produit, reglages.format)) ?? TAILLE_PAR_DEFAUT;
  return { ...reglages, tuileCm: taille };
}
