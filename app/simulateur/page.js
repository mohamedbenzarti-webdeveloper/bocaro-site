"use client";

import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { localizeProductField } from "../../lib/translations";
import { getRoom, getSurfaces, isRoomDisponible } from "../../lib/rooms";
import { useProduits } from "../../lib/hooks/useProduits";

import Hero from "../../components/simulateur/Hero";
import Stepper from "../../components/simulateur/Stepper";
import StepEspace from "../../components/simulateur/StepEspace";
import StepCarrelage from "../../components/simulateur/StepCarrelage";
import StepSimulation from "../../components/simulateur/StepSimulation";
import StepResultat from "../../components/simulateur/StepResultat";

const REGLAGES_INITIAUX = {
  format: null,
  rotation: 0,
  jointWidth: 2,
  jointColor: "#ffffff",
  // Reflet au sol (mode "mur" uniquement) : activé par défaut, visible
  // sans dominer (comme un vrai sol brillant réfléchissant le mur).
  reflet: { actif: true, opacite: 0.42, flou: 3 },
};

export default function SimulateurPage() {
  const { t, locale } = useLanguage();
  const w = t.wizard;

  const { produits, chargement, erreur, recharger } = useProduits();

  const [etape, setEtape] = useState(1);
  const [pieceId, setPieceId] = useState(null);
  const [surfaceType, setSurfaceType] = useState("sol");
  const [produitActif, setProduitActif] = useState(null);
  const [reglages, setReglages] = useState(REGLAGES_INITIAUX);
  const [erreurRendu, setErreurRendu] = useState(null);

  // Changer de pièce revient toujours au sol par défaut : un mur choisi
  // sur une pièce ne présume pas de la pièce suivante.
  function choisirPiece(id) {
    setPieceId(id);
    setSurfaceType("sol");
  }

  // Une étape n'est atteignable que si les choix qu'elle exige ont
  // été faits : la simulation a besoin d'une pièce ET d'un produit.
  const pieceChoisie = Boolean(pieceId) && isRoomDisponible(pieceId);
  const produitChoisi = Boolean(produitActif);

  function etapeAccessible(numero) {
    if (numero <= 1) return true;
    if (numero === 2) return pieceChoisie;
    return pieceChoisie && produitChoisi;
  }

  // Étape la plus avancée atteignable : pilote l'état du Stepper.
  const etapeMax = !pieceChoisie ? 1 : !produitChoisi ? 2 : 4;

  function allerA(numero) {
    if (!etapeAccessible(numero)) return;
    setEtape(numero);
  }

  function recommencer() {
    setProduitActif(null);
    setReglages(REGLAGES_INITIAUX);
    setPieceId(null);
    setSurfaceType("sol");
    setEtape(1);
  }

  const room = pieceChoisie ? getRoom(pieceId) : null;
  // "mur" rend tous les murs de la pièce, chacun avec sa propre perspective.
  const surfaces = room ? getSurfaces(room, surfaceType) : [];
  const nomProduitActif = produitActif
    ? localizeProductField(produitActif, "nom", locale)
    : "";

  return (
    <div>
      <Hero texts={w.hero} />

      <section className="section-padding bg-surface">
        <div className="container-app">
          <div className="mb-14">
            <Stepper
              steps={w.steps}
              current={etape}
              plusHaut={etapeMax}
              onNavigate={allerA}
            />
          </div>

          {erreurRendu && etape === 3 && (
            <p className="text-center text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-xl py-3 px-4 max-w-md mx-auto mb-8">
              {w.simulation.renderError}
            </p>
          )}

          {etape === 1 && (
            <StepEspace
              texts={w.espace}
              pieceActive={pieceId}
              onSelect={choisirPiece}
              surfaceType={surfaceType}
              onSelectSurface={setSurfaceType}
              onContinue={() => allerA(2)}
            />
          )}

          {etape === 2 && (
            <StepCarrelage
              produits={produits}
              chargement={chargement}
              erreur={erreur}
              onRecharger={recharger}
              locale={locale}
              texts={w.carrelage}
              uniteLabel={t.catalogue.unit}
              produitActif={produitActif}
              onSelect={setProduitActif}
              onContinue={() => allerA(3)}
            />
          )}

          {etape === 3 && room && surfaces.length > 0 && produitActif && (
            <StepSimulation
              room={room}
              surfaces={surfaces}
              produit={produitActif}
              locale={locale}
              uniteLabel={t.catalogue.unit}
              reglages={reglages}
              onChangeReglages={(partiel) =>
                setReglages((r) => ({ ...r, ...partiel }))
              }
              onReset={() => setReglages(REGLAGES_INITIAUX)}
              texts={w.simulation}
              onChangerProduit={() => allerA(2)}
              onChangerPiece={() => allerA(1)}
              onVoirResultat={() => allerA(4)}
              onError={setErreurRendu}
            />
          )}

          {etape === 4 && room && surfaces.length > 0 && produitActif && (
            <StepResultat
              room={room}
              surfaces={surfaces}
              produit={produitActif}
              nomProduit={nomProduitActif}
              uniteLabel={t.catalogue.unit}
              reglages={reglages}
              texts={w.resultat}
              roomLabel={w.espace.rooms[pieceId]}
              surfaceLabel={surfaceType === "mur" ? w.espace.surfaceMur : w.espace.surfaceSol}
              locale={locale}
              onStartOver={recommencer}
            />
          )}
        </div>
      </section>
    </div>
  );
}
