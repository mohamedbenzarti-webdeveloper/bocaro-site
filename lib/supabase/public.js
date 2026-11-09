// Accès public minimal à Supabase (lecture des produits)
// par simples requêtes HTTP vers l'API REST, sans charger la bibliothèque
// @supabase/supabase-js (~67 Ko compressés) sur les pages publiques. Les
// droits restent ceux du rôle "anon" définis par les règles RLS de la base.
// La bibliothèque complète n'est utilisée que pour la connexion et le
// dashboard.

const URL_API = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const entetes = {
  apikey: CLE,
  Authorization: `Bearer ${CLE}`,
};

async function erreurDe(reponse) {
  try {
    const corps = await reponse.json();
    return corps?.message || `Erreur ${reponse.status}`;
  } catch {
    return `Erreur ${reponse.status}`;
  }
}

/** Liste des produits, du plus récent au plus ancien. → { data, error } */
export async function lireProduits({ limite } = {}) {
  const params = new URLSearchParams({ select: "*", order: "created_at.desc" });
  if (limite) params.set("limit", String(limite));
  try {
    // Côté serveur, mise en cache 60 s (ignoré dans le navigateur) : un
    // produit ajouté depuis le dashboard apparaît en moins d'une minute.
    const reponse = await fetch(`${URL_API}/produits?${params}`, {
      headers: entetes,
      next: { revalidate: 60 },
    });
    if (!reponse.ok) return { data: null, error: { message: await erreurDe(reponse) } };
    return { data: await reponse.json(), error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

/** Un seul produit par identifiant. → { data, error } */
export async function lireProduit(id) {
  try {
    const reponse = await fetch(
      `${URL_API}/produits?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: entetes, next: { revalidate: 60 } }
    );
    if (!reponse.ok) return { data: null, error: { message: await erreurDe(reponse) } };
    const rows = await reponse.json();
    return { data: rows[0] ?? null, error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}
