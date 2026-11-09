// Un utilisateur connecté n'est administrateur que s'il figure dans la
// table "admins" (sql/migration_v5.sql). La base l'impose déjà via les
// règles RLS ; ce contrôle évite en plus d'afficher le dashboard à un
// compte qui n'y a pas droit.
export async function estAdmin(supabase) {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
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
