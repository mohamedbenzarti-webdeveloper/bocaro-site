"use client";

// Composant contrôlé : le parent (ProductForm) garde la liste des
// images dans son state et nous la passe via `value` + `onChange`.
// Chaque élément est soit :
//   { url: "https://..." }              -> image déjà envoyée (mode édition)
//   { file: File, preview: "blob:..." }  -> nouvelle image pas encore envoyée
//
// Les boutons (retirer, déplacer, mettre en principale) sont toujours
// visibles : sur téléphone ou tablette, il n'y a pas de survol à la souris.
// Tout se fait aussi au clavier.
export default function ImageUploader({ value = [], onChange }) {
  const handleFilesSelected = (e) => {
    const fichiers = Array.from(e.target.files || []);
    if (fichiers.length === 0) return;

    const nouveaux = fichiers.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    onChange([...value, ...nouveaux]);
    // Permet de resélectionner le même fichier plus tard si besoin
    e.target.value = "";
  };

  const retirerImage = (index) => {
    const copie = [...value];
    const [retire] = copie.splice(index, 1);
    if (retire?.preview) URL.revokeObjectURL(retire.preview);
    onChange(copie);
  };

  // Déplace la photo `index` à la position `vers` (0 = photo principale).
  const deplacer = (index, vers) => {
    if (vers < 0 || vers >= value.length || vers === index) return;
    const copie = [...value];
    const [img] = copie.splice(index, 1);
    copie.splice(vers, 0, img);
    onChange(copie);
  };

  const bouton =
    "w-7 h-7 rounded-full bg-black/65 text-white text-xs flex items-center justify-center hover:bg-black/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-30";

  return (
    <div>
      <ul className="flex flex-wrap gap-3 mb-3" aria-label="Photos du produit">
        {value.map((img, index) => (
          <li
            key={img.url ?? img.preview}
            className="relative w-28 h-28 rounded-xl overflow-hidden border border-bocaro-200"
          >
            <img
              src={img.url ?? img.preview}
              alt={`Photo ${index + 1}${index === 0 ? " (principale)" : ""}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => retirerImage(index)}
              className={`${bouton} absolute top-1 right-1`}
              aria-label={`Retirer la photo ${index + 1}`}
            >
              ✕
            </button>
            {index === 0 ? (
              <span className="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[10px] text-center py-1">
                Principale
              </span>
            ) : (
              <div className="absolute bottom-1 inset-x-1 flex justify-between">
                <button
                  type="button"
                  onClick={() => deplacer(index, index - 1)}
                  className={bouton}
                  aria-label={`Déplacer la photo ${index + 1} vers la gauche`}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => deplacer(index, 0)}
                  className={`${bouton} w-auto px-2 text-[10px]`}
                  aria-label={`Utiliser la photo ${index + 1} comme photo principale`}
                >
                  ★
                </button>
                <button
                  type="button"
                  onClick={() => deplacer(index, index + 1)}
                  disabled={index === value.length - 1}
                  className={bouton}
                  aria-label={`Déplacer la photo ${index + 1} vers la droite`}
                >
                  →
                </button>
              </div>
            )}
          </li>
        ))}

        <li>
          {/* Champ fichier masqué visuellement (sr-only) mais pas retiré
              (hidden) : il reste atteignable avec Tab et activable avec
              Entrée ou Espace ; le cadre affiche alors l'anneau de focus. */}
          <label className="w-28 h-28 rounded-xl border-2 border-dashed border-bocaro-300 text-bocaro-400 flex flex-col items-center justify-center cursor-pointer hover:border-bocaro-500 hover:text-bocaro-600 focus-within:ring-2 focus-within:ring-bocaro-500 transition-colors text-center px-1">
            <span className="text-2xl leading-none" aria-hidden="true">+</span>
            <span className="text-[11px] mt-1">Ajouter</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesSelected}
              className="sr-only"
              aria-label="Ajouter des photos"
            />
          </label>
        </li>
      </ul>
      <p className="text-xs text-bocaro-400">
        La première image est la photo principale du catalogue. ★ la met en
        premier, ← et → changent l&apos;ordre.
      </p>
    </div>
  );
}
