import { rendreScene, chargerImage } from "../../lib/simulateur/renderFloor";

// Génère un canvas hors écran contenant la simulation, pour le
// téléchargement et le partage. Réutilise exactement le moteur de
// rendu de l'aperçu (lib/simulateur/renderFloor) : ce qu'on exporte
// est donc identique à ce que l'utilisateur voit à l'écran.
export async function construireCanvasResultat(room, surfaces, produitImage, reglages) {
  const canvas = document.createElement("canvas");
  canvas.width = room.width;
  canvas.height = room.height;
  const ctx = canvas.getContext("2d");

  const [roomImg, tileImg, ...occluderImgs] = await Promise.all([
    chargerImage(room.image),
    produitImage ? chargerImage(produitImage, true) : Promise.resolve(null),
    ...surfaces.map((s) => (s?.occluder ? chargerImage(s.occluder) : Promise.resolve(null))),
  ]);

  rendreScene(ctx, {
    roomImage: roomImg,
    tileImage: tileImg,
    occluderImages: occluderImgs,
    width: room.width,
    height: room.height,
    surfaces,
    reglages,
    floorPolygon: room.floorPolygon,
    camera: room.camera,
  });

  return canvas;
}
