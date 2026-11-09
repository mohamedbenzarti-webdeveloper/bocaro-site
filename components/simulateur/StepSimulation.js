"use client";

import { useMemo } from "react";
import CanvasCompare from "./CanvasCompare";
import TileInfoPanel from "./TileInfoPanel";
import { formatActif, parseFormat, reglagesPourRendu } from "../../lib/simulateur/tileSize";

const COULEURS_JOINT = ["#ffffff", "#e4dccd", "#8a8378", "#2b2b2b"];

export default function StepSimulation({
  room,
  surfaces,
  produit,
  locale,
  uniteLabel,
  reglages,
  onChangeReglages,
  onReset,
  texts,
  onChangerProduit,
  onChangerPiece,
  onVoirResultat,
  onError,
}) {
  const { rotation, jointWidth, jointColor } = reglages;
  const formatsDispo = (produit?.dimensions ?? []).filter((f) => parseFormat(f));
  const formatCourant = formatActif(produit, reglages.format);
  const reglagesRendu = useMemo(
    () => reglagesPourRendu(produit, reglages),
    [produit, reglages]
  );

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-bocaro-950 text-center mb-2">
        {texts.title}
      </h2>
      <p className="text-bocaro-600 text-center max-w-lg mx-auto mb-8">
        {texts.subtitle}
      </p>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        {/* VISUALISATION */}
        <div className="lg:col-span-3 space-y-3">
          <CanvasCompare
            room={room}
            surfaces={surfaces}
            tileSrc={produit?.images?.[0]}
            reglages={reglagesRendu}
            onError={onError}
            fadeKey={`${room.id}-${surfaces[0]?.type}-${produit?.id ?? "none"}`}
            labels={{
              before: texts.before,
              after: texts.after,
              beforeAlt: texts.beforeAlt,
              sliderAriaLabel: texts.sliderAriaLabel,
            }}
          />
          {/* Invitation à faire glisser la poignée : bien visible, avec une
              flèche double qui oscille de gauche à droite. */}
          <p className="flex justify-center">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-brand-50 border border-brand-200 px-4 py-2 text-sm sm:text-base font-semibold text-brand-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-5 h-5 shrink-0 animate-[glisser_1.6s_ease-in-out_infinite] motion-reduce:animate-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M3 12h18" />
              </svg>
              {texts.dragHint}
            </span>
          </p>
        </div>

        {/* PANNEAU */}
        <div className="lg:col-span-2 space-y-5">
          <TileInfoPanel
            produit={produit}
            locale={locale}
            uniteLabel={uniteLabel}
            labels={{ format: texts.formatLabel, colours: texts.coloursLabel }}
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onChangerProduit}
              className="btn-outline justify-center text-sm py-2.5"
            >
              {texts.changeProductButton}
            </button>
            <button
              type="button"
              onClick={onChangerPiece}
              className="btn-outline justify-center text-sm py-2.5"
            >
              {texts.changeRoomButton}
            </button>
          </div>

          <div className="bg-surface rounded-2xl border border-bocaro-100 p-5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-bocaro-900">
                {texts.controlsTitle}
              </h3>
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-medium text-bocaro-500 hover:text-bocaro-900 underline underline-offset-4 transition-colors"
              >
                {texts.resetButton}
              </button>
            </div>

            {formatsDispo.length > 0 && (
              <div>
                <span className="block text-xs font-medium text-bocaro-600 mb-2">
                  {texts.formatLabel}
                </span>
                <div className="flex flex-wrap gap-2">
                  {formatsDispo.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onChangeReglages({ format: f })}
                      aria-pressed={formatCourant === f}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        formatCourant === f
                          ? "bg-bocaro-900 text-white border-bocaro-900"
                          : "bg-surface text-bocaro-700 border-bocaro-200 hover:border-bocaro-400"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="block text-xs font-medium text-bocaro-600 mb-2">
                {texts.rotationLabel}
              </span>
              <div className="flex gap-2">
                {[0, 90].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => onChangeReglages({ rotation: deg })}
                    aria-pressed={rotation === deg}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      rotation === deg
                        ? "bg-bocaro-900 text-white border-bocaro-900"
                        : "bg-surface text-bocaro-700 border-bocaro-200 hover:border-bocaro-400"
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="sim-joint"
                className="flex justify-between text-xs font-medium text-bocaro-600 mb-1.5"
              >
                <span>{texts.jointWidthLabel}</span>
                <span>{jointWidth} mm</span>
              </label>
              <input
                id="sim-joint"
                type="range"
                min="0"
                max="10"
                step="1"
                value={jointWidth}
                onChange={(e) =>
                  onChangeReglages({ jointWidth: Number(e.target.value) })
                }
                className="w-full accent-bocaro-700"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-bocaro-600 mb-2">
                {texts.jointColorLabel}
              </span>
              <div className="flex gap-2.5">
                {COULEURS_JOINT.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChangeReglages({ jointColor: c })}
                    aria-label={`${texts.jointColorLabel} ${c}`}
                    aria-pressed={jointColor === c}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      jointColor === c
                        ? "border-bocaro-700 ring-2 ring-bocaro-300 scale-110"
                        : "border-white ring-1 ring-bocaro-200 hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onVoirResultat}
            className="btn-primary w-full justify-center"
          >
            {texts.seeResultButton}
          </button>
        </div>
      </div>
    </div>
  );
}
