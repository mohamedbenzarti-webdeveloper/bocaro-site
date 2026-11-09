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
};
