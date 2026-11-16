// @vitest-environment jsdom
// Parcours complet du simulateur : pièce → carreau → simulation → résultat,
// présélection depuis une fiche produit, réglages, WhatsApp, recommencer.
// Le rendu WebGL/Canvas (testé à part dans lib/simulateur) est remplacé par
// un aperçu factice qui note ce qu'il doit dessiner.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { rendreAvecLangue, produitsExemple } from "../../../tests/utils";

const rendus = [];
vi.mock("../../../components/simulateur/CanvasCompare", () => ({
  default: (props) => {
    rendus.push(props);
    return <div data-testid="apercu" data-surface={props.surfaces[0]?.type} data-carreau={props.tileSrc} />;
  },
}));
vi.mock("../../../components/simulateur/exportCanvas", () => ({
  construireCanvasResultat: vi.fn(async () => ({
    toDataURL: () => "data:image/png;base64,AAAA",
    toBlob: (rappel) => rappel(new Blob(["png"], { type: "image/png" })),
  })),
}));

let catalogue;
vi.mock("../../../lib/hooks/useProduits", () => ({ useProduits: () => catalogue }));

const SimulateurPage = (await import("../page")).default;

const etapeCourante = () => screen.getByRole("button", { current: "step" }).textContent;
const continuer = () => screen.getByRole("button", { name: "Continuer" });
const carteCarreau = (nom) => screen.getByRole("heading", { level: 3, name: nom }).parentElement;

beforeEach(() => {
  rendus.length = 0;
  catalogue = { produits: produitsExemple(), chargement: false, erreur: null, recharger: vi.fn() };
  window.history.replaceState({}, "", "/simulateur");
});
afterEach(() => window.history.replaceState({}, "", "/"));

describe("étape 1 — Espace", () => {
  it("demande de choisir une pièce avant de continuer", () => {
    rendreAvecLangue(<SimulateurPage />);
    expect(etapeCourante()).toContain("Espace");
    expect(screen.getByText("Sélectionnez une pièce pour continuer.")).toBeInTheDocument();
    expect(continuer()).toBeDisabled();
    expect(screen.getByRole("button", { name: /Carrelage/ })).toBeDisabled();
  });

  it("propose les cinq pièces et le choix sol / mur", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    const pieces = within(screen.getByRole("radiogroup", { name: "Choisissez une pièce" })).getAllByRole("radio");
    expect(pieces.map((p) => p.textContent.trim())).toEqual(["Salon", "Cuisine", "Salle de bain", "Chambre", "Terrasse"]);
    await u.click(pieces[1]);
    expect(pieces[1]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Sol" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "Mur" }));
    expect(screen.getByRole("button", { name: "Mur" })).toHaveAttribute("aria-pressed", "true");
    expect(continuer()).toBeEnabled();
  });
});

describe("parcours complet (sans présélection)", () => {
  it("pièce → carreau → simulation → résultat, puis recommencer", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);

    // 1. Pièce
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    expect(etapeCourante()).toContain("Carrelage");

    // 2. Carreau (recherche et filtres partagés avec la page Produits)
    expect(screen.getByRole("heading", { name: "Choisissez un carreau" })).toBeInTheDocument();
    expect(continuer()).toBeDisabled();
    await u.type(screen.getByRole("searchbox"), "ocre");
    expect(screen.queryByRole("heading", { level: 3, name: "Étoile" })).not.toBeInTheDocument();
    await u.click(within(carteCarreau("Avoine")).getByRole("radio"));
    expect(within(carteCarreau("Avoine")).getByRole("radio")).toHaveTextContent("Sélectionné");
    await u.click(continuer());

    // 3. Simulation : l'aperçu reçoit la pièce, le sol et la photo du carreau
    expect(etapeCourante()).toContain("Simulation");
    const apercu = screen.getByTestId("apercu");
    expect(apercu).toHaveAttribute("data-surface", "sol");
    expect(apercu.getAttribute("data-carreau")).toContain("avoine.webp");
    expect(rendus.at(-1).room.id).toBe("salon");

    // 4. Résultat
    await u.click(screen.getByRole("button", { name: "Voir le résultat" }));
    expect(etapeCourante()).toContain("Votre projet");
    const whatsapp = screen.getByRole("link", { name: "Contacter sur WhatsApp" });
    const message = new URL(whatsapp.href).searchParams.get("text");
    expect(message).toContain("• Carreau : Avoine (Carreau ciment)");
    expect(message).toContain("• Pièce : Salon — Sol");
    expect(message).toContain("• Format : 15 x 15 cm");
    expect(message).toContain("• Fiche produit : https://www.bocaro.test/produits/p2");

    // Recommencer : retour à zéro
    await u.click(screen.getByRole("button", { name: "Recommencer" }));
    expect(etapeCourante()).toContain("Espace");
    expect(continuer()).toBeDisabled();
  });

  it("le mode mur transmet les murs de la pièce à l'aperçu", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Cuisine/ }));
    await u.click(screen.getByRole("button", { name: "Mur" }));
    await u.click(continuer());
    await u.click(within(carteCarreau("Étoile")).getByRole("radio"));
    await u.click(continuer());
    expect(screen.getByTestId("apercu")).toHaveAttribute("data-surface", "mur");
    expect(rendus.at(-1).surfaces.length).toBeGreaterThan(1);
    expect(rendus.at(-1).surfaces.every((s) => s.type === "mur")).toBe(true);
  });

  it("les étapes déjà atteintes restent cliquables dans l'indicateur", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    await u.click(screen.getByRole("button", { name: /Espace/ }));
    expect(etapeCourante()).toContain("Espace");
    expect(screen.getByRole("radio", { name: /Salon/ })).toHaveAttribute("aria-checked", "true");
  });
});

describe("présélection depuis une fiche produit", () => {
  it("?carreau=… saute l'étape Carrelage", async () => {
    window.history.replaceState({}, "", "/simulateur?carreau=p4");
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Chambre/ }));
    await u.click(continuer());
    expect(etapeCourante()).toContain("Simulation");
    expect(screen.getByTestId("apercu").getAttribute("data-carreau")).toContain("lagon.webp");
  });

  it("« Modifier la pièce » garde le carreau : nouvelle pièce → simulation directement", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    await u.click(within(carteCarreau("Avoine")).getByRole("radio"));
    await u.click(continuer());
    expect(etapeCourante()).toContain("Simulation");

    await u.click(screen.getByRole("button", { name: "Modifier la pièce" }));
    expect(etapeCourante()).toContain("Espace");
    await u.click(screen.getByRole("radio", { name: /Cuisine/ }));
    await u.click(continuer());

    expect(etapeCourante()).toContain("Simulation");
    expect(rendus.at(-1).room.id).toBe("cuisine");
    expect(screen.getByTestId("apercu").getAttribute("data-carreau")).toContain("avoine.webp");
  });

  it("« Changer de carreau » ramène à l'étape 2 avec le carreau coché", async () => {
    window.history.replaceState({}, "", "/simulateur?carreau=p4");
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    await u.click(screen.getByRole("button", { name: "Changer de carreau" }));
    expect(etapeCourante()).toContain("Carrelage");
    expect(within(carteCarreau("Lagon")).getByRole("radio")).toHaveAttribute("aria-checked", "true");
  });

  it("réseau lent : si le visiteur continue avant le chargement, il arrive quand même à la simulation", async () => {
    window.history.replaceState({}, "", "/simulateur?carreau=p4");
    const u = userEvent.setup();
    catalogue = { ...catalogue, produits: [], chargement: true };
    const { rerender } = rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    expect(etapeCourante()).toContain("Carrelage"); // catalogue encore en chargement

    catalogue = { ...catalogue, produits: produitsExemple(), chargement: false };
    rerender(<SimulateurPage />);
    await waitFor(() => expect(etapeCourante()).toContain("Simulation"));
    expect(screen.getByTestId("apercu").getAttribute("data-carreau")).toContain("lagon.webp");
  });

  it("un identifiant inconnu laisse le parcours normal", async () => {
    window.history.replaceState({}, "", "/simulateur?carreau=inexistant");
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    expect(etapeCourante()).toContain("Carrelage");
  });
});

describe("étape 3 — réglages", () => {
  async function allerALaSimulation() {
    window.history.replaceState({}, "", "/simulateur?carreau=p1");
    const u = userEvent.setup();
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    return u;
  }

  it("format, rotation, joint : chaque réglage est transmis au rendu", async () => {
    const u = await allerALaSimulation();
    const reglages = () => rendus.at(-1).reglages;

    const formats = screen.getAllByRole("button", { name: /x \d+ cm/ });
    expect(formats.map((b) => b.textContent)).toEqual(["10 x 10 cm", "20 x 20 cm"]);
    await u.click(formats[1]);
    expect(formats[1]).toHaveAttribute("aria-pressed", "true");

    await u.click(screen.getByRole("button", { name: "90°" }));
    expect(reglages().rotation).toBe(90);

    fireEvent.change(screen.getByLabelText(/Largeur du joint/), { target: { value: "5" } });
    expect(screen.getByText("5 mm")).toBeInTheDocument();
    expect(reglages().jointWidth).toBe(5);

    await u.click(screen.getByRole("button", { name: "Couleur du joint #2b2b2b" }));
    expect(reglages().jointColor).toBe("#2b2b2b");
  });

  it("Réinitialiser remet les réglages d'origine", async () => {
    const u = await allerALaSimulation();
    await u.click(screen.getByRole("button", { name: "90°" }));
    await u.click(screen.getByRole("button", { name: "Réinitialiser" }));
    expect(screen.getByRole("button", { name: "0°" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2 mm")).toBeInTheDocument();
  });

  it("le message WhatsApp reprend les réglages choisis", async () => {
    const u = await allerALaSimulation();
    await u.click(screen.getByRole("button", { name: "20 x 20 cm" }));
    await u.click(screen.getByRole("button", { name: "90°" }));
    await u.click(screen.getByRole("button", { name: "Voir le résultat" }));
    const texte = new URL(screen.getByRole("link", { name: "Contacter sur WhatsApp" }).href).searchParams.get("text");
    expect(texte).toContain("• Format : 20 x 20 cm");
    expect(texte).toContain("• Pose : rotation 90° · joint de 2 mm");
  });
});

describe("étape 4 — télécharger", () => {
  it("télécharge l'image du rendu", async () => {
    window.history.replaceState({}, "", "/simulateur?carreau=p1");
    const u = userEvent.setup();
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    await u.click(screen.getByRole("button", { name: "Voir le résultat" }));
    await u.click(screen.getByRole("button", { name: "Télécharger" }));
    await waitFor(() => expect(clic).toHaveBeenCalled());
    const lien = clic.mock.contexts.at(-1);
    expect(lien.download).toBe("bocaro-simulation-salon-sol.png");
    expect(lien.href).toMatch(/^data:image\/png/);
  });
});

describe("étape 2 — chargement du catalogue", () => {
  it("affiche un état de chargement, puis une erreur avec « Réessayer »", async () => {
    const u = userEvent.setup();
    catalogue = { ...catalogue, produits: [], chargement: true };
    const { rerender } = rendreAvecLangue(<SimulateurPage />);
    await u.click(screen.getByRole("radio", { name: /Salon/ }));
    await u.click(continuer());
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

    catalogue = { ...catalogue, chargement: false, erreur: "réseau" };
    rerender(<SimulateurPage />);
    expect(screen.getByText("Impossible de charger les carreaux pour le moment.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(catalogue.recharger).toHaveBeenCalled();
  });
});
