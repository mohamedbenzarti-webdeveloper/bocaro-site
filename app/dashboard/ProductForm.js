"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { annulerEnvois, creerProduit, modifierProduit } from "../actions/produits";
import { createClient } from "../../lib/supabase/client";
import ColorPicker from "../../components/admin/ColorPicker";
import DimensionPicker from "../../components/admin/DimensionPicker";
import ImageUploader from "../../components/admin/ImageUploader";

const TYPES = [
  "Carreau ciment",
  "Terre cuite",
  "Faïence",
  "Mosaïque",
  "Sur mesure",
];

const LANGUES_FORM = [
  { code: "", label: "Français", requis: true },
  { code: "_en", label: "English" },
  { code: "_ar", label: "العربية" },
];

// Nom de fichier accepté par Supabase Storage (a-z 0-9 . _ -) :
// "Anémone.png" → "anemone.png", "Carreau étoile (2).JPG" →
// "carreau-etoile-2.jpg" ; un nom sans lettre latine (ex. arabe)
// devient "image.webp". L'extension est conservée à part.
function nomFichierSur(nom) {
  const point = nom.lastIndexOf(".");
  const base = point > 0 ? nom.slice(0, point) : nom;
  const ext = point > 0 ? nom.slice(point + 1) : "";
  const nettoyer = (s) =>
    s
      .replace(/œ/gi, "oe")
      .replace(/æ/gi, "ae")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  const extSure = nettoyer(ext);
  return (nettoyer(base) || "image") + (extSure ? `.${extSure}` : "");
}

// Compression avant envoi : une photo de 1,5 à 3 Mo (PNG notamment)
// dépassait le délai de 7 s de l'optimiseur d'images de Next.js
// ("upstream image response timed out"). Redimensionnée à COTE_MAX px
// et convertie en WebP, elle pèse ~150-300 Ko, sans perte visible.
const COTE_MAX = 1600;
const QUALITE = 0.85;

async function compresserImage(file) {
  // GIF (animé) et SVG (vectoriel) : envoyés tels quels.
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const k = Math.min(1, COTE_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * k);
    canvas.height = Math.round(bitmap.height * k);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const encoder = (type) => new Promise((ok) => canvas.toBlob(ok, type, QUALITE));
    let blob = await encoder("image/webp");
    // Navigateur sans encodeur WebP (ancien Safari) : JPEG, fond blanc.
    if (!blob || blob.type !== "image/webp") {
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blob = await encoder("image/jpeg");
    }
    // On ne garde la version compressée que si elle est plus légère.
    if (!blob || blob.size >= file.size) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.${ext}`, { type: blob.type });
  } catch {
    return file; // format non décodable : fichier d'origine
  }
}

export default function ProductForm({ produit }) {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [etapeEnvoi, setEtapeEnvoi] = useState("");
  const [images, setImages] = useState(
    (produit?.images ?? []).map((url) => ({ url }))
  );
  const [langueActive, setLangueActive] = useState("");
  const estModification = Boolean(produit);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    // Photos envoyées pendant CET enregistrement : supprimées du stockage
    // s'il échoue, pour ne pas laisser de fichiers abandonnés.
    const nouvelles = [];

    try {
      // 1. Envoyer les nouvelles images (celles avec un `file`) vers
      //    Supabase Storage, et récupérer leurs URLs publiques.
      const supabase = createClient();
      const urlsFinales = [];

      for (const img of images) {
        if (img.url) {
          urlsFinales.push(img.url);
          continue;
        }
        setEtapeEnvoi(`Compression de ${img.file.name}...`);
        const fichier = await compresserImage(img.file);
        setEtapeEnvoi(`Envoi de ${img.file.name}...`);
        // Supabase Storage refuse les accents et caractères spéciaux dans
        // les noms ("Anémone.png" → "Invalid key") : nom ramené à
        // a-z 0-9 . _ - ("anemone.png"). Le nom d'origine reste affiché.
        const nomSur = nomFichierSur(fichier.name);
        const cheminFichier = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${nomSur}`;

        const { error: erreurUpload } = await supabase.storage
          .from("produits")
          .upload(cheminFichier, fichier, {
            contentType: fichier.type,
            cacheControl: "31536000",
          });

        if (erreurUpload) {
          throw new Error(
            `Échec de l'envoi de l'image "${img.file.name}" : ${erreurUpload.message}`
          );
        }

        const { data } = supabase.storage
          .from("produits")
          .getPublicUrl(cheminFichier);
        urlsFinales.push(data.publicUrl);
        nouvelles.push(data.publicUrl);
      }

      setEtapeEnvoi("");

      // 2. Construire le formulaire final et l'envoyer à l'action serveur.
      const formData = new FormData(e.target);
      urlsFinales.forEach((url) => formData.append("images", url));

      const resultat = estModification
        ? await modifierProduit(produit.id, formData)
        : await creerProduit(formData);

      if (resultat?.erreur) {
        setErreur(resultat.erreur);
        await annulerEnvois(nouvelles);
      }
    } catch (err) {
      // Une redirection de Next.js n'est pas une erreur : on la laisse passer.
      if (String(err?.digest ?? "").startsWith("NEXT_REDIRECT")) throw err;
      setErreur(err.message || "Une erreur est survenue.");
      if (nouvelles.length) await annulerEnvois(nouvelles).catch(() => {});
    } finally {
      setChargement(false);
      setEtapeEnvoi("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-bocaro-900 mb-2">
          Nom et description
        </label>
        <div className="flex gap-2 mb-4">
          {LANGUES_FORM.map((l) => (
            <button
              type="button"
              key={l.code}
              onClick={() => setLangueActive(l.code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                langueActive === l.code
                  ? "bg-bocaro-700 text-white border-bocaro-700"
                  : "bg-surface text-bocaro-700 border-bocaro-200 hover:border-bocaro-500"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {LANGUES_FORM.map((l) => (
          <div key={l.code} hidden={langueActive !== l.code} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-bocaro-600 mb-1">
                Nom du produit {l.requis ? "" : "(optionnel)"}
              </label>
              <input
                name={`nom${l.code}`}
                required={l.requis}
                defaultValue={produit?.[`nom${l.code}`] ?? ""}
                dir={l.code === "_ar" ? "rtl" : "ltr"}
                placeholder="Ex. Carreau étoile bleue"
                className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-bocaro-600 mb-1">
                Description {l.requis ? "" : "(optionnel)"}
              </label>
              <textarea
                name={`description${l.code}`}
                rows={4}
                dir={l.code === "_ar" ? "rtl" : "ltr"}
                defaultValue={produit?.[`description${l.code}`] ?? ""}
                placeholder="Décris le produit : matière, finition, usage recommandé..."
                className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-bocaro-400 mt-1">
          Si l'anglais ou l'arabe n'est pas rempli, le français s'affichera par défaut sur le site.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-bocaro-900 mb-1">
          Type
        </label>
        <select
          name="type"
          required
          defaultValue={produit?.type ?? TYPES[0]}
          className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500 bg-surface"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <p className="text-xs text-bocaro-400 mt-1">
          Traduit automatiquement en anglais et arabe sur le site.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-bocaro-900 mb-1">
          Dimensions
        </label>
        <DimensionPicker defaultValue={produit?.dimensions ?? []} />
      </div>

      <div>
        <label className="block text-sm font-medium text-bocaro-900 mb-1">
          Couleurs
        </label>
        <ColorPicker defaultValue={produit?.couleurs ?? []} />
      </div>

      <div>
        <label className="block text-sm font-medium text-bocaro-900 mb-1">
          Prix (DT / m²)
        </label>
        <input
          name="prix"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={produit?.prix}
          className="w-full px-4 py-2.5 rounded-xl border border-bocaro-200 focus:outline-none focus:ring-2 focus:ring-bocaro-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-bocaro-900 mb-1">
          Photos
        </label>
        <ImageUploader value={images} onChange={setImages} />
      </div>

      {erreur && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {erreur}
        </p>
      )}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={chargement}
          className="btn-primary disabled:opacity-60"
        >
          {chargement
            ? etapeEnvoi || "Enregistrement..."
            : estModification
            ? "Enregistrer les modifications"
            : "Ajouter le produit"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 rounded-xl border border-bocaro-200 text-bocaro-700 font-medium hover:bg-bocaro-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
