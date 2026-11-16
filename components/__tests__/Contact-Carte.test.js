// @vitest-environment jsdom
// Formulaire de contact (envoi vers WhatsApp) et carte chargée au clic.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "../ContactForm";
import MapFacade from "../MapFacade";
import { getDict } from "../../lib/translations";

describe("ContactForm", () => {
  it("les libellés sont reliés aux champs (accessibilité)", () => {
    render(<ContactForm c={getDict("fr").contact} />);
    expect(screen.getByLabelText("Nom complet")).toHaveAttribute("name", "nom");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Message").tagName).toBe("TEXTAREA");
    for (const champ of ["Nom complet", "Email", "Message"]) expect(screen.getByLabelText(champ)).toBeRequired();
    expect(screen.getByText(/ne sont pas enregistrées par le site/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Politique de confidentialité" })).toHaveAttribute("href", "/confidentialite");
  });

  it("ouvre WhatsApp avec un message structuré et confirme l'envoi", async () => {
    const ouvrir = vi.spyOn(window, "open").mockImplementation(() => ({ opener: window }));
    const u = userEvent.setup();
    render(<ContactForm c={getDict("fr").contact} />);
    await u.type(screen.getByLabelText("Nom complet"), "Leïla Trabelsi");
    await u.type(screen.getByLabelText("Email"), "leila@exemple.tn");
    await u.type(screen.getByLabelText("Message"), "Je rénove ma cuisine.");
    await u.click(screen.getByRole("button", { name: "Envoyer via WhatsApp" }));

    expect(ouvrir).toHaveBeenCalledTimes(1);
    const [lien, cible] = ouvrir.mock.calls[0];
    expect(cible).toBe("_blank");
    expect(lien).toMatch(/^https:\/\/wa\.me\/21698514014\?text=/);
    const texte = new URL(lien).searchParams.get("text");
    expect(texte).toContain("• Nom : Leïla Trabelsi");
    expect(texte).toContain("• E-mail : leila@exemple.tn");
    expect(texte).toContain("*Mon message*\nJe rénove ma cuisine.");
    expect(screen.getByRole("status")).toHaveTextContent("Merci");
  });

  it("fenêtre bloquée : pas de « Merci », mais un lien pour ouvrir WhatsApp", async () => {
    vi.spyOn(window, "open").mockImplementation(() => null);
    const u = userEvent.setup();
    render(<ContactForm c={getDict("fr").contact} />);
    await u.type(screen.getByLabelText("Nom complet"), "Sami");
    await u.type(screen.getByLabelText("Email"), "sami@exemple.tn");
    await u.type(screen.getByLabelText("Message"), "Bonjour");
    await u.click(screen.getByRole("button", { name: "Envoyer via WhatsApp" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("bloqué");
    const lien = screen.getByRole("link", { name: "Ouvrir WhatsApp avec mon message" });
    expect(lien.getAttribute("href")).toMatch(/^https:\/\/wa\.me\/21698514014\?text=/);
    expect(new URL(lien.href).searchParams.get("text")).toContain("Bonjour");
    expect(lien).toHaveAttribute("rel", "noopener noreferrer");

    // Modifier le message efface l'avertissement (le lien serait périmé).
    await u.type(screen.getByLabelText("Message"), " !");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("le message suit la langue de la page (arabe)", async () => {
    const ouvrir = vi.spyOn(window, "open").mockImplementation(() => null);
    const u = userEvent.setup();
    const c = getDict("ar").contact;
    render(<ContactForm c={c} />);
    await u.type(screen.getByLabelText(c.nameLabel), "ليلى");
    await u.type(screen.getByLabelText(c.emailLabel), "l@x.tn");
    await u.type(screen.getByLabelText(c.messageLabel), "مرحبا");
    await u.click(screen.getByRole("button", { name: c.submit }));
    expect(new URL(ouvrir.mock.calls[0][0]).searchParams.get("text").startsWith(c.waGreeting)).toBe(true);
  });
});

describe("MapFacade", () => {
  const props = { titre: "Localisation", adresse: "Rue Ras Jedir, Soukra", libelleAfficher: "Afficher la carte", libelleOuvrir: "Ouvrir dans Google Maps" };

  it("ne charge pas Google Maps avant le clic", () => {
    render(<MapFacade {...props} />);
    expect(screen.queryByTitle("Localisation")).not.toBeInTheDocument();
    expect(screen.getByText("Rue Ras Jedir, Soukra")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ouvrir dans Google Maps" })).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
  });

  it("affiche la carte au clic", async () => {
    const u = userEvent.setup();
    render(<MapFacade {...props} />);
    await u.click(screen.getByRole("button", { name: "Afficher la carte" }));
    expect(screen.getByTitle("Localisation")).toHaveAttribute("src", expect.stringContaining("google.com/maps/embed"));
  });
});
