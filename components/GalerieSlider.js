"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Galerie de la page d'accueil : carrousel centré.
// - La photo active est au centre, ses voisines dépassent sur les côtés,
//   réduites et estompées ; le glissement suit une courbe douce (0,9 s).
// - Zoom lent sur la photo active, légende qui monte en fondu.
// - Défilement automatique (DUREE ms) avec barre de progression ; pause au
//   survol, au focus clavier et quand l'onglet est caché ; désactivé si
//   le visiteur a demandé moins d'animations.
// - Flèches, points, clavier (← →) et glissement du doigt.
//
// photos : [{ src, alt, nom, type, href }]

const DUREE = 5500;
const COURBE = "cubic-bezier(0.22, 0.8, 0.2, 1)";

export default function GalerieSlider({ photos, textes }) {
  const n = photos.length;
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);
  const [mouvementReduit, setMouvementReduit] = useState(false);
  const [visible, setVisible] = useState(false);
  const racine = useRef(null);
  const departDoigt = useRef(null);
  // Photos à charger : l'active et ses deux voisines, au fil du défilement
  // (les photos déjà vues restent). Évite de télécharger les 8 d'un coup.
  const [aCharger, setACharger] = useState(() => new Set([0, 1, n - 1]));
  useEffect(() => {
    setACharger((avant) => {
      const voisines = [actif, (actif + 1) % n, (actif - 1 + n) % n];
      if (voisines.every((i) => avant.has(i))) return avant;
      return new Set([...avant, ...voisines]);
    });
  }, [actif, n]);

  const aller = useCallback((i) => setActif(((i % n) + n) % n), [n]);
  const suivante = useCallback(() => aller(actif + 1), [aller, actif]);
  const precedente = useCallback(() => aller(actif - 1), [aller, actif]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const maj = () => setMouvementReduit(mq.matches);
    maj();
    mq.addEventListener("change", maj);
    const visibilite = () => setPause((p) => (document.hidden ? true : p));
    document.addEventListener("visibilitychange", visibilite);
    return () => {
      mq.removeEventListener("change", maj);
      document.removeEventListener("visibilitychange", visibilite);
    };
  }, []);

  // Le défilement ne démarre que quand la galerie est à l'écran.
  useEffect(() => {
    const el = racine.current;
    if (!el || !("IntersectionObserver" in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Défilement automatique : relancé à chaque changement de photo.
  const auto = n > 1 && visible && !pause && !mouvementReduit;
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(suivante, DUREE);
    return () => clearTimeout(id);
  }, [auto, suivante]);

  if (!n) return null;

  return (
    <div
      // Le carrousel garde le sens gauche → droite dans toutes les langues
      // (piste, flèches, clavier, glissement cohérents) ; seules les
      // légendes suivent le sens du texte (dir="auto").
      ref={racine}
      dir="ltr"
      role="region"
      aria-roledescription="carousel"
      aria-label={textes.label}
      className="relative"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onFocus={() => setPause(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPause(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") precedente();
        if (e.key === "ArrowRight") suivante();
      }}
      onTouchStart={(e) => {
        departDoigt.current = e.touches[0].clientX;
        setPause(true);
      }}
      onTouchEnd={(e) => {
        const depart = departDoigt.current;
        departDoigt.current = null;
        setPause(false);
        if (depart == null) return;
        const dx = e.changedTouches[0].clientX - depart;
        if (Math.abs(dx) < 40) return;
        dx < 0 ? suivante() : precedente();
      }}
    >
      {/* PISTE — largeur d'une photo : --w % de la piste ; écart 24 px.
          Le décalage centre la photo active. */}
      <div className="overflow-hidden py-6">
        <div
          className="flex gap-6 [--w:82] sm:[--w:64] lg:[--w:52] will-change-transform"
          style={{
            transform: `translateX(calc((100% - var(--w) * 1%) / 2 - ${actif} * (var(--w) * 1% + 24px)))`,
            transition: mouvementReduit ? "none" : `transform 900ms ${COURBE}`,
          }}
        >
          {photos.map((p, i) => {
            const estActif = i === actif;
            return (
              <figure
                key={p.src}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${n}`}
                aria-hidden={estActif ? undefined : true}
                onClick={() => !estActif && aller(i)}
                className={`relative flex-none w-[calc(var(--w)*1%)] aspect-[4/3] rounded-xl overflow-hidden bg-bocaro-900 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.6)] ${
                  estActif ? "" : "cursor-pointer"
                }`}
                style={{
                  transform: estActif ? "scale(1)" : "scale(0.86)",
                  opacity: estActif ? 1 : 0.45,
                  filter: estActif ? "none" : "saturate(0.6)",
                  transition: mouvementReduit
                    ? "none"
                    : `transform 900ms ${COURBE}, opacity 900ms ${COURBE}, filter 900ms ${COURBE}`,
                }}
              >
                {/* Zoom lent sur la photo active. */}
                <div
                  className="absolute inset-0"
                  style={{
                    transform: estActif && !mouvementReduit ? "scale(1)" : "scale(1.08)",
                    transition: mouvementReduit ? "none" : estActif ? `transform ${DUREE + 1500}ms ease-out` : "transform 900ms ease-out",
                  }}
                >
                  {aCharger.has(i) && (
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 52vw, (min-width: 640px) 64vw, 82vw"
                    className="object-cover"
                  />
                  )}
                </div>

                {/* Légende : monte en fondu sur la photo active. */}
                <figcaption
                  dir="auto"
                  className="absolute inset-x-0 bottom-0 p-4 sm:p-8 bg-gradient-to-t from-[#0e1729]/90 via-[#0e1729]/35 to-transparent text-white flex flex-col items-start sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4"
                  style={{
                    opacity: estActif ? 1 : 0,
                    transform: estActif ? "translateY(0)" : "translateY(16px)",
                    transition: mouvementReduit ? "none" : `opacity 700ms ease ${estActif ? 350 : 0}ms, transform 700ms ${COURBE} ${estActif ? 350 : 0}ms`,
                  }}
                >
                  <span>
                    <span className="block text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-brand-300 font-semibold whitespace-nowrap">{p.type}</span>
                    <span className="block font-serif text-xl sm:text-3xl font-bold mt-1 leading-tight">{p.nom}</span>
                  </span>
                  <Link
                    href={p.href}
                    tabIndex={estActif ? 0 : -1}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 inline-flex items-center gap-2 rounded-md border border-white/60 px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-semibold hover:bg-white hover:text-[#0e1729] transition-colors"
                  >
                    {textes.cta}
                    <span aria-hidden="true" className="rtl:rotate-180">→</span>
                  </Link>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      {/* COMMANDES */}
      {n > 1 && (
        <div className="container-app mt-6 flex items-center justify-between gap-6">
          <span className="font-serif text-white/90 tabular-nums text-base sm:text-lg whitespace-nowrap" aria-live="polite">
            {String(actif + 1).padStart(2, "0")}
            <span className="text-white/40"> / {String(n).padStart(2, "0")}</span>
          </span>

          {/* Points + barre de progression du défilement automatique. */}
          <div className="flex-1 hidden sm:flex items-center justify-center gap-2">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => aller(i)}
                aria-label={`${textes.go} ${i + 1}`}
                aria-current={i === actif ? "true" : undefined}
                className="relative h-1.5 rounded-full overflow-hidden bg-white/20 transition-all duration-500"
                style={{ width: i === actif ? 44 : 14 }}
              >
                {i === actif && (
                  <span
                    key={`${actif}-${auto}`}
                    className="absolute inset-y-0 start-0 bg-brand-300 rounded-full"
                    style={{
                      width: auto ? undefined : "100%",
                      animation: auto ? `progressionGalerie ${DUREE}ms linear forwards` : "none",
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={precedente}
              aria-label={textes.prev}
              className="w-11 h-11 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white hover:text-[#0e1729] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={suivante}
              aria-label={textes.next}
              className="w-11 h-11 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white hover:text-[#0e1729] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
