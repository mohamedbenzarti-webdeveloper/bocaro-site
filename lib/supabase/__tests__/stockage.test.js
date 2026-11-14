import { describe, it, expect, vi } from "vitest";
import { BUCKET, cheminDepuisUrl, supprimerFichiers, nomFichierSur } from "../stockage";

const URL = "https://projet-test.supabase.co/storage/v1/object/public/produits/";

describe("cheminDepuisUrl", () => {
  it("retrouve le chemin du fichier dans le bucket", () => {
    expect(cheminDepuisUrl(URL + "123-abc-anemone.webp")).toBe("123-abc-anemone.webp");
    expect(cheminDepuisUrl(URL + "dossier/photo.webp")).toBe("dossier/photo.webp");
  });

  it("décode les caractères encodés et ignore les paramètres", () => {
    expect(cheminDepuisUrl(URL + "carreau%20bleu.webp?width=400")).toBe("carreau bleu.webp");
  });

  it("refuse ce qui ne vient pas du bucket du site", () => {
    expect(cheminDepuisUrl("https://exemple.com/photo.jpg")).toBeNull();
    expect(cheminDepuisUrl("https://projet-test.supabase.co/storage/v1/object/public/autre/x.webp")).toBeNull();
    expect(cheminDepuisUrl(URL)).toBeNull();
    expect(cheminDepuisUrl(undefined)).toBeNull();
    expect(cheminDepuisUrl(42)).toBeNull();
  });

  it("ne plante pas sur un encodage invalide", () => {
    expect(cheminDepuisUrl(URL + "%E0%A4%A.webp")).toBeNull();
  });
});

describe("supprimerFichiers", () => {
  const client = (erreur = null) => {
    const remove = vi.fn(async () => ({ error: erreur ? { message: erreur } : null }));
    return { remove, supabase: { storage: { from: vi.fn(() => ({ remove })) } } };
  };

  it("supprime une seule fois chaque fichier du bucket", async () => {
    const { remove, supabase } = client();
    const r = await supprimerFichiers(supabase, [URL + "a.webp", URL + "a.webp", "https://ailleurs.com/b.jpg", URL + "c.webp"]);
    expect(r).toBeNull();
    expect(supabase.storage.from).toHaveBeenCalledWith(BUCKET);
    expect(remove).toHaveBeenCalledWith(["a.webp", "c.webp"]);
  });

  it("n'appelle pas le stockage quand il n'y a rien à supprimer", async () => {
    const { remove, supabase } = client();
    expect(await supprimerFichiers(supabase, [])).toBeNull();
    expect(await supprimerFichiers(supabase, undefined)).toBeNull();
    expect(await supprimerFichiers(supabase, ["https://ailleurs.com/x.jpg"])).toBeNull();
    expect(remove).not.toHaveBeenCalled();
  });

  it("renvoie le message d'erreur sans lever d'exception", async () => {
    const { supabase } = client("accès refusé");
    expect(await supprimerFichiers(supabase, [URL + "a.webp"])).toBe("accès refusé");
  });
});

describe("nomFichierSur", () => {
  it("retire les accents et met en minuscules", () => {
    expect(nomFichierSur("Anémone.png")).toBe("anemone.png");
    expect(nomFichierSur("Carreau étoile (2).JPG")).toBe("carreau-etoile-2.jpg");
  });

  it("remplace les ligatures et caractères spéciaux", () => {
    expect(nomFichierSur("Cœur & Æther!.webp")).toBe("coeur-aether.webp");
    expect(nomFichierSur("  photo   finale .jpeg")).toBe("photo-finale.jpeg");
  });

  it("donne un nom par défaut si aucune lettre latine ne reste", () => {
    expect(nomFichierSur("بلاط.webp")).toBe("image.webp");
    expect(nomFichierSur("???")).toBe("image");
  });

  it("garde les noms déjà corrects et ceux sans extension", () => {
    expect(nomFichierSur("carreau_bleu-01.webp")).toBe("carreau_bleu-01.webp");
    expect(nomFichierSur(".cache")).toBe("cache");
    expect(nomFichierSur("sans-extension")).toBe("sans-extension");
  });

  it("produit toujours une clé acceptée par Supabase Storage", () => {
    for (const nom of ["Ça marche.PNG", "été 2026 (copie).webp", "日本.jpg", "a b/c\\d.png"]) {
      expect(nomFichierSur(nom)).toMatch(/^[a-z0-9_-]+(\.[a-z0-9_-]+)?$/);
    }
  });
});
