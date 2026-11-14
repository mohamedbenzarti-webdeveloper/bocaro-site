// @vitest-environment jsdom
// Page Produits : recherche, filtres, pagination à 9 produits, WhatsApp.
import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CatalogueGrid from "../CatalogueGrid";
import { rendreAvecLangue, produitsExemple, produitsNombreux } from "../../tests/utils";

const titres = () => screen.queryAllByRole("heading", { level: 2 }).map((h) => h.textContent).filter((t) => t.startsWith("Carreau "));

describe("CatalogueGrid", () => {
  it("affiche 9 produits par page et passe d'une page à l'autre", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<CatalogueGrid produits={produitsNombreux(20)} />);
    expect(titres()).toHaveLength(9);
    expect(titres()[0]).toBe("Carreau 01");
    expect(screen.getAllByRole("button", { name: /^Page \d$/ })).toHaveLength(3);

    await u.click(screen.getByRole("button", { name: "Page 3" }));
    expect(titres()).toEqual(["Carreau 19", "Carreau 20"]);

    await u.click(screen.getByRole("button", { name: /Précédent/ }));
    expect(titres()[0]).toBe("Carreau 10");
  });

  it("revient à la page 1 quand la recherche change", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<CatalogueGrid produits={produitsNombreux(20)} />);
    await u.click(screen.getByRole("button", { name: "Page 2" }));
    await u.type(screen.getByRole("searchbox"), "carreau");
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    expect(titres()[0]).toBe("Carreau 01");
  });

  it("n'affiche pas de pagination avec 9 produits ou moins", () => {
    rendreAvecLangue(<CatalogueGrid produits={produitsNombreux(9)} />);
    expect(screen.queryByRole("navigation", { name: "Pages des produits" })).not.toBeInTheDocument();
  });

  it("présente chaque produit : lien vers la fiche, type, formats, couleurs, prix", () => {
    rendreAvecLangue(<CatalogueGrid produits={produitsExemple()} />);
    const carte = screen.getByRole("heading", { name: "Étoile" }).closest("article");
    expect(within(carte).getAllByRole("link")[0]).toHaveAttribute("href", "/produits/p1");
    expect(within(carte).getByText("Carreau ciment")).toBeInTheDocument();
    expect(within(carte).getByText("10 x 10 cm")).toHaveAttribute("dir", "ltr");
    expect(within(carte).getByText("Bleu Méditerranée · Blanc")).toBeInTheDocument();
    expect(within(carte).getByText(/120 DT/)).toBeInTheDocument();
    expect(within(carte).getByRole("img", { name: "Étoile" })).toHaveAttribute("src", expect.stringContaining("etoile.webp"));
  });

  it("le bouton « Demander » ouvre WhatsApp avec le nom du produit", () => {
    rendreAvecLangue(<CatalogueGrid produits={produitsExemple()} />);
    const carte = screen.getByRole("heading", { name: "Avoine" }).closest("article");
    const lien = within(carte).getByRole("link", { name: /Demander/ });
    expect(lien).toHaveAttribute("target", "_blank");
    expect(new URL(lien.href).searchParams.get("text")).toBe("Bonjour, je suis intéressé(e) par le produit : Avoine");
  });

  it("indique « photo à venir » pour un produit sans photo", () => {
    rendreAvecLangue(<CatalogueGrid produits={produitsExemple()} />);
    const carte = screen.getByRole("heading", { name: "Brique" }).closest("article");
    expect(within(carte).queryByRole("img")).not.toBeInTheDocument();
  });

  it("propose de réinitialiser quand aucun produit ne correspond", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<CatalogueGrid produits={produitsExemple()} />);
    await u.type(screen.getByRole("searchbox"), "introuvable");
    expect(screen.getByText(/Aucun produit/i)).toBeInTheDocument();
    const boutons = screen.getAllByRole("button", { name: "Réinitialiser" });
    await u.click(boutons[boutons.length - 1]);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getAllByRole("article")).toHaveLength(4);
  });

  it("replie les filtres derrière un bouton (téléphone) et compte les filtres actifs", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<CatalogueGrid produits={produitsExemple()} />);
    const bouton = screen.getByRole("button", { name: /^Filtres/ });
    const panneau = document.getElementById("filtres-catalogue");
    expect(bouton).toHaveAttribute("aria-expanded", "false");
    expect(panneau).toHaveClass("hidden", "lg:block");

    await u.click(bouton);
    expect(bouton).toHaveAttribute("aria-expanded", "true");
    expect(panneau).not.toHaveClass("hidden");

    await u.click(within(panneau).getByRole("button", { name: /^Turquoise/ }));
    expect(bouton).toHaveTextContent("1");
  });

  it("est traduit en anglais", () => {
    rendreAvecLangue(<CatalogueGrid produits={produitsExemple()} />, { locale: "en" });
    expect(screen.getByRole("heading", { name: "Star" })).toBeInTheDocument();
    expect(screen.getAllByText("Cement tile").length).toBeGreaterThan(0);
  });
});
