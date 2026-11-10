import Image from "next/image";
import { getDict } from "../../lib/translations";
import { getLocaleServeur } from "../../lib/locale-server";

// Page rendue par le serveur (contenu statique, langue lue dans le cookie).
// Mise en page de lecture longue : titre, grande photo, histoire en colonne
// de lecture, valeurs en liste à filets, repères de l'entreprise.
export default async function AProposPage() {
  const a = getDict(await getLocaleServeur()).about;

  const reperes = [
    { label: a.foundedLabel, valeur: a.foundedYear },
    { label: a.countryLabel, valeur: a.country },
    { label: a.addressLabel, valeur: a.address },
  ];

  return (
    <div>
      {/* EN-TÊTE — titre à gauche, présentation à droite */}
      <section className="bg-surface">
        <div className="container-app pt-12 pb-10 md:pt-20 md:pb-14 grid lg:grid-cols-12 gap-6 lg:gap-14 items-end">
          <div className="lg:col-span-7">
            <span className="eyebrow eyebrow-start entree">{a.badge}</span>
            <h1
              className="font-serif text-[2.75rem] leading-[1.04] md:text-6xl lg:text-7xl text-bocaro-950 mt-5 entree"
              style={{ "--d": "80ms" }}
            >
              {a.title}
            </h1>
          </div>
          <p className="lg:col-span-5 text-bocaro-600 text-lg leading-relaxed entree" style={{ "--d": "160ms" }}>
            {a.lead}
          </p>
        </div>
      </section>

      {/* GRANDE PHOTO */}
      <div className="container-app">
        <div className="relative aspect-[4/3] md:aspect-[21/9] overflow-hidden rounded bg-bocaro-100">
          <Image
            src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80"
            alt="Atelier de fabrication de faïence BOCARO"
            fill
            preload
            sizes="(min-width: 1280px) 1240px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* HISTOIRE — titre à gauche, colonne de lecture à droite */}
      <section className="section-padding bg-surface">
        <div className="container-app grid lg:grid-cols-12 gap-8 lg:gap-14">
          <div className="lg:col-span-5 reveal">
            <div className="lg:sticky lg:top-32">
              <span className="eyebrow eyebrow-start">{a.historyBadge}</span>
              <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] text-bocaro-950 mt-5">
                {a.historyTitle}
              </h2>
            </div>
          </div>
          <div className="lg:col-span-7 max-w-2xl space-y-5 text-lg leading-relaxed text-bocaro-700 reveal">
            <p className="font-serif text-2xl md:text-[1.75rem] leading-snug text-bocaro-950">{a.p1}</p>
            <p>{a.p2}</p>
            <p>{a.p3}</p>
          </div>
        </div>
      </section>

      {/* VALEURS — liste à filets sur deux colonnes */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app">
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] text-bocaro-950 mb-12 md:mb-16 max-w-2xl reveal">
            {a.valuesTitle}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-x-14">
            {a.values.map((v, i) => (
              <li
                key={v.title}
                className="py-8 border-t border-bocaro-300 reveal"
                style={{ "--d": `${(i % 2) * 90}ms` }}
              >
                <h3 className="font-serif text-2xl md:text-[1.75rem] leading-tight text-bocaro-950">{v.title}</h3>
                <p className="text-bocaro-600 leading-relaxed mt-3 max-w-md">{v.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* REPÈRES — fondation, pays, adresse */}
      <section className="bg-bocaro-100">
        <dl className="container-app py-14 md:py-16 grid sm:grid-cols-3 gap-y-8">
          {reperes.map((r) => (
            <div key={r.label} className="sm:px-8 first:ps-0 sm:border-s first:border-s-0 border-bocaro-300">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{r.label}</dt>
              <dd className="font-serif text-2xl md:text-3xl leading-tight text-bocaro-950 mt-3">{r.valeur}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
