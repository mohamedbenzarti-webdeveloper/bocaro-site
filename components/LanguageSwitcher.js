"use client";

import { useState, useRef, useEffect } from "react";
import { localeNames, locales } from "../lib/translations";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ variant = "desktop" }) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (variant === "mobile") {
    return (
      <div className="flex gap-2">
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 ${
              locale === l
                ? "bg-bocaro-700 text-white border-bocaro-700 scale-105 shadow-md"
                : "bg-surface text-bocaro-700 border-bocaro-200 hover:scale-105"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 h-10 rounded-full border text-sm font-semibold text-bocaro-900 transition-all duration-200 ${
          open
            ? "border-bocaro-500 bg-bocaro-50 shadow-sm"
            : "border-bocaro-200 hover:border-bocaro-500"
        }`}
        aria-label="Changer de langue"
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`transition-transform duration-300 ${open ? "rotate-[20deg]" : ""}`}
        >
          <circle cx="12" cy="12" r="9" strokeLinecap="round" />
          <path d="M3 12h18M12 3c2.5 2.7 4 6 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6-4-9s1.5-6.3 4-9z" strokeLinecap="round" />
        </svg>
        {locale.toUpperCase()}
      </button>

      {/* Le menu est toujours dans le DOM pour permettre l'animation de
          sortie (opacity + scale + translate). pointer-events-none empêche
          les clics quand il est fermé. */}
      <div
        className={`absolute end-0 mt-2 w-40 bg-surface rounded-xl shadow-lg border border-bocaro-100 overflow-hidden z-50 transition-all duration-200 origin-top-right ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {locales.map((l, i) => (
          <button
            key={l}
            onClick={() => {
              setLocale(l);
              setOpen(false);
            }}
            tabIndex={open ? 0 : -1}
            className={`w-full text-start px-4 py-3 text-sm hover:bg-bocaro-50 transition-all duration-150 hover:ps-5 ${
              locale === l ? "text-bocaro-700 font-semibold" : "text-bocaro-900"
            }`}
            style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
          >
            {localeNames[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
