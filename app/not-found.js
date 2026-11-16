import Link from "next/link";
import { getLocaleServeur } from "../lib/locale-server";
import { getDict } from "../lib/translations";

// Page 404 du site (adresse inconnue, produit absent ou supprimé), dans la
// langue du visiteur. Next.js la sert avec le statut 404 et noindex.
export const metadata = { title: "Page introuvable" };

export default async function NotFound() {
  const e = getDict(await getLocaleServeur()).erreurs;
  return (
    <section className="section-padding bg-surface">
      <div className="container-app max-w-xl text-center">
        <p className="font-serif text-6xl text-brand-600">404</p>
        <h1 className="font-serif text-3xl text-bocaro-950 mt-4">{e.introuvableTitre}</h1>
        <p className="text-bocaro-600 mt-4 leading-relaxed">{e.introuvableTexte}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link href="/produits" className="btn-primary">{e.catalogue}</Link>
          <Link href="/" className="btn-outline">{e.accueil}</Link>
        </div>
      </div>
    </section>
  );
}
