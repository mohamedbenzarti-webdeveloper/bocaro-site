// Accès public minimal à Supabase (lecture des produits)
// par simples requêtes HTTP vers l'API REST, sans charger la bibliothèque
// @supabase/supabase-js (~67 Ko compressés) sur les pages publiques. Les
// droits restent ceux du rôle "anon" définis par les règles RLS de la base.
// La bibliothèque complète n'est utilisée que pour la connexion et le
// dashboard.

const URL_API = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const CLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cache des lectures de produits côté serveur. Les pages du site sont
// toutes rendues à chaque visite (la CSP avec nonce et la langue lue dans
// un cookie l'imposent : voir README, « Cache ») ; ce qui est mis en
// cache, ce sont ces requêtes vers Supabase : 60 s au plus, et vidé tout de
// suite par les actions du dashboard (updateTag(TAG_PRODUITS)).
export const TAG_PRODUITS = "produits";
const CACHE = { revalidate: 60, tags: [TAG_PRODUITS] };

const entetes = {
  apikey: CLE,
  Authorization: `Bearer ${CLE}`,
};

async function lireCorps(reponse) {
  try {
    return await reponse.json();
  } catch {
    return null;
  }
}

async function erreurDe(reponse) {
  const corps = await lireCorps(reponse);
  return corps?.message || `Erreur ${reponse.status}`;
}

// Code Postgres renvoyé pour un identifiant qui n'est pas un UUID
// (ex. /produits/abc) : le produit n'existe pas, ce n'est pas une panne.
const UUID_INVALIDE = "22P02";

/** Liste des produits, du plus récent au plus ancien. → { data, error } */
export async function lireProduits({ limite } = {}) {
  const params = new URLSearchParams({ select: "*", order: "created_at.desc" });
  if (limite) params.set("limit", String(limite));
  try {
    // Option next ignorée dans le navigateur (simulateur).
    const reponse = await fetch(`${URL_API}/produits?${params}`, {
      headers: entetes,
      next: CACHE,
    });
    if (!reponse.ok) return { data: null, error: { message: await erreurDe(reponse) } };
    return { data: await reponse.json(), error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

/**
 * Un seul produit par identifiant. → { data, error }
 * data null sans error : le produit n'existe pas (404). error : la base n'a
 * pas répondu correctement (panne, projet en pause) — à ne pas confondre
 * avec un produit absent.
 */
export async function lireProduit(id) {
  try {
    const reponse = await fetch(
      `${URL_API}/produits?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: entetes, next: CACHE }
    );
    if (!reponse.ok) {
      const corps = await lireCorps(reponse);
      if (reponse.status === 400 && corps?.code === UUID_INVALIDE) return { data: null, error: null };
      return { data: null, error: { message: corps?.message || `Erreur ${reponse.status}` } };
    }
    const rows = await reponse.json();
    return { data: rows[0] ?? null, error: null };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}
