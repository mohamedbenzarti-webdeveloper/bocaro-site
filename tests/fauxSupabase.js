// Fausse base Supabase en mémoire pour tester les actions serveur sans
// réseau. Elle imite la petite partie de l'API utilisée par le projet :
//   from("produits").select().eq().order().range().single() / insert() / update().eq() / delete().eq()
//   storage.from(bucket).list() / remove() / upload() / getPublicUrl()
//   auth.getUser() / auth.signOut() / rpc("est_admin" | "is_admin")
//   auth.mfa.getAuthenticatorAssuranceLevel() / listFactors() / enroll()
//   / unenroll() / challengeAndVerify()  (double authentification)
// Chaque appel est noté dans `appels` pour les vérifications.
import { vi } from "vitest";

export const URL_STOCKAGE = "https://projet-test.supabase.co/storage/v1/object/public/produits/";
export const urlPhoto = (nom) => URL_STOCKAGE + nom;

export function fauxSupabase({
  user = { id: "u1", email: "directeur@bocaro.tn" },
  admin = true,
  produits = [],
  fichiers = [],
  erreurs = {},
  // Double authentification : niveau de la session ("aal2" = code validé)
  // et applications configurées ({ id, status }).
  aal = "aal2",
  facteurs = [{ id: "f1", factor_type: "totp", status: "verified" }],
  codeValide = "123456",
} = {}) {
  const etat = {
    produits: produits.map((p) => ({ ...p })),
    fichiers: fichiers.map((f) => ({ ...f })),
  };
  const appels = { insert: [], update: [], delete: [], remove: [], list: [], upload: [], range: [], mfa: [] };
  const mfa = { aal, facteurs: facteurs.map((f) => ({ ...f })) };

  function requete(table) {
    const filtres = [];
    let operation = { type: "select" };
    const executer = () => {
      const lignes = etat[table].filter((l) => filtres.every(([col, val]) => String(l[col]) === String(val)));
      switch (operation.type) {
        case "insert":
          if (erreurs.insert) return { error: { message: erreurs.insert } };
          etat[table].push({ id: `nouveau-${etat[table].length + 1}`, ...operation.valeur });
          return { error: null };
        case "update":
          if (erreurs.update) return { error: { message: erreurs.update } };
          lignes.forEach((l) => Object.assign(l, operation.valeur));
          return { error: null };
        case "delete":
          if (erreurs.delete) return { error: { message: erreurs.delete } };
          etat[table] = etat[table].filter((l) => !lignes.includes(l));
          return { error: null };
        default:
          if (erreurs.select) return { data: null, error: { message: erreurs.select } };
          // Comme l'API réelle, la lecture renvoie des copies.
          if (operation.single)
            return { data: lignes[0] ? structuredClone(lignes[0]) : null, error: lignes[0] ? null : { message: "introuvable" } };
          if (operation.range) {
            appels.range.push(operation.range);
            const [de, a] = operation.range;
            return { data: structuredClone(lignes.slice(de, a + 1)), error: null };
          }
          return { data: structuredClone(lignes), error: null };
      }
    };
    const constructeur = {
      select: () => constructeur,
      eq: (col, val) => (filtres.push([col, val]), constructeur),
      single: () => ((operation = { ...operation, single: true }), constructeur),
      order: () => constructeur,
      range: (de, a) => ((operation = { ...operation, range: [de, a] }), constructeur),
      insert: (valeur) => {
        appels.insert.push(valeur);
        operation = { type: "insert", valeur };
        return constructeur;
      },
      update: (valeur) => {
        appels.update.push(valeur);
        operation = { type: "update", valeur };
        return constructeur;
      },
      delete: () => {
        operation = { type: "delete" };
        appels.delete.push(filtres);
        return constructeur;
      },
      then: (ok, ko) => Promise.resolve(executer()).then(ok, ko),
    };
    return constructeur;
  }

  const stockage = (bucket) => ({
    list: async (dossier, options) => {
      appels.list.push({ bucket, dossier, options });
      if (erreurs.list) return { data: null, error: { message: erreurs.list } };
      const { limit = 100, offset = 0 } = options ?? {};
      return { data: etat.fichiers.slice(offset, offset + limit), error: null };
    },
    remove: async (chemins) => {
      appels.remove.push(chemins);
      if (erreurs.remove) return { data: null, error: { message: erreurs.remove } };
      etat.fichiers = etat.fichiers.filter((f) => !chemins.includes(f.name));
      return { data: chemins, error: null };
    },
    upload: async (chemin, fichier, options) => {
      appels.upload.push({ chemin, fichier, options });
      if (erreurs.upload) return { error: { message: erreurs.upload } };
      return { data: { path: chemin }, error: null };
    },
    getPublicUrl: (chemin) => ({ data: { publicUrl: URL_STOCKAGE + chemin } }),
  });

  return {
    etat,
    appels,
    from: requete,
    storage: { from: stockage },
    auth: {
      getUser: vi.fn(async () => ({ data: { user } })),
      signOut: vi.fn(async () => ({ error: null })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(async () => ({
          data: {
            currentLevel: user ? mfa.aal : null,
            nextLevel: mfa.facteurs.some((f) => f.status === "verified") ? "aal2" : mfa.aal,
          },
          error: null,
        })),
        listFactors: vi.fn(async () => ({
          data: { all: mfa.facteurs, totp: mfa.facteurs.filter((f) => f.status === "verified") },
          error: null,
        })),
        enroll: vi.fn(async (params) => {
          appels.mfa.push(["enroll", params]);
          const f = { id: `f${mfa.facteurs.length + 1}`, factor_type: "totp", status: "unverified" };
          mfa.facteurs.push(f);
          return { data: { id: f.id, totp: { qr_code: "data:image/svg+xml;utf-8,<svg/>", secret: "SECRETBASE32" } }, error: null };
        }),
        unenroll: vi.fn(async ({ factorId }) => {
          appels.mfa.push(["unenroll", factorId]);
          mfa.facteurs = mfa.facteurs.filter((f) => f.id !== factorId);
          return { data: { id: factorId }, error: null };
        }),
        challengeAndVerify: vi.fn(async ({ factorId, code }) => {
          appels.mfa.push(["verify", factorId, code]);
          if (code !== codeValide) return { data: null, error: { message: "Invalid TOTP code entered" } };
          mfa.facteurs.find((f) => f.id === factorId).status = "verified";
          mfa.aal = "aal2";
          return { data: {}, error: null };
        }),
      },
    },
    mfa,
    // Comme la base après la migration v13 : est_admin = membre ;
    // is_admin = membre ET code validé.
    rpc: vi.fn(async (nom) => {
      if (nom === "est_admin") return { data: admin, error: null };
      if (nom === "is_admin") return { data: admin && mfa.aal === "aal2", error: null };
      return { data: null, error: { message: "rpc inconnue" } };
    }),
  };
}
