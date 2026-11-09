"use client";

import { useEffect, useRef, useState } from "react";
import { rendreScene, chargerImage } from "../../lib/simulateur/renderFloor";

export default function FloorCanvas({
  room,
  surfaces,
  tileSrc,
  reglages,
  onError,
  className,
}) {
  const canvasRef = useRef(null);
  const imagesRef = useRef({ room: null, tile: null, occluders: [] });
  const frameRef = useRef(null);
  const [pret, setPret] = useState(false);
  const occluderSrcs = (surfaces ?? []).map((s) => s?.occluder ?? null);
  const occluderKey = occluderSrcs.join("|");

  // Chargement des images : uniquement quand la pièce, les surfaces
  // (sol/murs) ou le carreau changent, jamais pendant le réglage des
  // curseurs.
  useEffect(() => {
    let annule = false;
    setPret(false);

    Promise.all([
      chargerImage(room.image),
      tileSrc ? chargerImage(tileSrc, true) : Promise.resolve(null),
      ...occluderSrcs.map((src) =>
        src ? chargerImage(src) : Promise.resolve(null),
      ),
    ])
      .then(([roomImg, tileImg, ...occluderImgs]) => {
        if (annule) return;
        imagesRef.current = {
          room: roomImg,
          tile: tileImg,
          occluders: occluderImgs,
        };
        setPret(true);
      })
      .catch((e) => {
        if (!annule) onError?.(e.message);
      });

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.image, occluderKey, tileSrc, onError]);

  // Rendu : planifié via requestAnimationFrame pour que le glissement
  // d'un curseur reste fluide (un seul rendu par frame maximum).
  useEffect(() => {
    if (!pret) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      // Garantit la taille native de la photo avant de dessiner.
      if (canvas.width !== room.width) canvas.width = room.width;
      if (canvas.height !== room.height) canvas.height = room.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        onError?.("Mémoire graphique insuffisante");
        return;
      }
      try {
        rendreScene(ctx, {
          roomImage: imagesRef.current.room,
          tileImage: imagesRef.current.tile,
          occluderImages: imagesRef.current.occluders,
          width: room.width,
          height: room.height,
          surfaces,
          reglages,
          floorPolygon: room.floorPolygon,
          camera: room.camera,
        });
      } catch (e) {
        onError?.(e?.message ?? String(e));
      }
    });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, room.width, room.height, surfaces, reglages]);

  return (
    <div className="relative w-full h-full">
      {/* Le canvas garde la résolution native de la photo ; l'affichage
          est mis à l'échelle en CSS, donc un redimensionnement de la
          fenêtre ne relance aucun calcul. */}
      <canvas
        ref={canvasRef}
        width={room.width}
        height={room.height}
        className={className ?? "w-full h-auto block rounded-[28px]"}
      />
      {!pret && (
        <div className="absolute inset-0 flex items-center justify-center bg-bocaro-50/70 rounded-[28px]">
          <span className="w-8 h-8 rounded-full border-2 border-bocaro-300 border-t-bocaro-700 animate-spin" />
        </div>
      )}
    </div>
  );
}

