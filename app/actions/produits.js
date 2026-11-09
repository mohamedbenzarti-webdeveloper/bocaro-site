"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { exigerAdmin } from "../../lib/supabase/admin";
import { BUCKET, cheminDepuisUrl, supprimerFichiers } from "../../lib/supabase/stockage";

// Délai avant qu'un fichier non utilisé soit considéré comme abandonné :
// laisse le temps à un envoi en cours d'être enregistré dans un produit.
const DELAI_ORPHELIN_MS = 60 * 60 * 1000;

function lireFormulaire(formData) {
  // Dimensions = presets cochés (getAll) + dimensions personnalisées
  // tapées dans le champ texte, séparées par des virgules.
  const dimensionsPresets = formData.getAll("dimensions").map((d) => d.toString());
  const dimensionsPerso = (formData.get("dimensions_personnalisees")?.toString() || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  return {
    nom: formData.get("nom")?.toString().trim(),
    nom_en: formData.get("nom_en")?.toString().trim() || null,
    nom_ar: formData.get("nom_ar")?.toString().trim() || null,
    type: formData.get("type")?.toString().trim(),
    description: formData.get("description")?.toString().trim() || null,
    description_en: formData.get("description_en")?.toString().trim() || null,
    description_ar: formData.get("description_ar")?.toString().trim() || null,
    dimensions: [...dimensionsPresets, ...dimensionsPerso],
    // Chaque couleur cochée dans le ColorPicker est un
    // <input type="checkbox" name="couleurs" value="..." /> séparé,
    // donc getAll("couleurs") renvoie directement le tableau choisi.
    couleurs: formData.getAll("couleurs").map((c) => c.toString()),
    prix: Number(formData.get("prix")),
    // URLs déjà envoyées vers Supabase Storage côté client avant l'appel
    // à cette action (voir ProductForm.js). Seules les photos du bucket
    // sont acceptées : on sait ainsi toujours les supprimer plus tard.
    images: formData
      .getAll("images")
      .map((u) => u.toString())
      .filter((u) => cheminDepuisUrl(u)),
  };
}

// Invalide le cache ISR des pages du catalogue : la liste (/catalogue)
// et toutes les fiches produit (/catalogue/[id]).
function revaliderCatalogue(id) {
  revalidatePath("/dashboard");
  revalidatePath("/produits");
  revalidatePath("/produits/[id]", "page");
  if (id) revalidatePath(`/produits/${id}`);
  // Rétrocompatibilité
  revalidatePath("/catalogue");
  revalidatePath("/catalogue/[id]", "page");
  if (id) revalidatePath(`/catalogue/${id}`);
}

export async function creerProduit(formData) {
  const supabase = await createClient();
  const refus = await exigerAdmin(supabase);
  if (refus) return refus;
  const produit = lireFormulaire(formData);

  const { error } = await supabase.from("produits").insert(produit);
  if (error) {
    return { erreur: error.message };
  }

  revaliderCatalogue();
  redirect("/dashboard");
}

export async function modifierProduit(id, formData) {
  const supabase = await createClient();
  const refus = await exigerAdmin(supabase);
  if (refus) return refus;
  const produit = lireFormulaire(formData);

  // Photos actuelles, pour supprimer du stockage celles qui sont retirées.
  const { data: avant } = await supabase.from("produits").select("images").eq("id", id).single();

  const { error } = await supabase
    .from("produits")
    .update(produit)
    .eq("id", id);

  if (error) {
    return { erreur: error.message };
  }

  const retirees = (avant?.images ?? []).filter((u) => !produit.images.includes(u));
  const erreurStockage = await supprimerFichiers(supabase, retirees);
  if (erreurStockage) console.error("Photos retirées non supprimées du stockage :", erreurStockage);

  revaliderCatalogue(id);
  redirect("/dashboard");
}

export async function supprimerProduit(id) {
  const supabase = await createClient();
  const refus = await exigerAdmin(supabase);
  if (refus) return refus;

  const { data: produit } = await supabase.from("produits").select("images").eq("id", id).single();
  const { error } = await supabase.from("produits").delete().eq("id", id);

  if (error) {
    return { erreur: error.message };
  }

  // Le produit est supprimé ; ses photos partent avec lui.
  const erreurStockage = await supprimerFichiers(supabase, produit?.images);
  revaliderCatalogue(id);
  if (erreurStockage) {
    return { erreur: `Produit supprimé, mais ses photos sont restées dans le stockage : ${erreurStockage}` };
  }
}

/**
 * Annule les photos envoyées pour un enregistrement qui a échoué. Par
 * sécurité, une photo déjà utilisée par un produit n'est jamais supprimée.
 */
export async function annulerEnvois(urls) {
  const supabase = await createClient();
  const refus = await exigerAdmin(supabase);
  if (refus) return refus;
  const utilisees = await urlsUtilisees(supabase);
  if (!utilisees) return { erreur: "Impossible de vérifier les photos utilisées." };
  const erreur = await supprimerFichiers(supabase, (urls ?? []).filter((u) => !utilisees.has(cheminDepuisUrl(u))));
  return erreur ? { erreur } : null;
}

/** Chemins de toutes les photos utilisées par un produit (null en cas d'erreur). */
async function urlsUtilisees(supabase) {
  const { data, error } = await supabase.from("produits").select("images");
  if (error) return null;
  return new Set(data.flatMap((p) => p.images ?? []).map(cheminDepuisUrl).filter(Boolean));
}

/** Fichiers du bucket qu'aucun produit n'utilise, déposés il y a plus d'une heure. */
async function listerOrphelins(supabase) {
  const utilisees = await urlsUtilisees(supabase);
  if (!utilisees) return { erreur: "Impossible de lire les produits." };
  const fichiers = [];
  for (let page = 0; ; page++) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, offset: page * 1000, sortBy: { column: "name", order: "asc" } });
    if (error) return { erreur: error.message };
    fichiers.push(...data.filter((f) => f.id)); // les dossiers n'ont pas d'id
    if (data.length < 1000) break;
  }
  const limite = Date.now() - DELAI_ORPHELIN_MS;
  const orphelins = fichiers.filter(
    (f) => !utilisees.has(f.name) && new Date(f.created_at).getTime() < limite
  );
  const octets = orphelins.reduce((s, f) => s + (f.metadata?.size ?? 0), 0);
  return { orphelins, octets };
}

/** Nombre et poids des fichiers inutilisés (affiché dans le dashboard). */
export async function compterOrphelins() {
  const supabase = await createClient();
  const refus = await exigerAdmin(supabase);
  if (refus) return refus;
  const r = await listerOrphelins(supabase);
  if (r.erreur) return r;
  return { nombre: r.orphelins.length, octets: r.octets };
}

/** Supprime du bucket tous les fichiers qu'aucun produit n'utilise. */
export async function purgerOrphelins() {
  const supabase = await createClient();
  const refus = await exigerAdmin(supabase);
  if (refus) return refus;
  const r = await listerOrphelins(supabase);
  if (r.erreur) return r;
  const noms = r.orphelins.map((f) => f.name);
  for (let i = 0; i < noms.length; i += 100) {
    const { error } = await supabase.storage.from(BUCKET).remove(noms.slice(i, i + 100));
    if (error) return { erreur: error.message };
  }
  revalidatePath("/dashboard");
  return { supprimes: noms.length, octets: r.octets };
}

export async function deconnexion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
