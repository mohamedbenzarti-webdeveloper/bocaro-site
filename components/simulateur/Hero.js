"use client";

// En-tête court du simulateur, sur fond lin : titre à gauche, présentation
// à droite (plus de bandeau à motif). L'outil reste au premier plan.
export default function Hero({ texts }) {
  return (
    <section className="bg-bocaro-100 border-b border-bocaro-200">
      <div className="container-app pt-12 pb-10 md:pt-16 md:pb-14 grid lg:grid-cols-12 gap-6 lg:gap-14 items-end">
        <div className="lg:col-span-7">
          <span className="eyebrow eyebrow-start entree">{texts.badge}</span>
          <h1
            className="font-serif text-[2.75rem] leading-[1.04] md:text-6xl text-bocaro-950 mt-5 entree"
            style={{ "--d": "80ms" }}
          >
            {texts.title}
          </h1>
        </div>
        <p className="lg:col-span-5 text-bocaro-600 text-lg leading-relaxed entree" style={{ "--d": "160ms" }}>
          {texts.subtitle}
        </p>
      </div>
    </section>
  );
}
