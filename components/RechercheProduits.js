"use client";

import { useCallback, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  translateFixedField,
  localizeProductField,
  productTypeTranslations,
  productColourTranslations,
} from "../lib/translations";

// Recherche des carreaux, partagée par la page Produits et l'étape
// « Carrelage » du simulateur : texte libre, filtres à choix multiples
// (type, dimension, couleur) et tri.
//
// Dans un groupe, un produit doit correspondre à AU MOINS UN choix (« bleu
// OU vert ») ; entre les groupes, à TOUS (« bleu » ET « 20 x 20 cm »).

// Supprime accents et majuscules pour la comparaison.
function normaliser(texte) {
  return (texte ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * État et résultats de la recherche. `onChange` est appelé à chaque
 * changement de filtre ou de tri (par ex. pour revenir à la page 1).
 */
export function useRechercheProduits(produits, locale, onChange) {
  const [recherche, setRechercheBrute] = useState("");
  const [types, setTypes] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [couleurs, setCouleurs] = useState([]);
  const [tri, setTriBrut] = useState("recent");

  const signaler = () => onChange?.();
  const setRecherche = (v) => { setRechercheBrute(v); signaler(); };
  const setTri = (v) => { setTriBrut(v); signaler(); };

  const basculer = (setter) => (valeur) => {
    setter((liste) => (liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]));
    signaler();
  };
  const basculerType = basculer(setTypes);
  const basculerDimension = basculer(setDimensions);
  const basculerCouleur = basculer(setCouleurs);

  const reinitialiser = () => {
    setRechercheBrute("");
    setTypes([]);
    setDimensions([]);
    setCouleurs([]);
    signaler();
  };

  const aDesFiltres = recherche.trim() !== "" || types.length > 0 || dimensions.length > 0 || couleurs.length > 0;

  // Texte cherchable de chaque produit, calculé une fois : noms et
  // descriptions dans les 3 langues, type et couleurs (en français et
  // traduits), dimensions (« 20x20 » trouve aussi « 20 x 20 cm »).
  const index = useMemo(
    () =>
      new Map(
        produits.map((p) => {
          const morceaux = [
            p.nom, p.nom_en, p.nom_ar,
            p.description, p.description_en, p.description_ar,
            p.type, ...Object.values(productTypeTranslations[p.type] ?? {}),
            ...(p.couleurs ?? []).flatMap((c) => [c, ...Object.values(productColourTranslations[c] ?? {})]),
            ...(p.dimensions ?? []),
          ];
          const texte = normaliser(morceaux.filter(Boolean).join(" "));
          return [p.id, `${texte} ${texte.replace(/\s+/g, "")}`];
        })
      ),
    [produits]
  );

  // Chaque mot tapé doit apparaître quelque part dans le produit.
  const mots = useMemo(() => normaliser(recherche).split(/\s+/).filter(Boolean), [recherche]);

  // `sauf` ignore un groupe : sert à compter ce que donnerait chaque choix.
  const filtrer = useCallback(
    (sauf) =>
      produits.filter((p) => {
        if (sauf !== "type" && types.length && !types.includes(p.type)) return false;
        if (sauf !== "dim" && dimensions.length && !(p.dimensions ?? []).some((d) => dimensions.includes(d))) return false;
        if (sauf !== "coul" && couleurs.length && !(p.couleurs ?? []).some((c) => couleurs.includes(c))) return false;
        const texte = index.get(p.id) ?? "";
        return mots.every((m) => texte.includes(m));
      }),
    [produits, types, dimensions, couleurs, mots, index]
  );

  const compter = (liste, valeursDe) => {
    const compte = new Map();
    liste.forEach((p) => valeursDe(p).forEach((v) => compte.set(v, (compte.get(v) ?? 0) + 1)));
    return compte;
  };
  const valeurs = (valeursDe) =>
    Array.from(new Set(produits.flatMap(valeursDe).filter(Boolean))).sort((x, y) => x.localeCompare(y, "fr", { numeric: true }));

  const groupes = useMemo(
    () => ({
      type: { valeurs: valeurs((p) => [p.type]), comptes: compter(filtrer("type"), (p) => [p.type]) },
      dim: { valeurs: valeurs((p) => p.dimensions ?? []), comptes: compter(filtrer("dim"), (p) => p.dimensions ?? []) },
      coul: { valeurs: valeurs((p) => p.couleurs ?? []), comptes: compter(filtrer("coul"), (p) => p.couleurs ?? []) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtrer, produits]
  );

  const resultats = useMemo(() => {
    const liste = filtrer(null);
    const prix = (p) => Number(p.prix) || 0;
    if (tri === "prix-asc") return [...liste].sort((x, y) => prix(x) - prix(y));
    if (tri === "prix-desc") return [...liste].sort((x, y) => prix(y) - prix(x));
    if (tri === "nom")
      return [...liste].sort((x, y) =>
        localizeProductField(x, "nom", locale).localeCompare(localizeProductField(y, "nom", locale), locale)
      );
    return liste; // déjà du plus récent au plus ancien
  }, [filtrer, tri, locale]);

  const actifs = [
    ...types.map((v) => ({ cle: `t-${v}`, label: translateFixedField(productTypeTranslations, v, locale), retirer: () => basculerType(v) })),
    ...dimensions.map((v) => ({ cle: `d-${v}`, label: v, retirer: () => basculerDimension(v) })),
    ...couleurs.map((v) => ({ cle: `c-${v}`, label: translateFixedField(productColourTranslations, v, locale), retirer: () => basculerCouleur(v) })),
  ];

  return {
    recherche, setRecherche, tri, setTri,
    types, dimensions, couleurs, basculerType, basculerDimension, basculerCouleur,
    groupes, resultats, actifs, aDesFiltres, reinitialiser, locale,
  };
}

/** Barre de recherche, filtres à choix multiples, filtres actifs et tri. */
export function PanneauRecherche({ r, idRecherche = "catalogue-search" }) {
  const { t } = useLanguage();
  const cat = t.catalogue;
  const { locale } = r;

  return (
    <>
      <div className="relative max-w-xl mx-auto mb-6">
        <label htmlFor={idRecherche} className="sr-only">
          {cat.searchLabel}
        </label>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bocaro-400 pointer-events-none"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          id={idRecherche}
          type="search"
          value={r.recherche}
          onChange={(e) => r.setRecherche(e.target.value)}
          placeholder={cat.searchPlaceholder}
          className="w-full h-12 ps-12 pe-4 rounded-xl border border-bocaro-200 bg-surface text-bocaro-900 placeholder:text-bocaro-400 focus:outline-none focus:ring-2 focus:ring-bocaro-500 focus:border-bocaro-500 transition-shadow"
        />
      </div>

      <div className="rounded-2xl border border-bocaro-100 bg-bocaro-50/60 p-5 sm:p-6 mb-6 space-y-5">
        <p className="text-xs text-bocaro-500">
          <span className="font-semibold uppercase tracking-wide text-bocaro-700 me-2">{cat.filtersTitle}</span>
          {cat.filterHint}
        </p>
        <GroupeFiltre
          titre={cat.filterType}
          groupe={r.groupes.type}
          choisies={r.types}
          libelle={(v) => translateFixedField(productTypeTranslations, v, locale)}
          onBasculer={r.basculerType}
        />
        <GroupeFiltre
          titre={cat.filterDimension}
          groupe={r.groupes.dim}
          choisies={r.dimensions}
          libelle={(v) => v}
          onBasculer={r.basculerDimension}
        />
        <GroupeFiltre
          titre={cat.filterColour}
          groupe={r.groupes.coul}
          choisies={r.couleurs}
          libelle={(v) => translateFixedField(productColourTranslations, v, locale)}
          pastille={(v) => TEINTES[v]}
          onBasculer={r.basculerCouleur}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex flex-wrap items-center gap-2 min-h-9">
          <p className="text-sm text-bocaro-500 me-1" aria-live="polite">
            {cat.resultCount.replace("{count}", r.resultats.length)}
          </p>
          {r.actifs.map((f) => (
            <button
              key={f.cle}
              type="button"
              onClick={f.retirer}
              aria-label={`${cat.removeFilter} : ${f.label}`}
              className="inline-flex items-center gap-1.5 h-8 ps-3 pe-2 rounded-full bg-bocaro-700 text-white text-xs font-medium hover:bg-bocaro-900 transition-colors"
            >
              {f.label}
              <span aria-hidden="true" className="text-sm leading-none">×</span>
            </button>
          ))}
          {r.aDesFiltres && (
            <button
              type="button"
              onClick={r.reinitialiser}
              className="h-8 px-3 rounded-full text-xs font-medium text-brand-600 hover:text-brand-800 hover:bg-brand-50 transition-colors"
            >
              {cat.clearFilters}
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-bocaro-600">
          {cat.sortLabel}
          <select
            value={r.tri}
            onChange={(e) => r.setTri(e.target.value)}
            className="h-10 ps-3 pe-8 rounded-lg border border-bocaro-200 bg-surface text-sm text-bocaro-700 cursor-pointer hover:border-bocaro-500 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
          >
            <option value="recent">{cat.sortRecent}</option>
            <option value="prix-asc">{cat.sortPriceAsc}</option>
            <option value="prix-desc">{cat.sortPriceDesc}</option>
            <option value="nom">{cat.sortName}</option>
          </select>
        </label>
      </div>
    </>
  );
}

// Couleur d'aperçu de chaque teinte du dashboard (pastille du filtre).
const TEINTES = {
  "Bleu Méditerranée": "#2a5caa",
  "Blanc": "#f7f5ef",
  "Terracotta": "#c0623b",
  "Vert émeraude": "#1f8a5b",
  "Jaune ocre": "#d4a12a",
  "Noir": "#1d1d1f",
  "Gris anthracite": "#4a4f55",
  "Beige sable": "#d9c6a0",
  "Rouge brique": "#9c3324",
  "Turquoise": "#2fb3b0",
};

// Groupe de pastilles à cocher. Le nombre affiché est celui des produits
// qu'on obtiendrait en cochant cette valeur ; une valeur sans résultat est
// grisée mais reste décochable.
function GroupeFiltre({ titre, groupe, choisies, libelle, pastille, onBasculer }) {
  if (groupe.valeurs.length === 0) return null;
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-bocaro-500 mb-2">{titre}</legend>
      <div className="flex flex-wrap gap-2">
        {groupe.valeurs.map((v) => {
          const choisie = choisies.includes(v);
          const n = groupe.comptes.get(v) ?? 0;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={choisie}
              disabled={!choisie && n === 0}
              onClick={() => onBasculer(v)}
              className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                choisie
                  ? "bg-bocaro-700 text-white border-bocaro-700"
                  : "bg-surface text-bocaro-700 border-bocaro-200 hover:border-bocaro-500"
              }`}
            >
              {pastille && (
                <span
                  aria-hidden="true"
                  className="w-3.5 h-3.5 rounded-full ring-1 ring-black/15"
                  style={{ background: pastille(v) ?? "transparent" }}
                />
              )}
              {choisie && <span aria-hidden="true">✓</span>}
              {libelle(v)}
              <span className={`text-xs tabular-nums ${choisie ? "text-white/80" : "text-bocaro-400"}`}>{n}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
