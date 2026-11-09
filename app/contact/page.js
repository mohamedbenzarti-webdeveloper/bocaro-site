import { getDict } from "../../lib/translations";
import { getLocaleServeur } from "../../lib/locale-server";
import ContactForm from "../../components/ContactForm";
import MapFacade from "../../components/MapFacade";

// Page rendue par le serveur ; seul le formulaire est un composant client.
export default async function ContactPage() {
  const c = getDict(await getLocaleServeur()).contact;

  const infoCards = [
    {
      title: c.addressTitle,
      lines: [c.address],
      icon: "M12 21c-4.5-4-7-7.5-7-11a7 7 0 1114 0c0 3.5-2.5 7-7 11z M12 13a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    },
    {
      title: c.emailTitle,
      lines: ["bocaro_tunisia@yahoo.com"],
      link: "mailto:bocaro_tunisia@yahoo.com",
      icon: "M3 6h18v12H3z M3 6l9 7 9-7",
    },
    {
      title: c.whatsappTitle,
      lines: ["+216 98 514 014"],
      link: "https://wa.me/21698514014",
      icon: "M12 3a9 9 0 00-7.5 13.9L3 21l4.2-1.4A9 9 0 1012 3z",
    },
    {
      title: c.whatsappTitle2,
      lines: ["+216 22 447 900"],
      link: "https://wa.me/21622447900",
      icon: "M12 3a9 9 0 00-7.5 13.9L3 21l4.2-1.4A9 9 0 1012 3z",
    },
    {
      title: c.hoursTitle,
      lines: [c.hours1, c.hours2],
      icon: "M12 8v4l3 3 M12 21a9 9 0 100-18 9 9 0 000 18z",
    },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="bg-hero-pattern text-white section-padding">
        <div className="container-app text-center max-w-2xl mx-auto">
          <span className="eyebrow !text-brand-300">
            {c.badge}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-bold mt-3">
            {c.title}
          </h1>
          <p className="text-bocaro-100 mt-5">{c.lead}</p>
        </div>
      </section>

      <section className="section-padding bg-surface">
        <div className="container-app grid lg:grid-cols-5 gap-12">
          {/* INFOS */}
          <div className="lg:col-span-2 space-y-6">
            {infoCards.map((card) => (
              <InfoCard key={card.title} {...card} />
            ))}

            <div className="flex gap-3 pt-2">
              <a
                href="https://www.facebook.com/CAROANTIKA"
                className="w-11 h-11 rounded-full bg-bocaro-700 flex items-center justify-center hover:bg-bocaro-900 transition-colors"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/caroantika_officiel/"
                className="w-11 h-11 rounded-full bg-bocaro-700 flex items-center justify-center hover:bg-bocaro-900 transition-colors"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 01-1.15 1.77 4.9 4.9 0 01-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 01-1.77-1.15 4.9 4.9 0 01-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 015.45.53C6.09.28 6.82.11 7.88.06 8.94.01 9.28 0 12 0zm0 5a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-8.4a1.17 1.17 0 100-2.34 1.17 1.17 0 000 2.34z" />
                </svg>
              </a>
            </div>
          </div>

          {/* FORMULAIRE */}
          <div className="lg:col-span-3">
            <div className="bg-bocaro-50 rounded-lg p-8 md:p-10 border border-bocaro-100">
              <h2 className="font-serif text-2xl font-bold text-bocaro-950 mb-2">
                {c.formTitle}
              </h2>
              <p className="text-bocaro-600 text-sm mb-8">{c.formLead}</p>

              <ContactForm c={c} />
            </div>
          </div>
        </div>
      </section>

      {/* CARTE */}
      <section className="pb-16">
        <div className="container-app">
          <div className="rounded-lg overflow-hidden h-80 border border-bocaro-100">
            <MapFacade
              titre={c.mapTitle}
              adresse={c.address}
              libelleAfficher={c.mapShow}
              libelleOuvrir={c.mapOpen}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, lines, icon, link }) {
  const content = (
    <div className="flex gap-4 p-5 rounded-lg border border-bocaro-100 hover:border-bocaro-300 transition-colors">
      <div className="w-12 h-12 shrink-0 rounded-xl bg-bocaro-700 flex items-center justify-center">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="1.8">
          <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="min-w-0">
        <h2 className="font-semibold text-bocaro-950">{title}</h2>
        {lines.map((l) => (
          <p key={l} className="text-sm text-bocaro-600 [overflow-wrap:anywhere]">
            {l}
          </p>
        ))}
      </div>
    </div>
  );

  return link ? (
    <a href={link} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  ) : (
    content
  );
}
