"use client";

// Composant contrôlé : le parent (ProductForm) garde la liste des
// images dans son state et nous la passe via `value` + `onChange`.
// Chaque élément est soit :
//   { url: "https://..." }              -> image déjà envoyée (mode édition)
//   { file: File, preview: "blob:..." }  -> nouvelle image pas encore envoyée
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

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {value.map((img, index) => (
          <div
            key={img.url ?? img.preview}
            className="relative w-24 h-24 rounded-xl overflow-hidden border border-bocaro-200 group"
          >
            <img
              src={img.url ?? img.preview}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => retirerImage(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Retirer cette image"
            >
              ✕
            </button>
            {index === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                Principale
              </span>
            )}
          </div>
        ))}

        <label className="w-24 h-24 rounded-xl border-2 border-dashed border-bocaro-300 text-bocaro-400 flex flex-col items-center justify-center cursor-pointer hover:border-bocaro-500 hover:text-bocaro-600 transition-colors text-center px-1">
          <span className="text-2xl leading-none">+</span>
          <span className="text-[11px] mt-1">Ajouter</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-xs text-bocaro-400">
        La première image est utilisée comme photo principale dans le
        catalogue.
      </p>
    </div>
  );
}
