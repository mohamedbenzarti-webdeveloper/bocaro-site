import { describe, it, expect } from "vitest";
import {
  parseFormat,
  formatActif,
  reglagesPourRendu,
  TAILLE_PAR_DEFAUT,
} from "../tileSize.js";

describe("parseFormat", () => {
  it("lit les formats usuels", () => {
    expect(parseFormat("10 x 10 cm")).toEqual({ w: 10, h: 10 });
    expect(parseFormat("15x20")).toEqual({ w: 15, h: 20 });
    expect(parseFormat("20 × 40 cm")).toEqual({ w: 20, h: 40 });
  });

  it("accepte les décimales avec virgule ou point", () => {
    expect(parseFormat("7,5 x 7,5 cm")).toEqual({ w: 7.5, h: 7.5 });
    expect(parseFormat("2.5x5")).toEqual({ w: 2.5, h: 5 });
  });

  it("renvoie null pour un format illisible ou nul", () => {
    expect(parseFormat("sur mesure")).toBeNull();
    expect(parseFormat("0 x 10")).toBeNull();
    expect(parseFormat(undefined)).toBeNull();
  });
});

describe("formatActif / reglagesPourRendu", () => {
  const produit = { dimensions: ["sur mesure", "10 x 10 cm", "20 x 20 cm"] };

  it("prend le premier format lisible par défaut", () => {
    expect(formatActif(produit, null)).toBe("10 x 10 cm");
  });

  it("respecte le format choisi s'il appartient au produit", () => {
    expect(formatActif(produit, "20 x 20 cm")).toBe("20 x 20 cm");
    expect(formatActif(produit, "60 x 60 cm")).toBe("10 x 10 cm");
  });

  it("utilise la taille par défaut sans format lisible", () => {
    const r = reglagesPourRendu({ dimensions: [] }, { rotation: 90 });
    expect(r.tuileCm).toEqual(TAILLE_PAR_DEFAUT);
    expect(r.rotation).toBe(90);
  });

  it("injecte la taille réelle du format choisi", () => {
    const r = reglagesPourRendu(produit, { format: "20 x 20 cm" });
    expect(r.tuileCm).toEqual({ w: 20, h: 20 });
  });
});
