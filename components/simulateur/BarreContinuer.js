"use client";

// Barre d'action des étapes « Espace » et « Carrelage » : choix en cours,
// réglages éventuels (Sol / Mur) et bouton « Continuer ».
//
// position: sticky en bas : la barre reste visible pendant qu'on fait
// défiler les pièces ou les carreaux (sur téléphone, le bouton était sous
// la liste, hors de l'écran, et les visiteurs ne le trouvaient pas). Elle
// reste dans son étape : arrivée en fin de liste, elle reprend sa place
// normale et ne recouvre jamais le pied de page.
// etiquette + choix : « Pièce sélectionnée » au-dessus de « Cuisine », sur
// deux lignes pour que le nom reste lisible sur un petit écran. Sans choix,
// invite (consigne) à la place.
export default function BarreContinuer({ etiquette, choix, invite, pret, onContinue, libelle, children }) {
  return (
    <div className="sticky bottom-0 z-30 mt-10 pb-3 pt-2">
      <div
        className={`rounded-2xl border bg-surface/95 backdrop-blur px-4 py-3 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] transition-colors ${
          pret ? "border-brand-600" : "border-bocaro-200"
        }`}
      >
        {children}
        {/* pe-14 : place du bouton rond « Remonter en haut » (ScrollToTop),
            fixé en bas à droite de l'écran. */}
        <div className="flex items-center justify-between gap-3 pe-14">
          <p className="min-w-0 text-sm text-bocaro-700" aria-live="polite">
            {choix ? (
              <>
                <span className="block text-xs text-bocaro-500">{etiquette.replace(/\s*:\s*$/, "")}</span>
                <span className="block font-semibold text-bocaro-950 truncate">{choix}</span>
              </>
            ) : (
              <span className="line-clamp-2">{invite}</span>
            )}
          </p>
          <button
            type="button"
            onClick={onContinue}
            disabled={!pret}
            className="btn-primary shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
          >
            {libelle}
            <span aria-hidden="true" className="rtl:rotate-180">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
