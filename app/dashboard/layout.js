import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { estAdmin } from "../../lib/supabase/admin";
import { deconnexion } from "../actions/produits";

export const metadata = {
  title: "Espace direction",
  robots: { index: false, follow: false },
  alternates: { canonical: "/dashboard" },
};

export default async function DashboardLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double vérification côté serveur (en plus du middleware)
  if (!user || !(await estAdmin(supabase))) {
    redirect("/login?erreur=acces");
  }

  return (
    <div className="min-h-[70vh] bg-bocaro-50">
      <header className="bg-bocaro-950 text-white">
        <div className="container-app py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-serif text-lg font-bold">Espace direction</p>
            <p className="text-xs text-bocaro-200">{user.email}</p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-full text-bocaro-100 hover:text-white hover:bg-white/10"
            >
              Produits
            </Link>
          </nav>
          <form action={deconnexion}>
            <button
              type="submit"
              className="text-sm font-medium text-bocaro-100 hover:text-white border border-bocaro-700 rounded-full px-4 py-1.5"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>

      <main className="container-app py-10">{children}</main>
    </div>
  );
}
