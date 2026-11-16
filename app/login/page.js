import { createClient } from "../../lib/supabase/server";
import { estMembreAdmin, niveauSession } from "../../lib/supabase/admin";
import FormulaireConnexion from "./FormulaireConnexion";

// Étape affichée dès le premier rendu, selon la session :
// - pas connecté : e-mail et mot de passe ;
// - administrateur connecté par mot de passe seulement (renvoyé ici par le
//   proxy) : code à 6 chiffres, ou configuration de l'application si le
//   compte n'en a pas encore.
// (Un administrateur avec code validé est envoyé au dashboard par proxy.js.)
async function etapeInitiale() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await estMembreAdmin(supabase))) return "identifiants";
  const { actuel, suivant } = await niveauSession(supabase);
  if (actuel === "aal2") return "identifiants";
  return suivant === "aal2" ? "code" : "configuration";
}

export default async function LoginPage({ searchParams }) {
  const { erreur } = (await searchParams) ?? {};
  return (
    <FormulaireConnexion
      etapeInitiale={await etapeInitiale()}
      erreurInitiale={erreur === "acces" ? "Ce compte n'a pas accès à l'espace direction." : ""}
    />
  );
}
