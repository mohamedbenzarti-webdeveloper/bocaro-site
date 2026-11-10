"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../context/LanguageContext";
import Pagination from "./Pagination";
import {
  useRechercheProduits,
  ChampRecherche,
  FiltresRecherche,
  BarreResultats,
} from "./RechercheProduits";
import {
  translateFixedField,
  localizeProductField,
  productTypeTranslations,
  productColourTranslations,
} from "../lib/translations";

// Nombre de produits affichés par page (grille de 3 × 3).
const PAR_PAGE = 9;

export default function CatalogueGrid({ produits }) {
  const { t, locale } = useLanguage();
  const cat = t.catalogue;

  const [page, setPage] = useState(1);
  // Sur téléphone et tablette, les filtres sont repliés derrière un bouton ;
  // sur ordinateur, ils restent affichés dans la colonne de gauche.
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const haut = useRef(null);
  const r = useRechercheProduits(produits, locale, () => setPage(1));
  const produitsFiltres = r.resultats;
  const reinitialiser = r.reinitialiser;

  // Changement de page : on remonte en haut des résultats.
  function allerPage(n) {
    setPage(n);
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const nbPages = Math.max(1, Math.ceil(produitsFiltres.length / PAR_PAGE));
  const pageCourante = Math.min(page, nbPages);
  const produitsPage = produitsFiltres.slice(
    (pageCourante - 1) * PAR_PAGE,
    pageCourante * PAR_PAGE
  );

  return (
    <div>
      {/* EN-TÊTE — titre à gauche, présentation à droite, sur l'ivoire */}
      <section className="bg-surface border-b border-bocaro-200">
        <div className="container-app pt-12 pb-10 md:pt-20 md:pb-14 grid lg:grid-cols-12 gap-6 lg:gap-14 items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow eyebrow-start entree">{cat.badge}</span>
            <h1
              className="font-serif text-[2.75rem] leading-[1.04] md:text-6xl lg:text-7xl text-bocaro-950 mt-5 entree"
              style={{ "--d": "80ms" }}
            >
              {cat.title}
            </h1>
          </div>
          <p className="lg:col-span-5 text-bocaro-600 text-lg leading-relaxed entree" style={{ "--d": "160ms" }}>
            {cat.lead}
          </p>
        </div>
      </section>

      <section className="bg-surface pt-10 pb-20 md:pt-14 md:pb-28">
        <div className="container-app grid lg:grid-cols-12 gap-10 lg:gap-12">
          {/* ——— COLONNE : RECHERCHE ET FILTRES ——— */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pe-2">
              <ChampRecherche r={r} />
              <button
                type="button"
                onClick={() => setFiltresOuverts((o) => !o)}
                aria-expanded={filtresOuverts}
                aria-controls="filtres-catalogue"
                className="lg:hidden mt-3 w-full h-12 px-4 flex items-center justify-between border border-bocaro-200 rounded text-sm font-semibold text-bocaro-950"
              >
                <span>
                  {cat.filtersTitle}
                  {r.actifs.length > 0 && (
                    <span className="ms-2 inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-bocaro-700 text-white text-xs tabular-nums">
                      {r.actifs.length}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`transition-transform duration-300 ${filtresOuverts ? "rotate-180" : ""}`}
                >
                  ▾
                </span>
              </button>
              <div id="filtres-catalogue" className={`${filtresOuverts ? "block" : "hidden"} lg:block mt-6`}>
                <FiltresRecherche r={r} encadre={false} />
              </div>
            </div>
          </aside>

          {/* ——— RÉSULTATS ——— */}
          <div className="lg:col-span-9 min-w-0">
            <div ref={haut} className="scroll-mt-28">
              <BarreResultats r={r} className="mb-8 pb-5 border-b border-bocaro-200" />
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {produitsPage.map((p, index) => {
                const nomAffiche = localizeProductField(p, "nom", locale);
                const descAffichee = localizeProductField(p, "description", locale);
                const waMsg = `${cat.waInterest} ${nomAffiche}`;
                return (
                  <article key={p.id} className="group flex flex-col reveal">
                    <Link href={`/produits/${p.id}`} className="block">
                      <div className="relative aspect-square overflow-hidden rounded bg-bocaro-100">
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={nomAffiche}
                            fill
                            preload={index < 3}
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover zoom-photo"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-bocaro-500 text-sm">
                            {cat.noImage ?? "Photo à venir"}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 mt-5">
                        {translateFixedField(productTypeTranslations, p.type, locale)}
                      </p>
                      <h2 className="font-serif text-2xl leading-tight text-bocaro-950 mt-1.5 group-hover:text-brand-600 transition-colors">
                        {nomAffiche}
                      </h2>
                      {descAffichee && (
                        <p className="text-sm text-bocaro-600 leading-relaxed mt-2 line-clamp-2">{descAffichee}</p>
                      )}
                      <div className="mt-3 space-y-0.5 text-sm text-bocaro-600">
                        {p.dimensions?.length > 0 && <p>{p.dimensions.join(" · ")}</p>}
                        {p.couleurs?.length > 0 && (
                          <p>
                            {p.couleurs
                              .map((c) => translateFixedField(productColourTranslations, c, locale))
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-bocaro-200">
                        <span className="font-medium text-bocaro-950 whitespace-nowrap">
                          {p.prix} {cat.unit}
                        </span>
                        <a
                          href={`https://wa.me/21698514014?text=${encodeURIComponent(waMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lien-anime text-sm font-semibold text-bocaro-950 hover:text-brand-600 inline-block py-2.5 -my-2.5 transition-colors"
                        >
                          {cat.askButton}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {produitsFiltres.length === 0 && (
              <div className="py-16 border-y border-bocaro-200 text-center">
                <p className="font-serif text-2xl text-bocaro-950 mb-4">{cat.noResults}</p>
                <button
                  onClick={reinitialiser}
                  className="lien-anime text-sm font-semibold text-brand-600 hover:text-brand-700 pb-1 transition-colors"
                >
                  {cat.clearFilters}
                </button>
              </div>
            )}

            {/* PAGINATION — affichée seulement s'il y a plus d'une page */}
            <Pagination page={pageCourante} nbPages={nbPages} onChange={allerPage} />
          </div>
        </div>
      </section>

      {/* SUR MESURE — bande lin, titre à gauche, texte et action à droite */}
      <section className="bg-bocaro-100">
        <div className="container-app py-16 md:py-20 grid lg:grid-cols-12 gap-6 lg:gap-14 items-end">
          <h2 className="lg:col-span-6 font-serif text-4xl md:text-5xl leading-[1.08] text-bocaro-950">
            {cat.customTitle}
          </h2>
          <div className="lg:col-span-6">
            <p className="text-bocaro-600 text-lg leading-relaxed mb-7 max-w-xl">{cat.customText}</p>
            <a
              href="https://wa.me/21698514014"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              {cat.customButton}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
