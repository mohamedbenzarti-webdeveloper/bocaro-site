import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "../lib/site";
import { MISE_A_JOUR } from "../lib/legal";

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
    { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly", lastModified: new Date(MISE_A_JOUR) },
    { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly", lastModified: new Date(MISE_A_JOUR) },
    // Pas de date pour les autres pages fixes : en mettre une nouvelle à
    // chaque régénération ferait croire à Google qu'elles changent sans
    // cesse (il finit alors par ignorer toutes les dates du sitemap).
  ].map(({ path, ...reste }) => ({ url: `${SITE_URL}${path}`, ...reste }));

  // Lecture publique (clé anon, sans cookies) : la liste des produits est
  // de toute façon visible par tous.
  let produits = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    // select("*") : fonctionne avant comme après migration_v12.sql (colonne
    // updated_at, date de dernière modification).
    const { data } = await supabase.from("produits").select("*");
    produits = (data ?? []).map((p) => ({
      url: `${SITE_URL}/produits/${p.id}`,
      lastModified: new Date(p.updated_at ?? p.created_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // Sans base joignable, le sitemap garde au moins les pages fixes.
  }

  return [...pages, ...produits];
}
