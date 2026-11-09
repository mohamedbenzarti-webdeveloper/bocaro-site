import { describe, it, expect } from "vitest";
import { homographieDepuisCarreUnite, projeter } from "../homography.js";

// Tolérance pour les comparaisons flottantes (élimination de Gauss +
// divisions homogènes ne donnent pas une égalité bit à bit).
const EPS = 1e-6;

function attendreProche(point, attendu, eps = EPS) {
  expect(point[0]).toBeCloseTo(attendu[0], 6);
  expect(point[1]).toBeCloseTo(attendu[1], 6);
}

describe("homographieDepuisCarreUnite / projeter — cas normaux", () => {
  it("carré unité -> lui-même : doit être la matrice identité", () => {
    const quad = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).not.toBeNull();

    // Chaque coin du carré unité doit se reprojeter sur lui-même.
    quad.forEach(([u, v]) => attendreProche(projeter(H, u, v), [u, v]));

    // Le centre doit rester au centre (pas de perspective ici).
    attendreProche(projeter(H, 0.5, 0.5), [0.5, 0.5]);
  });

  it("transformation affine pure (mise à l'échelle + translation, sans perspective)", () => {
    // Rectangle axé sur les axes : pas de convergence de point de fuite
    // attendue, h et g doivent rester ~0.
    const quad = [
      [10, 20],
      [110, 20],
      [110, 70],
      [10, 70],
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).not.toBeNull();
    expect(H[6]).toBeCloseTo(0, 6); // pas de terme perspective en u
    expect(H[7]).toBeCloseTo(0, 6); // pas de terme perspective en v

    quad.forEach(([u, v], i) => {
      const src = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ][i];
      attendreProche(projeter(H, src[0], src[1]), [u, v]);
    });

    // Le centre du carré source doit tomber au centre du rectangle.
    attendreProche(projeter(H, 0.5, 0.5), [60, 45]);
  });

  it("vrai quadrilatère en perspective : les 4 coins se reprojettent exactement", () => {
    // Quadrilatère typique d'une photo de sol en perspective : le
    // "fond" (v=0) est plus étroit que "l'avant" (v=1).
    const quad = [
      [150, 100], // fond-gauche
      [350, 100], // fond-droit
      [480, 400], // avant-droit
      [20, 400], // avant-gauche
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).not.toBeNull();

    const src = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    src.forEach(([u, v], i) => attendreProche(projeter(H, u, v), quad[i]));

    // Le point de fuite doit être "au-dessus" du fond (v se rapprochant
    // de -1 doit exploser vers y plus petit) : on vérifie juste que le
    // dénominateur w change de signe de façon cohérente en s'éloignant
    // dans la profondeur, sans jamais planter.
    const loin = projeter(H, 0.5, -50);
    expect(Number.isFinite(loin[0])).toBe(true);
    expect(Number.isFinite(loin[1])).toBe(true);
  });

  it("un point intérieur (0.5, 0.5) reste à l'intérieur du quadrilatère projeté", () => {
    const quad = [
      [150, 100],
      [350, 100],
      [480, 400],
      [20, 400],
    ];
    const H = homographieDepuisCarreUnite(quad);
    const centre = projeter(H, 0.5, 0.5);

    // Test d'inclusion grossier : le centre doit être dans la boîte
    // englobante du quadrilatère (condition nécessaire, pas suffisante,
    // mais suffit à détecter une matrice clairement fausse).
    const xs = quad.map((p) => p[0]);
    const ys = quad.map((p) => p[1]);
    expect(centre[0]).toBeGreaterThan(Math.min(...xs));
    expect(centre[0]).toBeLessThan(Math.max(...xs));
    expect(centre[1]).toBeGreaterThan(Math.min(...ys));
    expect(centre[1]).toBeLessThan(Math.max(...ys));
  });
});

describe("homographieDepuisCarreUnite — cas dégénérés", () => {
  it("trois coins alignés (quadrilatère aplati, surface nulle) -> null, pas de NaN silencieux", () => {
    // Ce cas ne rend pas le pivot de `resoudre` proche de zéro (les
    // équations mélangent x et y séparément par coin), donc sans garde
    // supplémentaire une matrice "valide" était renvoyée alors que la
    // reprojection d'un des coins tombe pile sur l'asymptote (w = 0),
    // produisant un NaN silencieux exploité ensuite par le moteur de
    // rendu. `homographieDepuisCarreUnite` doit filtrer ce cas.
    const quad = [
      [0, 0],
      [100, 0],
      [200, 0], // aligné avec les deux précédents
      [0, 100],
    ];
    expect(() => homographieDepuisCarreUnite(quad)).not.toThrow();
    const H = homographieDepuisCarreUnite(quad);
    expect(H).toBeNull();
  });

  it("les 4 coins alignés sur une même droite -> null", () => {
    const quad = [
      [0, 0],
      [10, 0],
      [20, 0],
      [30, 0],
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).toBeNull();
  });

  it("deux coins confondus (quadrilatère dégénéré en triangle) -> null", () => {
    const quad = [
      [0, 0],
      [100, 0],
      [100, 0], // dupliqué
      [0, 100],
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).toBeNull();
  });

  it("les 4 coins confondus en un seul point -> null", () => {
    const quad = [
      [50, 50],
      [50, 50],
      [50, 50],
      [50, 50],
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).toBeNull();
  });

  it("quadrilatère de surface quasi nulle (presque dégénéré) ne plante pas", () => {
    const quad = [
      [0, 0],
      [100, 0],
      [100, 1e-9],
      [0, 1e-9],
    ];
    expect(() => homographieDepuisCarreUnite(quad)).not.toThrow();
  });
});

describe("homographieDepuisCarreUnite — quadrilatères non convexes / croisés", () => {
  it("quadrilatère concave (un coin \"rentrant\") : résout quand même et reprojette exactement", () => {
    // fond-droit ramené vers l'intérieur : le quadrilatère n'est plus
    // convexe, mais les 4 points restent affinement indépendants donc
    // le système linéaire reste bien posé.
    const quad = [
      [0, 0], // fond-gauche
      [200, 150], // fond-droit, "rentré" à l'intérieur -> concavité
      [200, 300], // avant-droit
      [0, 300], // avant-gauche
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).not.toBeNull();

    const src = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    src.forEach(([u, v], i) => attendreProche(projeter(H, u, v), quad[i]));
  });

  it("quadrilatère croisé façon \"nœud papillon\" : résout sans exception", () => {
    // Ordre des coins volontairement inversé pour créer des diagonales
    // qui se croisent (self-intersecting). Mathématiquement, tant que
    // les 4 points ne sont pas colinéaires, le système 8x8 a une
    // solution — mais elle décrit une transformation dégénérée pour le
    // rendu (le moteur d'appel doit s'assurer que le quad vient bien
    // d'un tracé utilisateur non croisé ; ce test documente juste que
    // la fonction ne plante pas et reste mathématiquement cohérente).
    const quad = [
      [0, 0],
      [200, 300], // inversé avec le coin "avant-droit"
      [200, 0],
      [0, 300],
    ];
    expect(() => homographieDepuisCarreUnite(quad)).not.toThrow();
    const H = homographieDepuisCarreUnite(quad);
    expect(H).not.toBeNull();

    const src = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    src.forEach(([u, v], i) => attendreProche(projeter(H, u, v), quad[i]));
  });

  it("grand nombre de projections aléatoires reste fini (pas de NaN/Infinity) pour un quad valide", () => {
    const quad = [
      [150, 100],
      [350, 100],
      [480, 400],
      [20, 400],
    ];
    const H = homographieDepuisCarreUnite(quad);
    expect(H).not.toBeNull();

    for (let i = 0; i < 200; i++) {
      const u = Math.random() * 2 - 0.5; // dépasse volontairement [0,1]
      const v = Math.random() * 2 - 0.5;
      const [x, y] = projeter(H, u, v);
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });
});
