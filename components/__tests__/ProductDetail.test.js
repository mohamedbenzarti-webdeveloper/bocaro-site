// @vitest-environment jsdom
// Fiche produit : galerie (flèches, vignettes, clavier, doigt), caractéristiques, liens.
import { describe, it, expect, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductDetail from "../ProductDetail";
import { rendreAvecLangue, produitsExemple } from "../../tests/utils";

const [etoile, avoine, brique] = produitsExemple();
const avecTroisPhotos = { ...avoine, images: ["https://x/1.webp", "https://x/2.webp", "https://x/3.webp"] };
const photoActive = () => screen.getAllByRole("img").find((img) => img.alt && !img.closest("button"));
const galerie = () => screen.getByText("1 / 3", { exact: false }).closest("[tabindex]");

afterEach(() => {
  document.documentElement.dir = "ltr";
});

describe("ProductDetail — informations", () => {
  it("affiche nom, type, prix, description et caractéristiques", () => {
    rendreAvecLangue(<ProductDetail produit={etoile} />);
    expect(screen.getByRole("heading", { level: 1, name: "Étoile" })).toBeInTheDocument();
    expect(screen.getAllByText("Carreau ciment")).toHaveLength(2); // sur-titre + tableau
    expect(screen.getByText("120 DT / m²")).toBeInTheDocument();
    expect(screen.getByText("Motif étoilé bleu")).toBeInTheDocument();
    expect(screen.getByText("Bleu Méditerranée · Blanc")).toBeInTheDocument();
    expect(screen.getByText("20 x 20 cm")).toHaveAttribute("dir", "ltr");
  });

  it("indique l'absence de description et de photo", () => {
    rendreAvecLangue(<ProductDetail produit={{ ...brique, description: "" }} />);
    expect(screen.getByText("Aucune description pour ce produit.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Image suivante" })).not.toBeInTheDocument();
  });

  it("propose WhatsApp et le simulateur avec ce carreau présélectionné", () => {
    rendreAvecLangue(<ProductDetail produit={etoile} />);
    const wa = screen.getByRole("link", { name: /Demander/ });
    expect(new URL(wa.href).searchParams.get("text")).toContain("Étoile");
    expect(screen.getByRole("link", { name: /Tester le simulateur/ })).toHaveAttribute("href", "/simulateur?carreau=p1");
    expect(screen.getByRole("link", { name: /Retour aux produits/ })).toHaveAttribute("href", "/produits");
  });

  it("utilise le nom et la description traduits en arabe", () => {
    rendreAvecLangue(<ProductDetail produit={etoile} />, { locale: "ar" });
    expect(screen.getByRole("heading", { level: 1, name: "نجمة" })).toBeInTheDocument();
  });
});

describe("ProductDetail — galerie", () => {
  it("n'affiche ni flèches ni vignettes pour une seule photo", () => {
    rendreAvecLangue(<ProductDetail produit={etoile} />);
    expect(screen.queryByRole("button", { name: "Image suivante" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1 / 1" })).not.toBeInTheDocument();
  });

  it("les flèches font défiler les photos en boucle", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<ProductDetail produit={avecTroisPhotos} />);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(photoActive()).toHaveAttribute("src", "https://x/1.webp");

    await u.click(screen.getByRole("button", { name: "Image suivante" }));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(photoActive()).toHaveAttribute("src", "https://x/2.webp");

    await u.click(screen.getByRole("button", { name: "Image précédente" }));
    await u.click(screen.getByRole("button", { name: "Image précédente" }));
    expect(screen.getByText("3 / 3")).toBeInTheDocument();
  });

  it("une vignette affiche sa photo", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<ProductDetail produit={avecTroisPhotos} />);
    await u.click(screen.getByRole("button", { name: "3 / 3" }));
    expect(screen.getByRole("button", { name: "3 / 3" })).toHaveAttribute("aria-current", "true");
    expect(photoActive()).toHaveAttribute("src", "https://x/3.webp");
  });

  it("charge toutes les photos d'avance, une seule visible et décrite", () => {
    rendreAvecLangue(<ProductDetail produit={avecTroisPhotos} />);
    const grandes = [...document.querySelectorAll("img")].filter((i) => !i.closest("button"));
    expect(grandes).toHaveLength(3);
    expect(grandes.filter((i) => i.alt === "Avoine")).toHaveLength(1);
    expect(grandes.filter((i) => i.getAttribute("aria-hidden") === "true")).toHaveLength(2);
  });

  it("se pilote au clavier, flèches inversées en arabe", () => {
    rendreAvecLangue(<ProductDetail produit={avecTroisPhotos} />);
    const zone = galerie();
    fireEvent.keyDown(zone, { key: "ArrowRight" });
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    document.documentElement.dir = "rtl";
    fireEvent.keyDown(zone, { key: "ArrowRight" });
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("suit le glissement du doigt (au-delà de 40 px seulement)", () => {
    rendreAvecLangue(<ProductDetail produit={avecTroisPhotos} />);
    const zone = galerie();
    const glisser = (de, a) => {
      fireEvent.touchStart(zone, { touches: [{ clientX: de }] });
      fireEvent.touchEnd(zone, { changedTouches: [{ clientX: a }] });
    };
    glisser(200, 180); // trop court : rien
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    glisser(200, 100); // vers la gauche : suivante
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    glisser(100, 220); // vers la droite : précédente
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});
