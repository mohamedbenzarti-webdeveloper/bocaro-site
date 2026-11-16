// Adresse publique du site, utilisée pour les liens absolus du
// référencement (sitemap, balises Open Graph, URL canoniques).
// À définir en production : NEXT_PUBLIC_SITE_URL=https://www.exemple.tn
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "BOCARO";

export const ENTREPRISE = {
  nom: "BOCARO",
  description:
    "Fabricant tunisien de carreaux céramiques et de faïence 100% faits main, à Soukra (Tunis), depuis 2006.",
  adresse: { rue: "Rue Ras Jedir", ville: "Soukra, Tunis", pays: "TN" },
  telephones: ["+21698514014", "+21622447900"],
  email: "bocaro_tunisia@yahoo.com",
  reseaux: [
    "https://www.facebook.com/CAROANTIKA",
    "https://www.instagram.com/caroantika_officiel/",
  ],
  fondation: "2006",
  // Mentions légales (page /mentions-legales) : À COMPLÉTER par BOCARO.
  // Un champ laissé à null n'est simplement pas affiché.
  formeJuridique: null, // ex. "SARL au capital de 10 000 DT"
  matriculeFiscal: null, // ex. "1234567/A/M/000"
  registreCommerce: null, // numéro d'identifiant unique au RNE
  directeurPublication: null, // nom du responsable légal
  hebergeur: null, // { nom, adresse, site } de l'hébergeur choisi (adresse indiquée sur son site)
};

/**
 * Années d'activité depuis la fondation, à la date donnée (aujourd'hui par
 * défaut). Calculé à chaque affichage : le chiffre de l'accueil reste juste
 * sans modifier le code chaque année.
 */
export function anneesExperience(date = new Date()) {
  return date.getFullYear() - Number(ENTREPRISE.fondation);
}
