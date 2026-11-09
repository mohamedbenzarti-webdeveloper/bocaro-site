"use client";

import {
  localizeProductField,
  translateFixedField,
  productTypeTranslations,
  productColourTranslations,
} from "../../lib/translations";

// Fiche du carreau en cours de simulation : nom, catégorie, formats
// et couleurs — les informations dont un client a besoin pour
// reconnaître le produit et le demander ensuite.
export default function TileInfoPanel({ produit, locale, uniteLabel, labels }) {
  if (!produit) return null;

  const nom = localizeProductField(produit, "nom", locale);
  const type = translateFixedField(productTypeTranslations, produit.type, locale);
  const formats = produit.dimensions ?? [];
  const couleurs = produit.couleurs ?? [];

  return (
    <div className="bg-surface rounded-2xl border border-bocaro-100 overflow-hidden">
      <div className="flex items-center gap-4 p-5 border-b border-bocaro-100">
        {produit.images?.[0] && (
          <img
            src={produit.images[0]}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-sm"
          />
        )}
        <div className="min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-500">
            {type}
          </span>
          <p className="font-serif text-lg font-bold text-bocaro-950 truncate">
            {nom}
          </p>
          {produit.prix != null && (
            <p className="text-sm text-bocaro-600">
              {produit.prix} {uniteLabel}
            </p>
          )}
        </div>
      </div>

      <dl className="p-5 space-y-4 text-sm">
        {formats.length > 0 && (
          <div>
            <dt className="text-xs font-semibold text-bocaro-500 uppercase tracking-wide mb-1.5">
              {labels.format}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {formats.map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-full border border-bocaro-200 text-bocaro-700 text-xs"
                >
                  {f}
                </span>
              ))}
            </dd>
          </div>
        )}

        {couleurs.length > 0 && (
          <div>
            <dt className="text-xs font-semibold text-bocaro-500 uppercase tracking-wide mb-1.5">
              {labels.colours}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {couleurs.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded-full border border-bocaro-200 text-bocaro-700 text-xs"
                >
                  {translateFixedField(productColourTranslations, c, locale)}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
