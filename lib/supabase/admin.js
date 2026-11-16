// Accès administrateur : un compte doit figurer dans la table "admins"
// (sql/migration_v5.sql) ET avoir validé son code de double
// authentification pendant la session (niveau "aal2", sql/migration_v13.sql).
// La base l'impose déjà via les règles RLS ; ces contrôles évitent en plus
// d'afficher le dashboard à une session qui n'y a pas droit.

/**
 * Le compte connecté fait-il partie des administrateurs ? (sans tenir
 * compte du code). Avant la migration v13, la fonction est_admin()
 * n'existe pas : on se rabat sur is_admin(), qui donne la même réponse.
 */
export async function estMembreAdmin(supabase) {
  const { data, error } = await supabase.rpc("est_admin");
  if (!error) return data === true;
  const repli = await supabase.rpc("is_admin");
  return !repli.error && repli.data === true;
}

/**
 * Niveau de la session : "aal2" si le code a été validé, "aal1" sinon.
 * suivant vaut "aal2" quand le compte a déjà une application configurée
 * (il faut alors demander le code), "aal1" s'il n'en a pas encore.
 * Lu dans la session (cookie), sans appel réseau.
 */
export async function niveauSession(supabase) {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return { actuel: null, suivant: null };
  return { actuel: data.currentLevel, suivant: data.nextLevel };
}

/** Administrateur avec code validé : seul cas où le dashboard est permis. */
export async function estAdmin(supabase) {
  const [membre, niveau] = await Promise.all([estMembreAdmin(supabase), niveauSession(supabase)]);
  return membre && niveau.actuel === "aal2";
}

/** À appeler en tête de chaque action serveur du dashboard. */
export async function exigerAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await estAdmin(supabase))) {
    return { erreur: "Accès réservé à l'administration." };
  }
  return null;
}
