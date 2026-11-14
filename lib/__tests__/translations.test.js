// Traductions FR / EN / AR : les trois langues doivent avoir exactement
// la même structure, sinon un texte manque dans une langue du site.
import { describe, it, expect } from "vitest";
import {
  dict,
  locales,
  defaultLocale,
  getDict,
  localeNames,
  translateFixedField,
  localizeProductField,
  productTypeTranslations,
  productColourTranslations,
} from "../translations";
import { PALETTE_COULEURS } from "../../components/admin/ColorPicker";

/** Toutes les feuilles du dictionnaire : [chemin, valeur]. */
function feuilles(objet, prefixe = "") {
  if (Array.isArray(objet)) return [[`${prefixe}.length`, objet.length], ...objet.flatMap((v, i) => feuilles(v, `${prefixe}[${i}]`))];
  if (objet && typeof objet === "object")
    return Object.entries(objet).flatMap(([cle, v]) => feuilles(v, prefixe ? `${prefixe}.${cle}` : cle));
  return [[prefixe, objet]];
}
const chemins = (locale) => feuilles(dict[locale]).map(([c]) => c).sort();
const jetons = (texte) => (typeof texte === "string" ? (texte.match(/\{\w+\}/g) ?? []).sort() : []);

describe("dictionnaires", () => {
  it("propose les trois langues, français par défaut", () => {
    expect(locales).toEqual(["fr", "en", "ar"]);
    expect(defaultLocale).toBe("fr");
    expect(Object.keys(localeNames)).toEqual(locales);
  });

  it.each(["en", "ar"])("la langue %s a exactement les mêmes clés que le français", (locale) => {
    const fr = chemins("fr");
    const autre = chemins(locale);
    expect(autre.filter((c) => !fr.includes(c)), "clés en trop").toEqual([]);
    expect(fr.filter((c) => !autre.includes(c)), "clés manquantes").toEqual([]);
  });

  it.each(locales)("aucun texte vide en %s", (locale) => {
    const vides = feuilles(dict[locale]).filter(([, v]) => typeof v === "string" && v.trim() === "" && v !== "");
    expect(vides).toEqual([]);
  });

  it.each(["en", "ar"])("les variables {…} sont les mêmes qu'en français (%s)", (locale) => {
    const fr = Object.fromEntries(feuilles(dict.fr));
    const differences = feuilles(dict[locale])
      .filter(([c, v]) => JSON.stringify(jetons(v)) !== JSON.stringify(jetons(fr[c])))
      .map(([c]) => c);
    expect(differences).toEqual([]);
  });

  it("l'arabe s'écrit de droite à gauche, les autres de gauche à droite", () => {
    expect(getDict("ar").dir).toBe("rtl");
    expect(getDict("fr").dir).toBe("ltr");
    expect(getDict("en").dir).toBe("ltr");
  });

  it("une langue inconnue retombe sur le français", () => {
    expect(getDict("de")).toBe(dict.fr);
    expect(getDict(undefined)).toBe(dict.fr);
  });
});

describe("fichier source des traductions", () => {
  // Une clé écrite deux fois dans le même bloc est silencieusement écrasée
  // par JavaScript (cas réel : nav.theme, dont le libellé complet du bouton
  // jour/nuit était remplacé par « Thème »).
  it("aucune clé n'est déclarée deux fois dans un même bloc", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(join(process.cwd(), "lib", "translations.js"), "utf8");
    const pile = [new Set()];
    const doublons = [];
    source.split("\n").forEach((ligne, i) => {
      const cle = ligne.match(/^\s*([A-Za-z_$][\w$]*|"(?:[^"\\]|\\.)*")\s*:/);
      // Les chaînes peuvent contenir des accolades ({count}) : on les retire
      // avant de compter les blocs.
      const code = ligne.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g, '""').replace(/\/\/.*$/, "");
      if (cle) {
        const nom = cle[1].replace(/"/g, "");
        if (pile.at(-1).has(nom)) doublons.push(`ligne ${i + 1} : ${nom}`);
        pile.at(-1).add(nom);
      }
      for (const car of code) {
        if (car === "{" || car === "[") pile.push(new Set());
        if ((car === "}" || car === "]") && pile.length > 1) pile.pop();
      }
    });
    expect(doublons).toEqual([]);
  });
});

describe("types et couleurs des produits", () => {
  it.each([
    ["type", productTypeTranslations],
    ["couleur", productColourTranslations],
  ])("chaque %s est traduit dans les trois langues", (_, dictionnaire) => {
    for (const [valeur, traductions] of Object.entries(dictionnaire)) {
      expect(Object.keys(traductions).sort(), valeur).toEqual([...locales].sort());
      expect(traductions.fr).toBe(valeur);
      for (const l of locales) expect(traductions[l].trim(), `${valeur} (${l})`).not.toBe("");
    }
  });

  it("chaque couleur proposée dans le dashboard a sa traduction", () => {
    const sansTraduction = PALETTE_COULEURS.map((c) => c.label).filter((c) => !productColourTranslations[c]);
    expect(sansTraduction).toEqual([]);
  });

  it("translateFixedField traduit, ou garde la valeur inconnue telle quelle", () => {
    expect(translateFixedField(productTypeTranslations, "Faïence", "en")).toBe("Earthenware");
    expect(translateFixedField(productColourTranslations, "Blanc", "ar")).toBe("أبيض");
    expect(translateFixedField(productTypeTranslations, "Ancien type", "en")).toBe("Ancien type");
  });

  it("localizeProductField retombe sur le français si la traduction manque", () => {
    const produit = { nom: "Étoile", nom_en: "Star", nom_ar: "", description: "Bleu" };
    expect(localizeProductField(produit, "nom", "fr")).toBe("Étoile");
    expect(localizeProductField(produit, "nom", "en")).toBe("Star");
    expect(localizeProductField(produit, "nom", "ar")).toBe("Étoile");
    expect(localizeProductField(produit, "description", "en")).toBe("Bleu");
    expect(localizeProductField({}, "description", "fr")).toBe("");
    expect(localizeProductField({}, "description", "ar")).toBe("");
  });
});
