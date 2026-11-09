"use client";

export const DIMENSIONS_PRESETS = ["10 x 10 cm", "15 x 15 cm", "20 x 20 cm"];

export default function DimensionPicker({ defaultValue = [] }) {
  // Les dimensions "personnalisées" sont celles présentes dans
  // defaultValue mais qui ne font pas partie des presets.
  const personnaliseesExistantes = defaultValue.filter(
    (d) => !DIMENSIONS_PRESETS.includes(d)
  );

  return (
    <div className="flex flex-wrap items-start gap-2">
      {DIMENSIONS_PRESETS.map((d) => {
        const id = `dimension-${d}`;
        return (
          <label key={d} htmlFor={id} className="cursor-pointer select-none">
            <input
              type="checkbox"
              id={id}
              name="dimensions"
              value={d}
              defaultChecked={defaultValue.includes(d)}
              className="peer sr-only"
            />
            <span className="inline-block px-4 py-2 rounded-full text-sm border border-bocaro-200 text-bocaro-700 peer-checked:bg-bocaro-700 peer-checked:text-white peer-checked:border-bocaro-700 transition-colors">
              {d}
            </span>
          </label>
        );
      })}

      {/* Case "personnalisée" : le champ texte est un simple sibling
          révélé en CSS via peer-checked, aucun état React nécessaire. */}
      <input
        type="checkbox"
        id="dimension-perso-toggle"
        className="peer sr-only"
        defaultChecked={personnaliseesExistantes.length > 0}
      />
      <label
        htmlFor="dimension-perso-toggle"
        className="cursor-pointer select-none"
      >
        <span className="inline-block px-4 py-2 rounded-full text-sm border border-dashed border-bocaro-300 text-bocaro-600 peer-checked:bg-brand-500 peer-checked:text-white peer-checked:border-brand-500 transition-colors">
          Dimensions personnalisées
        </span>
      </label>

      <div className="hidden peer-checked:block basis-full mt-1">
        <input
          type="text"
          name="dimensions_personnalisees"
          defaultValue={personnaliseesExistantes.join(", ")}
          placeholder="Ex. 30 x 30 cm, Sur mesure"
          className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
        />
        <p className="text-xs text-bocaro-400 mt-1">
          Sépare plusieurs dimensions par une virgule.
        </p>
      </div>
    </div>
  );
}
