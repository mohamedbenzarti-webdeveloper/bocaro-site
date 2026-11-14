// @vitest-environment jsdom
// Galerie de l'accueil : flèches, points, clavier, doigt, défilement automatique.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import GalerieSlider from "../GalerieSlider";

const photos = ["Aster", "Avoine", "Etoile"].map((nom, i) => ({
  src: `https://x/${i}.webp`,
  alt: nom,
  nom,
  type: "Carreau ciment",
  href: `/produits/p${i}`,
}));
const textes = { label: "Galerie de nos carreaux", cta: "Voir le produit", prev: "Photo précédente", next: "Photo suivante", go: "Aller à la photo" };
const compteur = () => screen.getByRole("region").querySelector("[aria-live]").textContent.replace(/\s+/g, " ").trim();
const pointActif = () => screen.getAllByRole("button", { name: /Aller à la photo/ }).findIndex((b) => b.getAttribute("aria-current") === "true");

afterEach(() => vi.useRealTimers());

describe("GalerieSlider", () => {
  it("n'affiche rien sans photo", () => {
    const { container } = render(<GalerieSlider photos={[]} textes={textes} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("présente la galerie comme un carrousel accessible", () => {
    render(<GalerieSlider photos={photos} textes={textes} />);
    const region = screen.getByRole("region", { name: "Galerie de nos carreaux" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(compteur()).toBe("01 / 03");
    expect(screen.getAllByRole("button", { name: /Aller à la photo/ })).toHaveLength(3);
  });

  it("flèches et points changent de photo, en boucle", () => {
    render(<GalerieSlider photos={photos} textes={textes} />);
    fireEvent.click(screen.getByRole("button", { name: "Photo suivante" }));
    expect(compteur()).toBe("02 / 03");
    expect(pointActif()).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Aller à la photo 3" }));
    expect(compteur()).toBe("03 / 03");
    fireEvent.click(screen.getByRole("button", { name: "Photo suivante" }));
    expect(compteur()).toBe("01 / 03");
    fireEvent.click(screen.getByRole("button", { name: "Photo précédente" }));
    expect(compteur()).toBe("03 / 03");
  });

  it("se pilote au clavier et au doigt", () => {
    render(<GalerieSlider photos={photos} textes={textes} />);
    const region = screen.getByRole("region");
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(compteur()).toBe("02 / 03");
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(compteur()).toBe("01 / 03");
    fireEvent.touchStart(region, { touches: [{ clientX: 300 }] });
    fireEvent.touchEnd(region, { changedTouches: [{ clientX: 100 }] });
    expect(compteur()).toBe("02 / 03");
  });

  it("le lien de la photo active mène à la fiche produit", () => {
    render(<GalerieSlider photos={photos} textes={textes} />);
    const liens = screen.getAllByRole("link", { name: /Voir le produit/, hidden: true });
    expect(liens.map((l) => l.getAttribute("href"))).toContain("/produits/p0");
  });

  it("défile tout seul toutes les 5,5 s, et s'arrête au survol", () => {
    vi.useFakeTimers();
    render(<GalerieSlider photos={photos} textes={textes} />);
    act(() => vi.advanceTimersByTime(5500));
    expect(compteur()).toBe("02 / 03");
    fireEvent.mouseEnter(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(20000));
    expect(compteur()).toBe("02 / 03");
    fireEvent.mouseLeave(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(5500));
    expect(compteur()).toBe("03 / 03");
  });

  it("ne défile pas tout seul si le visiteur a demandé moins d'animations", () => {
    vi.useFakeTimers();
    const avant = window.matchMedia;
    window.matchMedia = (q) => ({ ...avant(q), matches: q.includes("reduced-motion") });
    try {
      render(<GalerieSlider photos={photos} textes={textes} />);
      act(() => vi.advanceTimersByTime(20000));
      expect(compteur()).toBe("01 / 03");
    } finally {
      window.matchMedia = avant;
    }
  });
});
