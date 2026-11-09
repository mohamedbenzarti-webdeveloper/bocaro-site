// Récupère les derniers posts Instagram via l'API Graph (Meta), côté
// serveur uniquement : le token ne doit jamais atteindre le client.
// Nécessite un compte Instagram Business/Creator relié à une Page
// Facebook + une app Meta for Developers (voir README).
//
// Variables d'environnement requises (sans préfixe NEXT_PUBLIC_,
// donc invisibles côté navigateur) :
//   INSTAGRAM_ACCESS_TOKEN         token longue durée (Page ou User)
//   INSTAGRAM_BUSINESS_ACCOUNT_ID  id du compte Instagram professionnel

const GRAPH_VERSION = "v21.0";
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

/** Les 3 derniers posts → { posts, erreur? } (jamais d'exception). */
export async function lireDerniersPostsInstagram() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !accountId) return { posts: [], erreur: "instagram_non_configure" };

  // On demande plus que 3 posts : l'API filtre parfois des vidéos sans
  // miniature, et on trie nous-mêmes par date plutôt que de nous fier
  // à l'ordre renvoyé, pour garantir "exactement les 3 derniers".
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/media?fields=${FIELDS}&limit=9&access_token=${token}`;

  try {
    // Revalidation toutes les 15 min : les nouveaux posts apparaissent
    // rapidement sans pour autant appeler l'API à chaque visite.
    const reponse = await fetch(url, { next: { revalidate: 900 } });
    const donnees = await reponse.json();
    if (!reponse.ok) {
      console.error("Erreur API Instagram :", donnees?.error?.message);
      return { posts: [], erreur: "instagram_api_error" };
    }
    const posts = (donnees.data ?? [])
      .filter((p) => p.media_type !== "VIDEO" || p.thumbnail_url)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        caption: p.caption ?? "",
        image: p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url,
        permalink: p.permalink,
        timestamp: p.timestamp,
      }));
    return { posts };
  } catch (e) {
    console.error("Erreur de récupération des posts Instagram :", e.message);
    return { posts: [], erreur: "instagram_fetch_failed" };
  }
}
