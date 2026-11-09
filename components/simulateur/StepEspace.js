"use client";

import { getWizardRooms, hasMur } from "../../lib/rooms";

export default function StepEspace({
  texts,
  pieceActive,
  onSelect,
  surfaceType,
  onSelectSurface,
  onContinue,
}) {
  const pieces = getWizardRooms();
  const roomActive = pieces.find((p) => p.id === pieceActive)?.room ?? null;
  const muralDisponible = hasMur(roomActive);

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-bocaro-950 text-center mb-2">
        {texts.title}
      </h2>
      <p className="text-bocaro-600 text-center max-w-lg mx-auto mb-10">
        {texts.subtitle}
      </p>

      <div
        role="radiogroup"
        aria-label={texts.title}
        className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5"
      >
        {pieces.map(({ id, room, disponible }) => {
          const estActif = pieceActive === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={estActif}
              onClick={() => disponible && onSelect(id)}
              disabled={!disponible}
              className={`group relative rounded-2xl overflow-hidden text-left border-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bocaro-300 ${
                estActif
                  ? "border-bocaro-900 shadow-xl scale-[1.02]"
                  : disponible
                  ? "border-transparent hover:border-bocaro-300 hover:shadow-lg hover:-translate-y-1"
                  : "border-transparent opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="aspect-[4/5] bg-bocaro-100 relative">
                {disponible ? (
                  <img
                    src={room.image}
                    alt={texts.rooms[id]}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-bocaro-100 to-brand-100 flex items-center justify-center">
                    <span className="text-bocaro-400 text-sm px-4 text-center">
                      {texts.comingSoon}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                {estActif && (
                  <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bocaro-900 text-white flex items-center justify-center">
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                      <path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" />
                    </svg>
                  </span>
                )}
                <span className="absolute bottom-3 left-4 text-white font-serif font-bold text-lg drop-shadow">
                  {texts.rooms[id]}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Surface à carreler : sol ou mur (si la pièce propose un mur) */}
      {pieceActive && muralDisponible && (
        <div className="mt-10 flex flex-col items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-bocaro-500">
            {texts.surfaceLabel}
          </span>
          <div className="inline-flex rounded-full border border-bocaro-200 p-1 gap-1">
            {[
              { id: "sol", label: texts.surfaceSol },
              { id: "mur", label: texts.surfaceMur },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSurface(s.id)}
                aria-pressed={surfaceType === s.id}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  surfaceType === s.id
                    ? "bg-bocaro-900 text-white"
                    : "text-bocaro-700 hover:bg-bocaro-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Récapitulatif + passage à l'étape suivante */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm text-bocaro-600" aria-live="polite">
          {pieceActive
            ? `${texts.selectedLabel} ${texts.rooms[pieceActive]}`
            : texts.selectPrompt}
        </p>
        <button
          type="button"
          onClick={onContinue}
          disabled={!pieceActive}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bocaro-700"
        >
          {texts.continueButton}
        </button>
      </div>
    </div>
  );
}
