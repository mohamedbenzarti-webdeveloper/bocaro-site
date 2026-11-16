// Les limites du serveur (lib/validation-produit.js) et celles de la base
// (sql/migration_v11.sql) doivent rester identiques.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LIMITES, TYPES_PRODUIT, erreurProduit } from "../validation-produit";

const sql = readFileSync(join(process.cwd(), "sql", "migration_v11.sql"), "utf8");

const valide = {
  nom: "Étoile", nom_en: null, nom_ar: null, type: "Faïence",
  description: null, description_en: null, description_ar: null,
  dimensions: ["10 x 10 cm"], couleurs: ["Blanc"], prix: 0, images: [],
};

describe("validation d'un produit", () => {
  it("accepte un produit correct, prix 0 compris (« Sur devis »)", () => {
    expect(erreurProduit(valide)).toBeNull();
  });

  it("accepte les valeurs exactement à la limite", () => {
    expect(erreurProduit({ ...valide, nom: "x".repeat(LIMITES.nom), prix: LIMITES.prixMax })).toBeNull();
  });

  it("refuse Infinity et les listes trop longues", () => {
    expect(erreurProduit({ ...valide, prix: Infinity })).toMatch(/Prix/);
    expect(erreurProduit({ ...valide, images: Array(LIMITES.images + 1).fill("u") })).toMatch(/photos/);
    expect(erreurProduit({ ...valide, dimensions: Array(LIMITES.dimensions + 1).fill("d") })).toMatch(/dimensions/);
  });
});

describe("contraintes de la base identiques au serveur", () => {
  it("longueurs et prix", () => {
    expect(sql).toContain(`between 1 and ${LIMITES.nom}`);
    expect(sql).toContain(`char_length(nom_en) <= ${LIMITES.nom}`);
    expect(sql).toContain(`char_length(description) <= ${LIMITES.description}`);
    expect(sql).toContain(`prix <= ${LIMITES.prixMax}`);
  });

  it("taille des listes", () => {
    expect(sql).toContain(`array_length(dimensions, 1), 0) <= ${LIMITES.dimensions}`);
    expect(sql).toContain(`array_length(couleurs, 1), 0) <= ${LIMITES.couleurs}`);
    expect(sql).toContain(`array_length(images, 1), 0) <= ${LIMITES.images}`);
  });

  it("mêmes types de produit", () => {
    const liste = sql.match(/type in \(([^)]*)\)/)[1].split(",").map((t) => t.trim().replace(/'/g, ""));
    expect(liste).toEqual(TYPES_PRODUIT);
  });
});
