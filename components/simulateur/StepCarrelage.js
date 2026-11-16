"use client";

import { useRef, useState } from "react";
import Pagination from "../Pagination";
import BarreContinuer from "./BarreContinuer";
import { useRechercheProduits, PanneauRecherche } from "../RechercheProduits";
import {
  localizeProductField,
  translateFixedField,
  productTypeTranslations,
  productColourTranslations,
} from "../../lib/translations";

// Carreaux affichés par page (grille de 3 × 3), comme le catalogue.
const PAR_PAGE = 9;

export default function StepCarrelage({
  produits,
  chargement,
  erreur,
  onRecharger,
  locale,
  texts,
  uniteLabel,
  produitActif,
  onSelect,
  onContinue,
}) {
  // Page de départ : celle du carreau déjà choisi (retour depuis l'étape
  // suivante via « Changer de carreau »), sinon la première.
  const [page, setPage] = useState(() => {
    const i = produitActif ? produits.findIndex((p) => p.id === produitActif.id) : -1;
    return i >= 0 ? Math.floor(i / PAR_PAGE) + 1 : 1;
  });
  const haut = useRef(null);
  // Même recherche que la page Produits : texte, choix multiples, tri.
  const r = useRechercheProduits(produits, locale, () => setPage(1));
  const produitsFiltres = r.resultats;

  const nbPages = Math.max(1, Math.ceil(produitsFiltres.length / PAR_PAGE));
  const pageCourante = Math.min(page, nbPages);
  const produitsPage = produitsFiltres.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

  // Changement de page : on remonte en haut des filtres.
  function allerPage(n) {
    setPage(n);
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const nomProduitActif = produitActif
    ? localizeProductField(produitActif, "nom", locale)
    : "";

  return (
    <div>
      <h2 className="font-serif text-3xl md:text-4xl leading-tight text-bocaro-950 text-center mb-3">
        {texts.title}
      </h2>
      <p className="text-bocaro-600 text-center max-w-lg mx-auto mb-8">
        {texts.subtitle}
      </p>

      {/* ERREUR DE CHARGEMENT */}
      {erreur && (
        <div className="max-w-md mx-auto text-center bg-brand-50 border border-brand-200 rounded-2xl p-6">
          <p className="text-bocaro-800 text-sm mb-4">{texts.errorMessage}</p>
          <button type="button" onClick={onRecharger} className="btn-outline text-sm py-2.5">
            {texts.retryButton}
          </button>
        </div>
      )}

      {/* CHARGEMENT — squelettes */}
      {!erreur && chargement && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden border border-bocaro-100 animate-pulse"
            >
              <div className="h-48 bg-bocaro-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 bg-bocaro-100 rounded" />
                <div className="h-4 w-3/4 bg-bocaro-100 rounded" />
                <div className="h-3 w-24 bg-bocaro-100 rounded" />
                <div className="h-9 w-full bg-bocaro-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CATALOGUE VIDE */}
      {!erreur && !chargement && produits.length === 0 && (
        <p className="text-center text-bocaro-500 text-sm py-10">{texts.emptyCatalogue}</p>
      )}

      {/* FILTRES + GRILLE */}
      {!erreur && !chargement && produits.length > 0 && (
        <>
          <div ref={haut} className="scroll-mt-28">
            <PanneauRecherche r={r} idRecherche="simulateur-search" />
          </div>

          {produitsFiltres.length === 0 ? (
            <p className="text-center text-bocaro-500 text-sm py-10">{texts.noResults}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={texts.title}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {produitsPage.map((p) => {
                const estActif = produitActif?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-surface rounded-2xl overflow-hidden border-2 flex flex-col transition-all ${
                      estActif
                        ? "border-brand-600"
                        : "border-bocaro-100 card-hover"
                    }`}
                  >
                    <div className="h-48 bg-bocaro-50 overflow-hidden relative">
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={localizeProductField(p, "nom", locale)}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                      {estActif && (
                        <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center">
                          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                            <path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                        {translateFixedField(productTypeTranslations, p.type, locale)}
                      </span>
                      <h3 className="font-serif text-xl leading-tight text-bocaro-950 mt-1 mb-2">
                        {localizeProductField(p, "nom", locale)}
                      </h3>
                      <p className="text-sm text-bocaro-600 mb-4">
                        {p.prix} {uniteLabel}
                      </p>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={estActif}
                        onClick={() => onSelect(p)}
                        className={`mt-auto w-full justify-center text-sm py-2.5 ${
                          estActif ? "btn-primary" : "btn-outline"
                        }`}
                      >
                        {estActif ? texts.selectedButton : texts.tryButton}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination page={pageCourante} nbPages={nbPages} onChange={allerPage} className="mt-10" />

          {/* Carreau choisi et « Continuer » : toujours visibles en bas de
              l'écran, même pendant le défilement des carreaux. */}
          <BarreContinuer
            etiquette={texts.selectedLabel}
            choix={nomProduitActif}
            invite={texts.selectPrompt}
            pret={Boolean(produitActif)}
            onContinue={onContinue}
            libelle={texts.continueButton}
          />
        </>
      )}
    </div>
  );
}

