import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "../lib/site";

// Régénéré toutes les heures : un produit ajouté depuis le dashboard y
// apparaît sans redéploiement.
export const revalidate = 3600;

export default async function sitemap() {
  const pages = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/produits", priority: 0.9, changeFrequency: "daily" },
    { path: "/simulateur", priority: 0.8, changeFrequency: "monthly" },
    { path: "/a-propos", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  ].map(({ path, ...reste }) => ({ url: `${SITE_URL}${path}`, lastModified: new Date(), ...reste }));

  // Lecture publique (clé anon, sans cookies) : la liste des produits est
  // de toute façon visible par tous.
  let produits = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase.from("produits").select("id, created_at");
    produits = (data ?? []).map((p) => ({
      url: `${SITE_URL}/produits/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // Sans base joignable, le sitemap garde au moins les pages fixes.
  }

  return [...pages, ...produits];
}
