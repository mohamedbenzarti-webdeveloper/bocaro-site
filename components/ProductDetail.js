"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "../context/LanguageContext";
import {
  translateFixedField,
  localizeProductField,
  productTypeTranslations,
  productColourTranslations,
} from "../lib/translations";

export default function ProductDetail({ produit }) {
  const { t, locale } = useLanguage();
  const cat = t.catalogue;
  const images = produit.images?.length ? produit.images : [];
  const [imageActive, setImageActive] = useState(0);
  const plusieurs = images.length > 1;
  const departDoigt = useRef(null);

  // Navigation en boucle : après la dernière image, retour à la première.
  const imagePrecedente = () => setImageActive((i) => (i - 1 + images.length) % images.length);
  const imageSuivante = () => setImageActive((i) => (i + 1) % images.length);

  const nomAffiche = localizeProductField(produit, "nom", locale);
  const descAffichee = localizeProductField(produit, "description", locale);
  const typeAffiche = translateFixedField(productTypeTranslations, produit.type, locale);
  const waMsg = `${cat.waInterest} ${nomAffiche}`;

  return (
    <section className="section-padding bg-surface">
      <div className="container-app">
        <Link
          href="/produits"
          className="text-sm font-medium text-bocaro-600 hover:text-bocaro-900 inline-block py-2.5 mb-5"
        >
          {cat.detailBack}
        </Link>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* GALERIE D'IMAGES */}
          <div>
            <div
              className="group relative aspect-square rounded-lg overflow-hidden bg-bocaro-50 border border-bocaro-100"
              // Clavier (← →) et glissement du doigt sur mobile.
              tabIndex={plusieurs ? 0 : undefined}
              onKeyDown={(e) => {
                if (!plusieurs) return;
                const rtl = document.documentElement.dir === "rtl";
                if (e.key === "ArrowLeft") (rtl ? imageSuivante : imagePrecedente)();
                if (e.key === "ArrowRight") (rtl ? imagePrecedente : imageSuivante)();
              }}
              onTouchStart={(e) => (departDoigt.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                if (!plusieurs || departDoigt.current == null) return;
                const dx = e.changedTouches[0].clientX - departDoigt.current;
                departDoigt.current = null;
                if (Math.abs(dx) < 40) return;
                const rtl = document.documentElement.dir === "rtl";
                (dx < 0) !== rtl ? imageSuivante() : imagePrecedente();
              }}
            >
              {images.length > 0 ? (
                // Toutes les photos sont empilées et chargées dès l'ouverture
                // (la première en priorité) ; seule la photo active est
                // visible. Changer d'image est donc instantané, au lieu
                // d'attendre la première optimisation de chaque photo (~1,5 s).
                images.map((url, index) => (
                  <Image
                    key={url}
                    src={url}
                    alt={index === imageActive ? nomAffiche : ""}
                    aria-hidden={index === imageActive ? undefined : true}
                    fill
                    {...(index === 0
                      ? { preload: true }
                      : { loading: "eager", fetchPriority: "low" })}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className={`object-cover transition-opacity duration-300 ${
                      index === imageActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-bocaro-300 text-sm">
                  {cat.noImage ?? "Photo à venir"}
                </div>
              )}

              {/* Flèches (seulement s'il y a plusieurs images) ; en arabe,
                  "précédent" est à droite et les flèches sont inversées. */}
              {plusieurs && (
                <>
                  <button
                    type="button"
                    onClick={imagePrecedente}
                    aria-label={cat.imagePrev}
                    className="absolute start-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/75 text-white shadow-lg shadow-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 transition duration-200"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 5l-7 7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={imageSuivante}
                    aria-label={cat.imageNext}
                    className="absolute end-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/75 text-white shadow-lg shadow-black/25 backdrop-blur-sm flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 transition duration-200"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <span
                    aria-live="polite"
                    className="absolute bottom-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 px-3 py-1 rounded-full bg-black/55 text-white text-xs font-medium tabular-nums"
                  >
                    {imageActive + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {images.map((url, index) => (
                  <button
                    key={url}
                    onClick={() => setImageActive(index)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      index === imageActive
                        ? "border-bocaro-700"
                        : "border-transparent hover:border-bocaro-300"
                    }`}
                  >
                    <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CARACTÉRISTIQUES */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              {typeAffiche}
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-bocaro-950 mt-2 mb-4">
              {nomAffiche}
            </h1>

            <p className="text-2xl font-semibold text-bocaro-700 mb-6">
              {produit.prix} {cat.unit}
            </p>

            <div className="space-y-5 mb-8">
              <div>
                <h2 className="text-sm font-semibold text-bocaro-900 mb-1">
                  {cat.detailDescription}
                </h2>
                <p className="text-bocaro-600 leading-relaxed">
                  {descAffichee || cat.detailNoDescription}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-bocaro-900 mb-2">
                  {cat.detailDimensions}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(produit.dimensions ?? []).map((d) => (
                    <span
                      key={d}
                      className="px-3 py-1.5 rounded-md text-sm border border-bocaro-200 text-bocaro-700"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-bocaro-900 mb-2">
                  {cat.detailColours}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(produit.couleurs ?? []).map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 rounded-md text-sm border border-bocaro-200 text-bocaro-700"
                    >
                      {translateFixedField(productColourTranslations, c, locale)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/21698514014?text=${encodeURIComponent(
                waMsg
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              {cat.askButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
