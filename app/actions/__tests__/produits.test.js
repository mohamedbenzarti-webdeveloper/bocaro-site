// Actions serveur du dashboard : création, modification, suppression de
// produits et nettoyage du stockage des photos.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fauxSupabase, urlPhoto } from "../../../tests/fauxSupabase";

let base;
vi.mock("../../../lib/supabase/server", () => ({ createClient: async () => base }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { revalidatePath } = await import("next/cache");
const actions = await import("../produits");

function formulaire(champs) {
  const fd = new FormData();
  for (const [cle, valeur] of Object.entries(champs)) {
    for (const v of [].concat(valeur)) fd.append(cle, v);
  }
  return fd;
}

const champsValides = {
  nom: "  Étoile bleue ",
  nom_en: "Blue star",
  nom_ar: "",
  type: "Carreau ciment",
  description: "Motif étoilé",
  dimensions: ["10 x 10 cm", "20 x 20 cm"],
  dimensions_personnalisees: " 30 x 30 cm , ,Sur mesure ",
  couleurs: ["Bleu Méditerranée", "Blanc"],
  prix: "120.5",
  images: [urlPhoto("a.webp"), "https://exemple.com/externe.jpg", urlPhoto("b.webp")],
};

/** Exécute une action qui se termine par redirect() et renvoie la cible. */
async function redirectionDe(promesse) {
  try {
    await promesse;
  } catch (e) {
    if (String(e.digest).startsWith("NEXT_REDIRECT")) return e.digest.split(";")[2];
    throw e;
  }
  return null;
}

beforeEach(() => {
  base = fauxSupabase();
});

describe("droits d'accès", () => {
  const appelsProteges = {
    creerProduit: () => actions.creerProduit(formulaire(champsValides)),
    modifierProduit: () => actions.modifierProduit("p1", formulaire(champsValides)),
    supprimerProduit: () => actions.supprimerProduit("p1"),
    annulerEnvois: () => actions.annulerEnvois([urlPhoto("a.webp")]),
    compterOrphelins: () => actions.compterOrphelins(),
    purgerOrphelins: () => actions.purgerOrphelins(),
  };

  for (const [nom, appel] of Object.entries(appelsProteges)) {
    it(`${nom} refuse un visiteur non connecté`, async () => {
      base = fauxSupabase({ user: null, produits: [{ id: "p1", images: [] }] });
      expect(await appel()).toEqual({ erreur: "Accès réservé à l'administration." });
      expect(base.appels.insert).toHaveLength(0);
      expect(base.appels.update).toHaveLength(0);
      expect(base.appels.delete).toHaveLength(0);
      expect(base.appels.remove).toHaveLength(0);
    });

    it(`${nom} refuse un compte connecté qui n'est pas administrateur`, async () => {
      base = fauxSupabase({ admin: false, produits: [{ id: "p1", images: [] }] });
      expect(await appel()).toEqual({ erreur: "Accès réservé à l'administration." });
      expect(base.appels.remove).toHaveLength(0);
    });
  }
});

describe("creerProduit", () => {
  it("enregistre un formulaire nettoyé puis redirige vers le dashboard", async () => {
    const cible = await redirectionDe(actions.creerProduit(formulaire(champsValides)));
    expect(cible).toBe("/dashboard");
    expect(base.appels.insert).toEqual([
      {
        nom: "Étoile bleue",
        nom_en: "Blue star",
        nom_ar: null,
        type: "Carreau ciment",
        description: "Motif étoilé",
        description_en: null,
        description_ar: null,
        dimensions: ["10 x 10 cm", "20 x 20 cm", "30 x 30 cm", "Sur mesure"],
        couleurs: ["Bleu Méditerranée", "Blanc"],
        prix: 120.5,
        // Seules les photos du stockage du site sont acceptées.
        images: [urlPhoto("a.webp"), urlPhoto("b.webp")],
      },
    ]);
  });

  it("vide le cache des pages du catalogue", async () => {
    await redirectionDe(actions.creerProduit(formulaire(champsValides)));
    expect(revalidatePath).toHaveBeenCalledWith("/produits");
    expect(revalidatePath).toHaveBeenCalledWith("/produits/[id]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("renvoie l'erreur de la base sans rediriger", async () => {
    base = fauxSupabase({ erreurs: { insert: "violation de contrainte" } });
    expect(await actions.creerProduit(formulaire(champsValides))).toEqual({ erreur: "violation de contrainte" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("modifierProduit", () => {
  it("met à jour le produit et supprime du stockage les photos retirées", async () => {
    base = fauxSupabase({
      produits: [{ id: "p1", nom: "Ancien", images: [urlPhoto("a.webp"), urlPhoto("ancienne.webp")] }],
    });
    const cible = await redirectionDe(actions.modifierProduit("p1", formulaire({ ...champsValides, images: [urlPhoto("a.webp")] })));
    expect(cible).toBe("/dashboard");
    expect(base.etat.produits[0].nom).toBe("Étoile bleue");
    expect(base.etat.produits[0].images).toEqual([urlPhoto("a.webp")]);
    expect(base.appels.remove).toEqual([["ancienne.webp"]]);
    expect(revalidatePath).toHaveBeenCalledWith("/produits/p1");
  });

  it("ne supprime aucune photo si toutes sont conservées", async () => {
    base = fauxSupabase({ produits: [{ id: "p1", images: [urlPhoto("a.webp")] }] });
    await redirectionDe(actions.modifierProduit("p1", formulaire({ ...champsValides, images: [urlPhoto("a.webp")] })));
    expect(base.appels.remove).toHaveLength(0);
  });

  it("garde les photos si l'enregistrement échoue", async () => {
    base = fauxSupabase({
      produits: [{ id: "p1", images: [urlPhoto("a.webp"), urlPhoto("b.webp")] }],
      erreurs: { update: "refusé" },
    });
    expect(await actions.modifierProduit("p1", formulaire({ ...champsValides, images: [] }))).toEqual({ erreur: "refusé" });
    expect(base.appels.remove).toHaveLength(0);
  });
});

describe("supprimerProduit", () => {
  it("supprime le produit et toutes ses photos", async () => {
    base = fauxSupabase({
      produits: [
        { id: "p1", images: [urlPhoto("a.webp"), urlPhoto("b%20c.webp")] },
        { id: "p2", images: [urlPhoto("d.webp")] },
      ],
    });
    expect(await actions.supprimerProduit("p1")).toBeUndefined();
    expect(base.etat.produits.map((p) => p.id)).toEqual(["p2"]);
    expect(base.appels.remove).toEqual([["a.webp", "b c.webp"]]);
  });

  it("prévient l'administrateur si les photos n'ont pas pu être supprimées", async () => {
    base = fauxSupabase({ produits: [{ id: "p1", images: [urlPhoto("a.webp")] }], erreurs: { remove: "quota" } });
    const r = await actions.supprimerProduit("p1");
    expect(r.erreur).toContain("Produit supprimé");
    expect(r.erreur).toContain("quota");
  });

  it("ne touche pas aux photos si la suppression du produit échoue", async () => {
    base = fauxSupabase({ produits: [{ id: "p1", images: [urlPhoto("a.webp")] }], erreurs: { delete: "verrou" } });
    expect(await actions.supprimerProduit("p1")).toEqual({ erreur: "verrou" });
    expect(base.appels.remove).toHaveLength(0);
  });
});

describe("annulerEnvois", () => {
  it("supprime les photos envoyées pour un enregistrement raté, jamais celles déjà utilisées", async () => {
    base = fauxSupabase({ produits: [{ id: "p1", images: [urlPhoto("utilisee.webp")] }] });
    expect(await actions.annulerEnvois([urlPhoto("utilisee.webp"), urlPhoto("orpheline.webp")])).toBeNull();
    expect(base.appels.remove).toEqual([["orpheline.webp"]]);
  });

  it("ne supprime rien si la liste des produits est illisible", async () => {
    base = fauxSupabase({ erreurs: { select: "panne" } });
    expect(await actions.annulerEnvois([urlPhoto("x.webp")])).toEqual({ erreur: "Impossible de vérifier les photos utilisées." });
    expect(base.appels.remove).toHaveLength(0);
  });
});

describe("nettoyage du stockage", () => {
  const ilYa = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
  const fichier = (name, minutes, size = 1000) => ({ id: name, name, created_at: ilYa(minutes), metadata: { size } });

  it("compte les fichiers inutilisés de plus d'une heure, sans les dossiers", async () => {
    base = fauxSupabase({
      produits: [{ id: "p1", images: [urlPhoto("utilisee.webp")] }],
      fichiers: [
        fichier("utilisee.webp", 600),
        fichier("orpheline.webp", 120, 2_500_000),
        fichier("envoi-en-cours.webp", 10),
        { id: null, name: "dossier", created_at: ilYa(999) },
      ],
    });
    expect(await actions.compterOrphelins()).toEqual({ nombre: 1, octets: 2_500_000 });
  });

  it("supprime les orphelins par lots de 100 et parcourt tout le bucket", async () => {
    const fichiers = Array.from({ length: 1150 }, (_, i) => fichier(`f${i}.webp`, 120, 10));
    base = fauxSupabase({ fichiers });
    const r = await actions.purgerOrphelins();
    expect(r).toEqual({ supprimes: 1150, octets: 11_500 });
    // Deux pages de lecture (1000 + 150) puis 12 lots de suppression.
    expect(base.appels.list.map((a) => a.options.offset)).toEqual([0, 1000]);
    expect(base.appels.remove).toHaveLength(12);
    expect(base.appels.remove.every((lot) => lot.length <= 100)).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("s'arrête et signale une erreur de suppression", async () => {
    base = fauxSupabase({ fichiers: [fichier("x.webp", 120)], erreurs: { remove: "interdit" } });
    expect(await actions.purgerOrphelins()).toEqual({ erreur: "interdit" });
  });

  it("signale une erreur de lecture du bucket", async () => {
    base = fauxSupabase({ erreurs: { list: "bucket introuvable" } });
    expect(await actions.compterOrphelins()).toEqual({ erreur: "bucket introuvable" });
  });
});

describe("deconnexion", () => {
  it("ferme la session et renvoie vers la page de connexion", async () => {
    const cible = await redirectionDe(actions.deconnexion());
    expect(base.auth.signOut).toHaveBeenCalled();
    expect(cible).toBe("/login");
  });
});
