"use client";

import { useLanguage } from "../context/LanguageContext";

// Pagination partagée (catalogue, choix du carreau dans le simulateur) :
// « Précédent », numéros de page, « Suivant ». N'affiche rien s'il n'y a
// qu'une page. Libellés traduits (t.catalogue), flèches inversées en arabe.
export default function Pagination({ page, nbPages, onChange, className = "mt-14" }) {
  const { t } = useLanguage();
  const cat = t.catalogue;
  if (nbPages <= 1) return null;

  return (
    <nav aria-label={cat.pageNav} className={`${className} flex flex-wrap items-center justify-center gap-2`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="h-11 px-4 rounded-md border border-bocaro-200 text-sm font-medium text-bocaro-700 hover:border-bocaro-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
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
          className={`h-11 min-w-11 px-3 rounded-md border text-sm font-medium transition-colors ${
            n === page
              ? "bg-bocaro-700 text-white border-bocaro-700"
              : "bg-surface text-bocaro-700 border-bocaro-200 hover:border-bocaro-500"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === nbPages}
        className="h-11 px-4 rounded-md border border-bocaro-200 text-sm font-medium text-bocaro-700 hover:border-bocaro-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        {cat.pageNext}
        <span aria-hidden="true" className="rtl:hidden"> →</span>
        <span aria-hidden="true" className="ltr:hidden"> ←</span>
      </button>
    </nav>
  );
}
