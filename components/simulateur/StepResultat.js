"use client";

import { useMemo, useState } from "react";
import CanvasCompare from "./CanvasCompare";
import { construireCanvasResultat } from "./exportCanvas";
import { formatActif, reglagesPourRendu } from "../../lib/simulateur/tileSize";

export default function StepResultat({
  room,
  surfaces,
  produit,
  nomProduit,
  uniteLabel,
  reglages,
  texts,
  roomLabel,
  surfaceLabel,
  locale,
  onStartOver,
}) {
  const [enCours, setEnCours] = useState(false);

  const produitImage = produit?.images?.[0];
  const reglagesRendu = useMemo(
    () => reglagesPourRendu(produit, reglages),
    [produit, reglages]
  );

  async function genererCanvas() {
    return construireCanvasResultat(room, surfaces, produitImage, reglagesRendu);
  }

  const typeSurface = surfaces[0]?.type ?? "sol";

  async function telecharger() {
    setEnCours(true);
    try {
      const canvas = await genererCanvas();
      const lien = document.createElement("a");
      lien.download = `bocaro-simulation-${room.id}-${typeSurface}.png`;
      lien.href = canvas.toDataURL("image/png");
      lien.click();
    } catch {
      // La génération peut échouer si l'image du produit ne peut pas
      // être lue par le canvas (restriction CORS sur le stockage) —
      // dans ce cas on n'interrompt pas le parcours de l'utilisateur.
    } finally {
      setEnCours(false);
    }
  }

  async function partager() {
    setEnCours(true);
    try {
      const canvas = await genererCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const fichier = new File([blob], `bocaro-simulation-${room.id}-${typeSurface}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [fichier] })) {
        await navigator.share({
          title: texts.shareTitle,
          text: texts.shareText,
          files: [fichier],
        });
      } else if (navigator.share) {
        await navigator.share({ title: texts.shareTitle, text: texts.shareText });
      } else {
        await telecharger();
      }
    } catch {
      // Partage annulé par l'utilisateur ou API indisponible : rien à faire.
    } finally {
      setEnCours(false);
    }
  }

  const format = formatActif(produit, reglages.format);
  const pieceEtSurface = surfaceLabel ? `${roomLabel} — ${surfaceLabel}` : roomLabel;

  // Message WhatsApp : question rapide, avec le contexte de la simulation.
  function lienWhatsApp() {
    const w = texts.wa;
    const lignes = [
      w.intro,
      "",
      `${w.product} : ${nomProduit}`,
      `${w.room} : ${pieceEtSurface}`,
      format ? `${w.format} : ${format}` : null,
      `${w.joint} : ${reglages.jointWidth} mm`,
      "",
      w.outro,
    ].filter((l) => l !== null);
    return `https://wa.me/21698514014?text=${encodeURIComponent(lignes.join("\n"))}`;
  }

  return (
    <div>
      <h2 className="font-serif text-3xl md:text-4xl leading-tight text-bocaro-950 text-center mb-3">
        {texts.title}
      </h2>
      <p className="text-bocaro-600 text-center max-w-lg mx-auto mb-8">
        {texts.subtitle}
      </p>

      <CanvasCompare
        room={room}
        surfaces={surfaces}
        tileSrc={produitImage}
        reglages={reglagesRendu}
        fadeKey={`${room.id}-${typeSurface}-${produit?.id ?? "none"}`}
        labels={{
          before: texts.before,
          after: texts.after,
          beforeAlt: texts.beforeAlt,
          sliderAriaLabel: texts.sliderAriaLabel,
        }}
      />

      {produit && (
        <div className="mt-6 max-w-md mx-auto bg-bocaro-50 rounded-2xl p-5 border border-bocaro-100 flex items-center gap-4">
          {produitImage && (
            <img
              src={produitImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-bocaro-950 truncate">{nomProduit}</p>
            <p className="text-sm text-bocaro-600">
              {produit.prix} {uniteLabel}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={telecharger}
          disabled={enCours}
          className="btn-outline text-sm py-2.5 disabled:opacity-50"
        >
          {texts.downloadButton}
        </button>
        <button
          onClick={partager}
          disabled={enCours}
          className="btn-outline text-sm py-2.5 disabled:opacity-50"
        >
          {texts.shareButton}
        </button>
        <a
          href={lienWhatsApp()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline text-sm py-2.5"
        >
          {texts.whatsappButton}
        </a>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onStartOver}
          className="text-sm font-medium text-bocaro-500 hover:text-bocaro-800 underline underline-offset-4"
        >
          {texts.startOverButton}
        </button>
      </div>
    </div>
  );
}
