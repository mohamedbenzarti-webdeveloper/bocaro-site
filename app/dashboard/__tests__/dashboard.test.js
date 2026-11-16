// @vitest-environment jsdom
// Dashboard : formulaire produit (envoi des photos, création, modification),
// suppression d'un produit et nettoyage du stockage.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fauxSupabase, urlPhoto } from "../../../tests/fauxSupabase";

let base;
vi.mock("../../../lib/supabase/client", () => ({ createClient: () => base }));
vi.mock("../../actions/produits", () => ({
  creerProduit: vi.fn(async () => undefined),
  modifierProduit: vi.fn(async () => undefined),
  annulerEnvois: vi.fn(async () => null),
  supprimerProduit: vi.fn(async () => undefined),
  compterOrphelins: vi.fn(async () => ({ nombre: 0, octets: 0 })),
  purgerOrphelins: vi.fn(async () => ({ supprimes: 0, octets: 0 })),
}));

const actions = await import("../../actions/produits");
const ProductForm = (await import("../ProductForm")).default;
const DeleteButton = (await import("../DeleteButton")).default;
const NettoyageStockage = (await import("../NettoyageStockage")).default;
const ImageUploader = (await import("../../../components/admin/ImageUploader")).default;

beforeEach(() => {
  base = fauxSupabase();
});

const photo = (nom, octets = 2000) => new File([new Uint8Array(octets)], nom, { type: "image/png" });
const champs = (fd) => Object.fromEntries([...new Set(fd.keys())].map((k) => [k, fd.getAll(k)]));

async function remplirMinimum(u) {
  await u.type(screen.getByLabelText(/Nom du produit/, { selector: "#produit-nom" }), "Anémone");
  await u.type(screen.getByLabelText("Prix (DT / m²)"), "95");
}

describe("ProductForm — création", () => {
  it("envoie les photos (nom de fichier nettoyé) puis crée le produit", async () => {
    const u = userEvent.setup();
    const { container } = render(<ProductForm />);
    await remplirMinimum(u);
    await u.selectOptions(screen.getByLabelText("Type"), "Faïence");
    await u.click(screen.getByText("20 x 20 cm"));
    await u.click(container.querySelector('input[name="couleurs"][value="Turquoise"]'));
    await u.upload(container.querySelector('input[type="file"]'), [photo("Anémone (1).png")]);
    await u.click(screen.getByRole("button", { name: "Ajouter le produit" }));

    await waitFor(() => expect(actions.creerProduit).toHaveBeenCalledTimes(1));
    expect(base.appels.upload).toHaveLength(1);
    const { chemin, options } = base.appels.upload[0];
    expect(chemin).toMatch(/^\d+-[a-z0-9]+-anemone-1\.png$/);
    expect(options).toMatchObject({ contentType: "image/png", cacheControl: "31536000" });

    const envoye = champs(actions.creerProduit.mock.calls[0][0]);
    expect(envoye).toMatchObject({
      nom: ["Anémone"],
      type: ["Faïence"],
      prix: ["95"],
      dimensions: ["20 x 20 cm"],
      couleurs: ["Turquoise"],
      images: [urlPhoto(chemin)],
    });
    expect(actions.annulerEnvois).not.toHaveBeenCalled();
  });

  it("affiche l'erreur et annule les photos envoyées si l'enregistrement échoue", async () => {
    actions.creerProduit.mockResolvedValueOnce({ erreur: "Nom déjà utilisé" });
    const u = userEvent.setup();
    const { container } = render(<ProductForm />);
    await remplirMinimum(u);
    await u.upload(container.querySelector('input[type="file"]'), [photo("a.png")]);
    await u.click(screen.getByRole("button", { name: "Ajouter le produit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nom déjà utilisé");
    expect(actions.annulerEnvois).toHaveBeenCalledWith([urlPhoto(base.appels.upload[0].chemin)]);
    expect(screen.getByRole("button", { name: "Ajouter le produit" })).toBeEnabled();
  });

  it("s'arrête à la première photo refusée et annule celles déjà envoyées", async () => {
    const u = userEvent.setup();
    const { container } = render(<ProductForm />);
    await remplirMinimum(u);
    await u.upload(container.querySelector('input[type="file"]'), [photo("ok.png"), photo("refusee.png")]);
    // Le premier envoi passe, le second échoue.
    const upload = base.storage.from("produits").upload;
    let n = 0;
    base.storage.from = () => ({
      ...fauxSupabase().storage.from("produits"),
      upload: async (...args) => (++n === 1 ? upload(...args) : { error: { message: "Payload too large" } }),
      getPublicUrl: (c) => ({ data: { publicUrl: urlPhoto(c) } }),
    });
    await u.click(screen.getByRole("button", { name: "Ajouter le produit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent('Échec de l\'envoi de l\'image "refusee.png" : Payload too large');
    expect(actions.creerProduit).not.toHaveBeenCalled();
    await waitFor(() => expect(actions.annulerEnvois).toHaveBeenCalledTimes(1));
    expect(actions.annulerEnvois.mock.calls[0][0]).toHaveLength(1);
  });

  it("les onglets de langue affichent les champs anglais et arabe", async () => {
    const u = userEvent.setup();
    render(<ProductForm />);
    const nomArabe = screen.getByLabelText(/Nom du produit/, { selector: "#produit-nom_ar" });
    expect(nomArabe.closest("[hidden]")).not.toBeNull();
    await u.click(screen.getByRole("button", { name: "العربية" }));
    expect(nomArabe.closest("[hidden]")).toBeNull();
    expect(nomArabe).toHaveAttribute("dir", "rtl");
    expect(nomArabe).not.toBeRequired();
  });
});

describe("ProductForm — modification", () => {
  const produit = {
    id: "p9",
    nom: "Lagon",
    nom_en: "Lagoon",
    type: "Mosaïque",
    prix: 150,
    dimensions: ["10 x 10 cm", "30 x 30 cm"],
    couleurs: ["Blanc"],
    images: [urlPhoto("lagon.webp"), urlPhoto("lagon-2.webp")],
  };

  it("pré-remplit le formulaire avec le produit", () => {
    const { container } = render(<ProductForm produit={produit} />);
    expect(screen.getByLabelText(/Nom du produit/, { selector: "#produit-nom" })).toHaveValue("Lagon");
    expect(screen.getByLabelText(/Nom du produit/, { selector: "#produit-nom_en" })).toHaveValue("Lagoon");
    expect(screen.getByLabelText("Type")).toHaveValue("Mosaïque");
    expect(screen.getByLabelText("Prix (DT / m²)")).toHaveValue(150);
    expect(container.querySelector('input[value="10 x 10 cm"]')).toBeChecked();
    expect(container.querySelector('input[name="dimensions_personnalisees"]')).toHaveValue("30 x 30 cm");
    expect(container.querySelector('input[value="Blanc"]')).toBeChecked();
    expect(screen.getByText("Principale")).toBeInTheDocument();
  });

  it("enregistre sans renvoyer les photos existantes, et peut en retirer une", async () => {
    const u = userEvent.setup();
    render(<ProductForm produit={produit} />);
    await u.click(screen.getByRole("button", { name: "Retirer la photo 2" }));
    await u.click(screen.getByRole("button", { name: "Enregistrer les modifications" }));

    await waitFor(() => expect(actions.modifierProduit).toHaveBeenCalledTimes(1));
    const [id, fd] = actions.modifierProduit.mock.calls[0];
    expect(id).toBe("p9");
    expect(fd.getAll("images")).toEqual([urlPhoto("lagon.webp")]);
    expect(base.appels.upload).toHaveLength(0);
  });
});

describe("ImageUploader", () => {
  it("ajoute les photos choisies et retire une photo", async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(<ImageUploader value={[]} onChange={onChange} />);
    expect(container.querySelector('input[type="file"]')).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    await u.upload(container.querySelector('input[type="file"]'), [photo("a.png"), photo("b.png")]);
    const ajoutees = onChange.mock.calls[0][0];
    expect(ajoutees.map((i) => i.file.name)).toEqual(["a.png", "b.png"]);
    expect(ajoutees[0].preview).toMatch(/^blob:/);

    rerender(<ImageUploader value={ajoutees} onChange={onChange} />);
    await u.click(screen.getByRole("button", { name: "Retirer la photo 1" }));
    expect(onChange.mock.calls.at(-1)[0].map((i) => i.file.name)).toEqual(["b.png"]);
  });
});

describe("ImageUploader — ordre et accessibilité", () => {
  const trois = [{ url: "https://x/a.webp" }, { url: "https://x/b.webp" }, { url: "https://x/c.webp" }];
  const urls = (appel) => appel[0].map((i) => i.url.slice(-6));

  it("met une photo en principale et change l'ordre", async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(<ImageUploader value={trois} onChange={onChange} />);
    await u.click(screen.getByRole("button", { name: "Utiliser la photo 3 comme photo principale" }));
    expect(urls(onChange.mock.calls.at(-1))).toEqual(["c.webp", "a.webp", "b.webp"]);
    await u.click(screen.getByRole("button", { name: "Déplacer la photo 2 vers la droite" }));
    expect(urls(onChange.mock.calls.at(-1))).toEqual(["a.webp", "c.webp", "b.webp"]);
    await u.click(screen.getByRole("button", { name: "Déplacer la photo 2 vers la gauche" }));
    expect(urls(onChange.mock.calls.at(-1))).toEqual(["b.webp", "a.webp", "c.webp"]);
    expect(screen.getByRole("button", { name: "Déplacer la photo 3 vers la droite" })).toBeDisabled();
  });

  it("boutons toujours visibles et champ fichier atteignable au clavier", async () => {
    const u = userEvent.setup();
    const { container } = render(<ImageUploader value={trois} onChange={() => {}} />);
    expect(container.innerHTML).not.toMatch(/opacity-0/);
    const champ = screen.getByLabelText("Ajouter des photos");
    expect(champ).toHaveClass("sr-only");
    // Dernier élément de la liste : atteint par Tab après les boutons (→ de la dernière photo est désactivé).
    screen.getByRole("button", { name: "Utiliser la photo 3 comme photo principale" }).focus();
    await u.tab();
    expect(champ).toHaveFocus();
  });
});

describe("DeleteButton", () => {
  it("demande confirmation avant de supprimer", async () => {
    const u = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DeleteButton id="p1" nom="Étoile" />);
    await u.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('"Étoile"'));
    expect(actions.supprimerProduit).not.toHaveBeenCalled();
  });

  it("supprime après confirmation et affiche une erreur éventuelle", async () => {
    const u = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    actions.supprimerProduit.mockResolvedValueOnce({ erreur: "Photos restées dans le stockage" });
    render(<DeleteButton id="p1" nom="Étoile" />);
    await u.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Photos restées dans le stockage"));
    expect(actions.supprimerProduit).toHaveBeenCalledWith("p1");
  });
});

describe("NettoyageStockage", () => {
  it("reste invisible quand le stockage est propre", async () => {
    const { container } = render(<NettoyageStockage />);
    await waitFor(() => expect(actions.compterOrphelins).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("propose de supprimer les fichiers inutilisés et confirme le résultat", async () => {
    const u = userEvent.setup();
    actions.compterOrphelins.mockResolvedValueOnce({ nombre: 12, octets: 3_400_000 });
    actions.purgerOrphelins.mockResolvedValueOnce({ supprimes: 12, octets: 3_400_000 });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<NettoyageStockage />);
    expect(await screen.findByText(/12 fichiers du stockage ne sont utilisés par aucun produit \(3,4 Mo\)/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Nettoyer le stockage" }));
    expect(await screen.findByText("12 fichiers supprimés (3,4 Mo libérés).")).toBeInTheDocument();
  });

  it("ne supprime rien si l'administrateur annule", async () => {
    const u = userEvent.setup();
    actions.compterOrphelins.mockResolvedValueOnce({ nombre: 3, octets: 1000 });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<NettoyageStockage />);
    await u.click(await screen.findByRole("button", { name: "Nettoyer le stockage" }));
    expect(actions.purgerOrphelins).not.toHaveBeenCalled();
  });
});
