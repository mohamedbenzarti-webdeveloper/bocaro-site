"use client";

export default function Stepper({ steps, current, plusHaut, onNavigate }) {
  return (
    <div className="flex items-start justify-center gap-1 sm:gap-3 max-w-3xl mx-auto">
      {steps.map((label, index) => {
        const numero = index + 1;
        const estActif = numero === current;
        const estComplete = numero < current || numero <= plusHaut;
        const cliquable = numero <= plusHaut;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => cliquable && onNavigate(numero)}
              disabled={!cliquable}
              className={`flex flex-col items-center gap-2 group ${
                cliquable ? "cursor-pointer" : "cursor-default"
              }`}
              aria-current={estActif ? "step" : undefined}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  estActif
                    ? "bg-bocaro-900 border-bocaro-900 text-white scale-110 shadow-md"
                    : estComplete
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "bg-surface border-bocaro-200 text-bocaro-400"
                }`}
              >
                {estComplete && !estActif ? (
                  <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
                    <path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.9 3.9 6.7-6.7a1 1 0 011.4 0z" />
                  </svg>
                ) : (
                  String(numero).padStart(2, "0")
                )}
              </span>
              <span
                className={`text-xs font-medium text-center leading-tight max-w-[80px] ${
                  estActif ? "text-bocaro-950" : "text-bocaro-500"
                }`}
              >
                {label}
              </span>
            </button>

            {numero < steps.length && (
              <div
                className={`h-0.5 flex-1 mx-1 sm:mx-2 mt-5 rounded-full transition-colors ${
                  numero < current ? "bg-brand-500" : "bg-bocaro-100"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
