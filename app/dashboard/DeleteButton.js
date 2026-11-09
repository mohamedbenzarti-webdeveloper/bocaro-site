"use client";

import { useTransition } from "react";
import { supprimerProduit } from "../actions/produits";

export default function DeleteButton({ id, nom }) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm(`Supprimer "${nom}" et ses photos ? Cette action est irréversible.`)) {
      return;
    }
    startTransition(async () => {
      const resultat = await supprimerProduit(id);
      if (resultat?.erreur) alert(resultat.erreur);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {pending ? "..." : "Supprimer"}
    </button>
  );
}
