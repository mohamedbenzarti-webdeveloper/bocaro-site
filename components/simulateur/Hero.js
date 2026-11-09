"use client";

export default function Hero({ texts }) {
  return (
    <section className="relative bg-hero-pattern text-white overflow-hidden">
      <div className="container-app relative py-24 md:py-32 text-center max-w-2xl mx-auto">
        <span className="eyebrow !text-brand-300">
          {texts.badge}
        </span>
        <h1 className="font-serif text-4xl md:text-6xl font-bold mt-4 leading-tight">
          {texts.title}
        </h1>
        <p className="text-bocaro-100 mt-6 text-lg leading-relaxed">
          {texts.subtitle}
        </p>
      </div>
    </section>
  );
}
