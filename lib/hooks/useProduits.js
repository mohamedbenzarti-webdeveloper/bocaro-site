"use client";

import { useCallback, useEffect, useState } from "react";
import { lireProduits } from "../supabase/public";

// Point d'entrée unique pour lire les produits côté client (requête REST
// légère, voir lib/supabase/public.js).
export function useProduits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  // Résultat de la requête → état (appelé après la réponse, jamais
  // directement dans l'effet).
  const appliquer = useCallback(({ data, error }) => {
    setErreur(error ? error.message : null);
    setProduits(error ? [] : data ?? []);
    setChargement(false);
  }, []);

  // Bouton « Réessayer » : remet l'indicateur de chargement.
  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    appliquer(await lireProduits());
  }, [appliquer]);

  // Premier chargement (chargement vaut déjà true). Réponse ignorée si le
  // composant a disparu entre-temps.
  useEffect(() => {
    let actif = true;
    lireProduits().then((r) => actif && appliquer(r));
    return () => {
      actif = false;
    };
  }, [appliquer]);

  return { produits, chargement, erreur, recharger: charger };
}
