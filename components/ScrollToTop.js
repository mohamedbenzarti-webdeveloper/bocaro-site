"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const SEUIL = 400;

// Bouton flottant qui apparaît après un certain défilement et ramène
// en haut de page. Masqué tant qu'on est proche du haut.
export default function ScrollToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const surScroll = () => setVisible(window.scrollY > SEUIL);
    surScroll();
    window.addEventListener("scroll", surScroll, { passive: true });
    return () => window.removeEventListener("scroll", surScroll);
  }, []);

  function remonter() {
    const reduitAnimations = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduitAnimations ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={remonter}
      aria-label={t.nav.scrollToTop}
      title={t.nav.scrollToTop}
      className={`fixed bottom-6 end-6 z-40 w-11 h-11 rounded-full bg-bocaro-900 text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-bocaro-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bocaro-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
