"use client";

// Palette de couleurs courantes en céramique/faïence tunisienne.
// Chaque couleur cochée est envoyée au formulaire via
// <input type="checkbox" name="couleurs" value="..." />, donc
// formData.getAll("couleurs") renvoie directement le tableau choisi
// — pas besoin de gérer d'état React ni de sérialisation JSON.
export const PALETTE_COULEURS = [
  { label: "Bleu Méditerranée", hex: "#153bc0" },
  { label: "Blanc", hex: "#f8f8f6" },
  { label: "Terracotta", hex: "#c76f42" },
  { label: "Vert émeraude", hex: "#1f7a5c" },
  { label: "Jaune ocre", hex: "#d9a441" },
  { label: "Noir", hex: "#1a1a2e" },
  { label: "Gris anthracite", hex: "#4a4a52" },
  { label: "Beige sable", hex: "#e3d0b5" },
  { label: "Rouge brique", hex: "#a84424" },
  { label: "Turquoise", hex: "#2a9d9d" },
];

export default function ColorPicker({ defaultValue = [] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {PALETTE_COULEURS.map((c) => {
          const id = `couleur-${c.label}`;
          const cocheParDefaut = defaultValue.includes(c.label);
          return (
            <label
              key={c.label}
              htmlFor={id}
              className="group flex flex-col items-center gap-1.5 cursor-pointer select-none"
              title={c.label}
            >
              <input
                type="checkbox"
                id={id}
                name="couleurs"
                value={c.label}
                defaultChecked={cocheParDefaut}
                className="peer sr-only"
              />
              <span
                style={{ backgroundColor: c.hex }}
                className="w-9 h-9 rounded-full border-2 border-white shadow-sm ring-1 ring-bocaro-200 transition-all peer-checked:ring-4 peer-checked:ring-bocaro-500 peer-checked:scale-110"
              />
              <span className="text-[11px] text-bocaro-600 group-has-[:checked]:text-bocaro-900 group-has-[:checked]:font-semibold text-center leading-tight max-w-[64px]">
                {c.label}
              </span>
            </label>
          );
        })}
      </div>
      <p className="text-xs text-bocaro-400 mt-3">
        Clique sur les couleurs disponibles pour ce produit (plusieurs choix
        possibles).
      </p>
    </div>
  );
}
