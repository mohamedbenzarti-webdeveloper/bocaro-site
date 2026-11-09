"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const CLE = "bocaro-theme";

// Bouton soleil / lune. Le choix est mémorisé ; tant que le visiteur n'a
// rien choisi, le site suit le réglage clair/sombre de son système.
export default function ThemeToggle() {
  const { t } = useLanguage();
  const [sombre, setSombre] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    setSombre(html.classList.contains("dark"));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const suivreSysteme = (e) => {
      let choisi = null;
      try {
        choisi = window.localStorage.getItem(CLE);
      } catch {}
      if (choisi) return;
      html.classList.toggle("dark", e.matches);
      setSombre(e.matches);
    };
    media.addEventListener("change", suivreSysteme);
    return () => media.removeEventListener("change", suivreSysteme);
  }, []);

  function basculer() {
    const suivant = !sombre;
    document.documentElement.classList.toggle("dark", suivant);
    setSombre(suivant);
    try {
      window.localStorage.setItem(CLE, suivant ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={t.nav.theme}
      title={t.nav.theme}
      aria-pressed={sombre}
      className="w-10 h-10 rounded-full border border-bocaro-200 text-bocaro-700 hover:bg-bocaro-50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bocaro-300"
    >
      {sombre ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  );
}
