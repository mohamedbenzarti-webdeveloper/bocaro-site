"use client";

import { useLanguage } from "../context/LanguageContext";

// Pagination partagée (catalogue, choix du carreau dans le simulateur) :
// « Précédent », numéros de page, « Suivant ». N'affiche rien s'il n'y a
// qu'une page. Libellés traduits (t.catalogue), flèches inversées en arabe.
// Page active soulignée en terre cuite, sans cadres.
export default function Pagination({ page, nbPages, onChange, className = "mt-14" }) {
  const { t } = useLanguage();
  const cat = t.catalogue;
  if (nbPages <= 1) return null;

  return (
    <nav aria-label={cat.pageNav} className={`${className} flex flex-wrap items-center justify-center gap-1 sm:gap-2`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="h-11 px-3 text-sm font-semibold text-bocaro-950 hover:text-brand-600 disabled:opacity-35 disabled:pointer-events-none transition-colors"
      >
        <span aria-hidden="true" className="rtl:hidden">← </span>
        <span aria-hidden="true" className="ltr:hidden">→ </span>
        {cat.pagePrev}
      </button>
      {Array.from({ length: nbPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${cat.pageAria} ${n}`}
          aria-current={n === page ? "page" : undefined}
          className={`h-11 min-w-11 px-2 border-b-2 text-[15px] tabular-nums transition-colors ${
            n === page
              ? "border-brand-600 text-brand-600 font-semibold"
              : "border-transparent text-bocaro-700 hover:text-bocaro-950 hover:border-bocaro-300"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === nbPages}
        className="h-11 px-3 text-sm font-semibold text-bocaro-950 hover:text-brand-600 disabled:opacity-35 disabled:pointer-events-none transition-colors"
      >
        {cat.pageNext}
        <span aria-hidden="true" className="rtl:hidden"> →</span>
        <span aria-hidden="true" className="ltr:hidden"> ←</span>
      </button>
    </nav>
  );
}
