import Link from "next/link";
import { createClient } from "../../lib/supabase/server";
import DeleteButton from "./DeleteButton";
import NettoyageStockage from "./NettoyageStockage";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: produits, error } = await supabase
    .from("produits")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-bold text-bocaro-950">
          Produits ({produits?.length ?? 0})
        </h1>
        <Link href="/dashboard/nouveau" className="btn-primary">
          + Ajouter un produit
        </Link>
      </div>

      <NettoyageStockage />

      {error && (
        <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3 mb-6">
          Erreur de chargement : {error.message}
        </p>
      )}

      <div className="bg-surface rounded-2xl border border-bocaro-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bocaro-50 text-bocaro-700 text-left">
            <tr>
              <th className="px-5 py-3 font-semibold">Photo</th>
              <th className="px-5 py-3 font-semibold">Nom</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Dimensions</th>
              <th className="px-5 py-3 font-semibold">Couleurs</th>
              <th className="px-5 py-3 font-semibold">Prix (DT)</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bocaro-100">
            {produits?.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.nom}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded-lg object-cover border border-bocaro-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-bocaro-50 border border-bocaro-100" />
                  )}
                </td>
                <td className="px-5 py-3 font-medium text-bocaro-950">
                  {p.nom}
                </td>
                <td className="px-5 py-3 text-bocaro-600">{p.type}</td>
                <td className="px-5 py-3 text-bocaro-600">
                  {p.dimensions?.join(", ")}
                </td>
                <td className="px-5 py-3 text-bocaro-600">
                  {p.couleurs?.join(", ")}
                </td>
                <td className="px-5 py-3 text-bocaro-600">{p.prix}</td>
                <td className="px-5 py-3 text-right space-x-4">
                  <Link
                    href={`/dashboard/${p.id}`}
                    className="text-sm font-medium text-bocaro-700 hover:text-bocaro-900"
                  >
                    Modifier
                  </Link>
                  <DeleteButton id={p.id} nom={p.nom} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {produits?.length === 0 && (
          <p className="text-center text-bocaro-500 py-10">
            Aucun produit pour l&apos;instant. Ajoute le premier !
          </p>
        )}
      </div>
    </div>
  );
}
