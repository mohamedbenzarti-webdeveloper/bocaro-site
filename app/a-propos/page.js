import Image from "next/image";
import { getDict } from "../../lib/translations";
import { getLocaleServeur } from "../../lib/locale-server";

// Page rendue par le serveur (contenu statique, langue lue dans le cookie).
export default async function AProposPage() {
  const a = getDict(await getLocaleServeur()).about;

  return (
    <div>
      {/* HERO */}
      <section className="bg-hero-pattern text-white section-padding">
        <div className="container-app text-center max-w-2xl mx-auto">
          <span className="eyebrow !text-brand-300">
            {a.badge}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-3">
            {a.title}
          </h1>
          <p className="text-bocaro-100 mt-5">{a.lead}</p>
        </div>
      </section>

      {/* HISTOIRE */}
      <section className="section-padding bg-surface">
        <div className="container-app grid md:grid-cols-2 gap-14 items-center">
          <div className="relative rounded-lg overflow-hidden h-80 md:h-[26rem]">
            <Image
              src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80"
              alt="Atelier de fabrication de faïence BOCARO"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <span className="eyebrow">
              {a.historyBadge}
            </span>
            <h2 className="font-serif text-3xl font-bold text-bocaro-950 mt-3 mb-5">
              {a.historyTitle}
            </h2>
            <p className="text-bocaro-600 leading-relaxed mb-4">{a.p1}</p>
            <p className="text-bocaro-600 leading-relaxed mb-4">{a.p2}</p>
            <p className="text-bocaro-600 leading-relaxed">{a.p3}</p>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app">
          <div className="text-center max-w-xl mx-auto mb-14 reveal">
            <h2 className="font-serif text-3xl font-bold text-bocaro-950">
              {a.valuesTitle}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {a.values.map((v) => (
              <div
                key={v.title}
                className="bg-surface p-6 rounded-lg border border-bocaro-100 card-hover reveal"
              >
                <h3 className="font-serif font-bold text-bocaro-900 mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-bocaro-600 leading-relaxed">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCALISATION */}
      <section className="section-padding bg-bocaro-900 text-white">
        <div className="container-app grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="font-serif text-xl font-bold mb-2">{a.countryLabel}</h3>
            <p className="text-bocaro-200">{a.country}</p>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold mb-2">{a.addressLabel}</h3>
            <p className="text-bocaro-200">{a.address}</p>
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold mb-2">{a.foundedLabel}</h3>
            <p className="text-bocaro-200">{a.foundedYear}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
