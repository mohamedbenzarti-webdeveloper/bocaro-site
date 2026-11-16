"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";
import { lienWhatsApp } from "../lib/whatsapp";

// Page affichée quand une page échoue (ex. base Supabase injoignable ou en
// pause). Statut 500 : Google réessaie plus tard au lieu de retirer la page
// de son index, comme il le ferait pour un 404. Navbar et pied de page
// restent affichés (rendus par app/layout.js).
export default function Erreur({ error, retry }) {
  const { t } = useLanguage();
  const e = t.erreurs;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section-padding bg-surface">
      <div role="alert" className="container-app max-w-xl text-center">
        <h1 className="font-serif text-3xl text-bocaro-950">{e.erreurTitre}</h1>
        <p className="text-bocaro-600 mt-4 leading-relaxed">{e.erreurTexte}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <button type="button" onClick={() => retry()} className="btn-primary">
            {e.reessayer}
          </button>
          <a href={lienWhatsApp("")} target="_blank" rel="noopener noreferrer" className="btn-outline">
            WhatsApp
          </a>
          <Link href="/" className="btn-outline">{e.accueil}</Link>
        </div>
      </div>
    </section>
  );
}
