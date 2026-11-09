import { cookies } from "next/headers";
import { defaultLocale, locales } from "./translations";

// Nom du cookie de langue, partagé avec context/LanguageContext.js.
export const COOKIE_LANGUE = "bocaro-locale";

/** Langue du visiteur côté serveur (cookie), français par défaut. */
export async function getLocaleServeur() {
  const valeur = (await cookies()).get(COOKIE_LANGUE)?.value;
  return locales.includes(valeur) ? valeur : defaultLocale;
}
