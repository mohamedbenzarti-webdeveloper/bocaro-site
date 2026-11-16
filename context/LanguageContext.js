"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { defaultLocale, locales } from "../lib/translations";

const LanguageContext = createContext(null);

// Même nom que lib/locale-server.js (le serveur lit ce cookie pour
// générer directement les pages dans la bonne langue).
const COOKIE_LANGUE = "bocaro-locale";

function ecrireCookieLangue(locale) {
  document.cookie = `${COOKIE_LANGUE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

// localStorage peut être bloqué (navigation privée, données du site
// refusées) : il ne sert qu'à reprendre une ancienne préférence, son
// absence ne doit jamais empêcher de changer de langue.
function lireStockage(cle) {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}

function ecrireStockage(cle, valeur) {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    // Stockage indisponible : le cookie suffit.
  }
}

function lireCookieLangue() {
  const m = document.cookie.match(/(?:^|;\s*)bocaro-locale=([^;]+)/);
  return m?.[1];
}

// Le dictionnaire de la SEULE langue active est fourni par le serveur
// (app/layout.js) : le navigateur ne télécharge plus les traductions des
// trois langues. Au changement de langue, le rafraîchissement serveur
// renvoie le nouveau dictionnaire.
export function LanguageProvider({ children, initialLocale = defaultLocale, dict }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [locale, setLocaleState] = useState(
    locales.includes(initialLocale) ? initialLocale : defaultLocale
  );

  // Nouvelle langue reçue du serveur après rafraîchissement : état ajusté
  // pendant le rendu (pas d'effet, donc pas de rendu supplémentaire).
  const [localeServeur, setLocaleServeur] = useState(initialLocale);
  if (initialLocale !== localeServeur) {
    setLocaleServeur(initialLocale);
    setLocaleState(initialLocale);
  }

  const setLocale = (newLocale) => {
    if (!locales.includes(newLocale) || newLocale === locale) return;
    setLocaleState(newLocale);
    ecrireStockage(COOKIE_LANGUE, newLocale);
    ecrireCookieLangue(newLocale);
    demarrer(() => router.refresh());
  };

  // Visiteurs d'avant le cookie : la langue n'était gardée que dans le
  // navigateur. On la reprend une fois, puis le cookie prend le relais.
  useEffect(() => {
    if (lireCookieLangue()) return;
    const ancienne = lireStockage(COOKIE_LANGUE);
    // Lecture du navigateur, possible seulement après l'affichage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ancienne && locales.includes(ancienne) && ancienne !== locale) setLocale(ancienne);
    else ecrireCookieLangue(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Langue et sens d'écriture appliqués dès le clic (le texte suit dès que
  // le serveur a renvoyé le dictionnaire).
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: dict, enCours }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage doit être utilisé à l'intérieur de LanguageProvider");
  }
  return ctx;
}
