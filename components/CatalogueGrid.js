"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../context/LanguageContext";
import Pagination from "./Pagination";
import { useRechercheProduits, PanneauRecherche } from "./RechercheProduits";
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
  const haut = useRef(null);
  const r = useRechercheProduits(produits, locale, () => setPage(1));
  const produitsFiltres = r.resultats;
  const reinitialiser = r.reinitialiser;

  // Changement de page : on remonte en haut de la recherche.
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
      <section className="bg-hero-pattern text-white section-padding">
        <div className="container-app text-center max-w-2xl mx-auto">
          <span className="eyebrow !text-brand-300">{cat.badge}</span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-3">
            {cat.title}
          </h1>
          <p className="text-bocaro-100 mt-5">{cat.lead}</p>
        </div>
      </section>

      <section className="section-padding bg-surface">
        <div className="container-app">
          {/* ——— RECHERCHE, FILTRES ET TRI ——— */}
          <div ref={haut} className="scroll-mt-28">
            <PanneauRecherche r={r} />
          </div>

          {/* ——— GRILLE PRODUITS ——— */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {produitsPage.map((p, index) => {
              const nomAffiche = localizeProductField(p, "nom", locale);
              const descAffichee = localizeProductField(
                p,
                "description",
                locale
              );
              const waMsg = `${cat.waInterest} ${nomAffiche}`;
              return (
                <div
                  key={p.id}
                  className="bg-surface rounded-lg overflow-hidden border border-bocaro-100 card-hover reveal"
                >
                  <Link href={`/produits/${p.id}`}>
                    <div className="relative h-56 overflow-hidden bg-bocaro-50">
                      {p.images?.[0] ? (
                        <Image
                          src={p.images[0]}
                          alt={nomAffiche}
                          fill
                          priority={index < 3}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-bocaro-300 text-sm">
                          {cat.noImage ?? "Photo à venir"}
                        </div>
                      )}
                    </div>
                    <div className="px-6 pt-6">
                      <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                        {translateFixedField(
                          productTypeTranslations,
                          p.type,
                          locale
                        )}
                      </span>
                      <h2 className="font-serif text-lg font-bold text-bocaro-950 mt-2 mb-2 hover:text-bocaro-700 transition-colors">
                        {nomAffiche}
                      </h2>
                      {descAffichee && (
                        <p className="text-sm text-bocaro-500 mb-2 line-clamp-2">
                          {descAffichee}
                        </p>
                      )}
                      <p className="text-sm text-bocaro-600 mb-1">
                        {p.dimensions?.join(", ")}
                      </p>
                      <p className="text-sm text-bocaro-600 mb-4">
                        {p.couleurs
                          ?.map((c) =>
                            translateFixedField(
                              productColourTranslations,
                              c,
                              locale
                            )
                          )
                          .join(", ")}
                      </p>
                    </div>
                  </Link>
                  <div className="px-6 pb-6">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-bocaro-700">
                        {p.prix} {cat.unit}
                      </span>
                      <a
                        href={`https://wa.me/21698514014?text=${encodeURIComponent(
                          waMsg
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-bocaro-700 hover:text-bocaro-900 inline-block py-2.5 -my-2.5"
                      >
                        {cat.askButton}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {produitsFiltres.length === 0 && (
            <div className="text-center mt-12">
              <p className="text-bocaro-500 mb-4">{cat.noResults}</p>
              <button
                onClick={reinitialiser}
                className="text-sm font-medium text-brand-600 hover:text-brand-800 underline transition-colors"
              >
                {cat.clearFilters}
              </button>
            </div>
          )}

          {/* PAGINATION — affichée seulement s'il y a plus d'une page */}
          <Pagination
            page={pageCourante}
            nbPages={nbPages}
            onChange={allerPage}
          />
        </div>
      </section>

      <section className="bg-bocaro-50 py-14">
        <div className="container-app text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-bocaro-950 mb-4">
            {cat.customTitle}
          </h2>
          <p className="text-bocaro-600 mb-6 max-w-xl mx-auto">
            {cat.customText}
          </p>
          <a
            href="https://wa.me/21698514014"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {cat.customButton}
          </a>
        </div>
      </section>
    </div>
  );
}

