import Link from "next/link";
import { MISE_A_JOUR } from "../lib/legal";

const FORMAT_DATE = { fr: "fr-FR", en: "en-GB", ar: "ar-TN" };

// Mise en page commune aux pages Politique de confidentialité et Mentions
// légales : en-tête ivoire, puis une colonne de lecture par section.
export default function PageLegale({ contenu, locale }) {
  const date = new Intl.DateTimeFormat(FORMAT_DATE[locale] ?? "fr-FR", { dateStyle: "long" }).format(new Date(MISE_A_JOUR));
  return (
    <div>
      <section className="bg-surface border-b border-bocaro-200">
        <div className="container-app pt-12 pb-10 md:pt-20 md:pb-14 max-w-3xl">
          <h1 className="font-serif text-[2.5rem] leading-[1.05] md:text-6xl text-bocaro-950">{contenu.titre}</h1>
          <p className="text-bocaro-600 text-lg leading-relaxed mt-6">{contenu.intro}</p>
          <p className="text-sm text-bocaro-600 mt-6">
            {contenu.majLabel} : <time dateTime={MISE_A_JOUR}>{date}</time>
          </p>
        </div>
      </section>

      <div className="bg-surface">
        <div className="container-app max-w-3xl py-12 md:py-16">
          {contenu.sections.map((s) => (
            <section key={s.titre} className="py-8 border-t border-bocaro-200 first:border-t-0 first:pt-0">
              <h2 className="font-serif text-2xl md:text-3xl leading-tight text-bocaro-950">{s.titre}</h2>
              <div className="mt-4 space-y-3 text-bocaro-700 leading-relaxed">
                {s.texte?.map((p) => (
                  <p key={p} className="[overflow-wrap:anywhere]">{p}</p>
                ))}
                {s.liste && (
                  <ul className="space-y-2 ps-5 list-disc marker:text-brand-600">
                    {s.liste.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                )}
                {s.lien && (
                  <p>
                    <Link href={s.lien.href} className="lien-anime font-semibold text-bocaro-950 hover:text-brand-600 pb-0.5">
                      {s.lien.libelle}
                    </Link>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
