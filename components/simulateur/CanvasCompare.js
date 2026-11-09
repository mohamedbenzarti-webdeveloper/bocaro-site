"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FloorCanvas from "./FloorCanvas";

// Comparateur Avant / Après.
// "Avant" = la photo d'origine, intacte. "Après" = le rendu du moteur.
// Le rendu est superposé à la photo et révélé par un masque CSS
// (clip-path), donc faire glisser la poignée ne relance aucun calcul :
// le canvas n'est dessiné qu'au changement de carreau ou de réglage.
export default function CanvasCompare({
  room,
  surfaces,
  tileSrc,
  reglages,
  onError,
  labels,
  fadeKey,
}) {
  const [position, setPosition] = useState(40);
  const [enCours, setEnCours] = useState(false);
  // Tant que le client n'a pas touché la poignée, un halo pulse autour
  // d'elle pour montrer qu'elle se déplace.
  const [touchee, setTouchee] = useState(false);
  const conteneurRef = useRef(null);

  const majDepuisPointeur = useCallback((clientX) => {
    const el = conteneurRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, ratio)));
  }, []);

  useEffect(() => {
    if (!enCours) return;

    const deplacer = (e) => {
      const x = e.touches?.[0]?.clientX ?? e.clientX;
      if (x != null) majDepuisPointeur(x);
    };
    const relacher = () => setEnCours(false);

    window.addEventListener("pointermove", deplacer);
    window.addEventListener("pointerup", relacher);
    window.addEventListener("touchmove", deplacer, { passive: true });
    window.addEventListener("touchend", relacher);
    return () => {
      window.removeEventListener("pointermove", deplacer);
      window.removeEventListener("pointerup", relacher);
      window.removeEventListener("touchmove", deplacer);
      window.removeEventListener("touchend", relacher);
    };
  }, [enCours, majDepuisPointeur]);

  function auClavier(e) {
    setTouchee(true);
    if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 4));
    if (e.key === "Home") setPosition(0);
    if (e.key === "End") setPosition(100);
  }

  return (
    <div
      ref={conteneurRef}
      className="relative select-none touch-pan-y rounded-[28px] overflow-hidden shadow-xl ring-1 ring-bocaro-100 bg-surface"
      style={{ aspectRatio: `${room.width} / ${room.height}` }}
      onPointerDown={(e) => {
        setTouchee(true);
        setEnCours(true);
        majDepuisPointeur(e.clientX);
      }}
    >
      {/* AVANT — la photo d'origine, jamais modifiée */}
      <img
        src={room.image}
        alt={labels.beforeAlt}
        fetchPriority="high"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* APRÈS — le rendu du moteur, révélé par le masque */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 0 0 ${position}%)`,
          transition: enCours ? "none" : "clip-path 220ms ease-out",
        }}
      >
        {/* La clé force un remontage au changement de carreau, ce qui
            rejoue l'apparition en fondu — transition discrète entre
            deux textures. */}
        <div key={fadeKey} className="w-full h-full animate-[fadeIn_420ms_ease-out]">
          <FloorCanvas
            room={room}
            surfaces={surfaces}
            tileSrc={tileSrc}
            reglages={reglages}
            onError={onError}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Poignée */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${position}%`,
          transform: "translateX(-50%)",
          transition: enCours ? "none" : "left 220ms ease-out",
        }}
      >
        <div className="w-0.5 h-full bg-white/90 shadow-[0_0_10px_rgba(0,0,0,0.35)] mx-auto" />
        {!touchee && (
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 animate-ping motion-reduce:animate-none"
          />
        )}
        <div
          role="slider"
          tabIndex={0}
          aria-label={labels.sliderAriaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          onKeyDown={auClavier}
          className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bocaro-300"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-[#2a4273]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
          </svg>
        </div>
      </div>

      <span className="absolute top-4 left-4 bg-black/55 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
        {labels.before}
      </span>
      <span className="absolute top-4 right-4 bg-black/55 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
        {labels.after}
      </span>
    </div>
  );
}
