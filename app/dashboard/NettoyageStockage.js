"use client";

import { useEffect, useState, useTransition } from "react";
import { compterOrphelins, purgerOrphelins } from "../actions/produits";

const mo = (octets) => `${(octets / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;

// Encadré du dashboard : fichiers du stockage qu'aucun produit n'utilise
// (anciens envois, photos d'avant le nettoyage automatique), et bouton pour
// les supprimer. N'apparaît que s'il y en a.
export default function NettoyageStockage() {
  const [etat, setEtat] = useState(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    compterOrphelins().then(setEtat).catch(() => {});
  }, []);

  if (!etat || etat.erreur || etat.nombre === 0) {
    return message ? <p className="text-sm text-green-700 mb-6">{message}</p> : null;
  }

  const purger = () => {
    if (!confirm(`Supprimer définitivement ${etat.nombre} fichiers inutilisés (${mo(etat.octets)}) ?`)) return;
    startTransition(async () => {
      const r = await purgerOrphelins();
      if (r?.erreur) {
        setMessage("");
        alert(`Nettoyage interrompu : ${r.erreur}`);
        return;
      }
      setMessage(`${r.supprimes} fichiers supprimés (${mo(r.octets)} libérés).`);
      setEtat({ nombre: 0, octets: 0 });
    });
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm">
      <p className="text-bocaro-800">
        {etat.nombre} fichiers du stockage ne sont utilisés par aucun produit ({mo(etat.octets)}).
      </p>
      <button
        type="button"
        onClick={purger}
        disabled={pending}
        className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {pending ? "Nettoyage..." : "Nettoyer le stockage"}
      </button>
    </div>
  );
}
