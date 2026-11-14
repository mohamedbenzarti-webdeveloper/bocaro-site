// Messages WhatsApp envoyés depuis le simulateur et la page Contact.
import { describe, it, expect } from "vitest";
import { lienWhatsApp, messageSimulation, messageContact, NUMERO_WHATSAPP } from "../whatsapp";
import { getDict, locales } from "../translations";

const simulation = {
  nomProduit: "Aster",
  type: "Carreau ciment",
  prix: "100 DT / m²",
  piece: "Salon — Sol",
  format: "10 x 10 cm",
  rotation: 90,
  joint: 2,
  lienFiche: "https://www.bocaro.test/produits/p1",
};

describe("lienWhatsApp", () => {
  it("ouvre la conversation BOCARO avec le texte encodé", () => {
    const lien = lienWhatsApp("Bonjour & merci\nLigne 2");
    expect(lien.startsWith(`https://wa.me/${NUMERO_WHATSAPP}?text=`)).toBe(true);
    expect(new URL(lien).searchParams.get("text")).toBe("Bonjour & merci\nLigne 2");
  });
});

describe("messageSimulation", () => {
  it("présente la simulation, la demande et la politesse, dans cet ordre", () => {
    const texte = messageSimulation(getDict("fr").wizard.resultat.wa, simulation);
    expect(texte).toBe(
      [
        "Bonjour BOCARO,",
        "",
        "J'ai réalisé une simulation sur votre site et je souhaiterais recevoir plus d'informations sur ce carreau.",
        "",
        "*Ma simulation*",
        "• Carreau : Aster (Carreau ciment)",
        "• Prix indicatif : 100 DT / m²",
        "• Pièce : Salon — Sol",
        "• Format : 10 x 10 cm",
        "• Pose : rotation 90° · joint de 2 mm",
        "• Fiche produit : https://www.bocaro.test/produits/p1",
        "",
        "*Ma demande*",
        "• Surface à couvrir : ___ m²",
        "• Disponibilité et délai de fabrication",
        "• Devis pour ma surface (quantité conseillée, chutes comprises)",
        "• Conditions et délai de livraison",
        "",
        "Merci d'avance pour votre retour.",
        "Cordialement.",
      ].join("\n")
    );
  });

  it("omet les lignes sans information (prix, format, fiche, type)", () => {
    const texte = messageSimulation(getDict("fr").wizard.resultat.wa, {
      ...simulation,
      type: "",
      prix: null,
      format: null,
      lienFiche: null,
    });
    expect(texte).toContain("• Carreau : Aster\n");
    expect(texte).not.toContain("Prix indicatif");
    expect(texte).not.toContain("Format");
    expect(texte).not.toContain("Fiche produit");
    expect(texte).not.toContain("undefined");
    expect(texte).not.toContain("null");
  });

  it.each(locales)("est complet en %s (aucun libellé manquant)", (locale) => {
    const texte = messageSimulation(getDict(locale).wizard.resultat.wa, simulation);
    expect(texte).not.toMatch(/undefined|null|\[object/);
    expect(texte.match(/^\*.+\*$/gm)).toHaveLength(2); // deux titres en gras
    expect(texte.split("\n").filter((l) => l.startsWith("• "))).toHaveLength(10);
  });
});

describe("messageContact", () => {
  const formulaire = { nom: "  Leïla Trabelsi ", email: " leila@exemple.tn ", message: "  Bonjour,\nje rénove ma cuisine.  " };

  it("met en forme coordonnées et message", () => {
    expect(messageContact(getDict("fr").contact, formulaire)).toBe(
      [
        "Bonjour BOCARO,",
        "",
        "Je vous contacte depuis votre site internet.",
        "",
        "*Mes coordonnées*",
        "• Nom : Leïla Trabelsi",
        "• E-mail : leila@exemple.tn",
        "",
        "*Mon message*",
        "Bonjour,\nje rénove ma cuisine.",
        "",
        "Merci d'avance pour votre retour.",
        "",
        "_Envoyé depuis la page Contact du site BOCARO_",
      ].join("\n")
    );
  });

  it.each(locales)("est complet en %s", (locale) => {
    const texte = messageContact(getDict(locale).contact, formulaire);
    expect(texte).not.toMatch(/undefined|null/);
    expect(texte).toContain("Leïla Trabelsi");
    expect(texte.trim().endsWith("_")).toBe(true);
  });

  it("supporte des champs vides sans planter", () => {
    expect(messageContact(getDict("fr").contact, {})).toContain("• Nom : \n");
  });
});
