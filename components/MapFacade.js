"use client";

import { useState } from "react";

const CARTE_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3795.7308998844355!2d10.247569517413808!3d36.87081070759992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12e2cbb06ac5c8a3%3A0x66e17ee008a691eb!2sCaroAntika!5e0!3m2!1sfr!2stn!4v1788288193721!5m2!1sfr!2stn";
const CARTE_LIEN = "https://www.google.com/maps/search/?api=1&query=CaroAntika%20Soukra%20Tunis";

// Aperçu de la carte : Google Maps (≈ 1 Mo de code tiers) n'est chargé
// qu'au clic, pour ne pas ralentir l'ouverture de la page contact.
export default function MapFacade({ titre, adresse, libelleAfficher, libelleOuvrir }) {
  const [active, setActive] = useState(false);

  if (active) {
    return <iframe title={titre} src={CARTE_EMBED} className="w-full h-full map-embed" />;
  }

  return (
    <div className="relative w-full h-full bg-bocaro-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
      {/* Fond décoratif : grille de « rues » */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.35] bg-[linear-gradient(rgb(var(--bd-200))_1px,transparent_1px),linear-gradient(90deg,rgb(var(--bd-200))_1px,transparent_1px)] bg-[size:40px_40px]"
      />
      <div className="relative w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center shadow-lg">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="1.8">
          <path
            d="M12 21c-4.5-4-7-7.5-7-11a7 7 0 1114 0c0 3.5-2.5 7-7 11z M12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="relative font-semibold text-bocaro-950">{adresse}</p>
      <div className="relative flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => setActive(true)} className="btn-primary text-sm">
          {libelleAfficher}
        </button>
        <a
          href={CARTE_LIEN}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-bocaro-200 bg-surface text-sm font-medium text-bocaro-900 hover:bg-bocaro-50 transition-colors"
        >
          {libelleOuvrir}
        </a>
      </div>
    </div>
  );
}
