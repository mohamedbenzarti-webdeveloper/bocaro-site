// Données des pièces du simulateur : chaque pièce proposée doit avoir sa
// photo, un masque de sol cohérent et des murs exploitables par le moteur.
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOMS, WIZARD_ROOM_IDS, getWizardRooms, isRoomDisponible, getRoom, hasMur, getSurfaces } from "../rooms";

const PUBLIC = join(process.cwd(), "public");
const existe = (chemin) => existsSync(join(PUBLIC, chemin));

/** Polygone "x,y x,y …" (ou tableau de points) → [[x, y], …]. */
function points(polygone) {
  if (Array.isArray(polygone)) return polygone;
  return polygone.trim().split(/\s+/).map((p) => p.split(",").map(Number));
}

describe("parcours du simulateur", () => {
  it("propose les cinq pièces, toutes disponibles", () => {
    expect(WIZARD_ROOM_IDS).toEqual(["salon", "cuisine", "salle-de-bain", "chambre", "terrasse"]);
    expect(getWizardRooms().every((p) => p.disponible && p.room)).toBe(true);
  });

  it("isRoomDisponible / getRoom", () => {
    expect(isRoomDisponible("salon")).toBe(true);
    expect(isRoomDisponible("garage")).toBe(false);
    expect(getRoom("cuisine").id).toBe("cuisine");
    expect(getRoom("inconnue")).toBe(ROOMS[0]);
  });

  it("chaque identifiant de pièce est unique", () => {
    const ids = ROOMS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe.each(ROOMS.map((r) => [r.id, r]))("pièce %s", (_, room) => {
  it("a sa photo et ses calques de premier plan dans public/", () => {
    expect(existe(room.image), room.image).toBe(true);
    const calques = [room.occluder, ...(room.walls ?? []).map((w) => w.occluder)].filter((o) => typeof o === "string");
    for (const c of calques) expect(existe(c), c).toBe(true);
  });

  it("a un masque de sol fermé, dans le cadre de la photo", () => {
    const pts = points(room.floorPolygon);
    expect(pts.length).toBeGreaterThanOrEqual(3);
    for (const [x, y] of pts) {
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(room.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(room.height);
    }
  });

  it("a un plan de sol en perspective (4 coins) et des dimensions réalistes", () => {
    expect(room.floorQuad).toHaveLength(4);
    room.floorQuad.forEach((p) => expect(p.every(Number.isFinite)).toBe(true));
    expect(room.floorSize.width).toBeGreaterThan(1);
    expect(room.floorSize.width).toBeLessThan(30);
    expect(room.floorSize.depth).toBeGreaterThan(1);
    expect(room.floorSize.depth).toBeLessThan(30);
  });

  it("fournit la surface « sol » au moteur de rendu", () => {
    const [sol, ...reste] = getSurfaces(room, "sol");
    expect(reste).toEqual([]);
    expect(sol).toMatchObject({ type: "sol", polygon: room.floorPolygon, quad: room.floorQuad });
  });

  it("fournit un plan par mur, chacun avec masque, 4 coins et taille", () => {
    const murs = getSurfaces(room, "mur");
    expect(murs).toHaveLength(room.walls?.length ?? 0);
    expect(hasMur(room)).toBe(murs.length > 0);
    for (const mur of murs) {
      expect(mur.type).toBe("mur");
      expect(points(mur.polygon).length).toBeGreaterThanOrEqual(3);
      expect(mur.quad).toHaveLength(4);
      expect(mur.size.width).toBeGreaterThan(0);
      expect(mur.size.depth).toBeGreaterThan(0);
      expect(mur.alignerBas).toBe(true);
    }
  });
});

describe("getSurfaces", () => {
  it("filtre les murs par zone", () => {
    const salon = getRoom("salon");
    const gauche = getSurfaces(salon, "mur", "gauche");
    expect(gauche.length).toBeGreaterThan(0);
    expect(gauche.length).toBeLessThan(getSurfaces(salon, "mur", "tous").length);
    expect(getSurfaces(salon, "mur", "tous")).toHaveLength(salon.walls.length);
  });

  it("renvoie une liste vide si la surface n'existe pas", () => {
    expect(getSurfaces(null, "sol")).toEqual([]);
    expect(getSurfaces({ id: "vide" }, "sol")).toEqual([]);
    expect(getSurfaces({ id: "vide" }, "mur")).toEqual([]);
  });
});
