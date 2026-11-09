"use client";

import { useCallback, useEffect, useState } from "react";
import { lireProduits } from "../supabase/public";

// Point d'entrée unique pour lire les produits côté client (requête REST
// légère, voir lib/supabase/public.js).
export function useProduits() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);

    const { data, error } = await lireProduits();

    if (error) {
      setErreur(error.message);
      setProduits([]);
    } else {
      setProduits(data ?? []);
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  return { produits, chargement, erreur, recharger: charger };
}
