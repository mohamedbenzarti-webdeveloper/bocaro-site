import Link from "next/link";
import Image from "next/image";
import { lireProduits } from "../lib/supabase/public";
import { lireDerniersPostsInstagram } from "../lib/instagram";
import { getLocaleServeur } from "../lib/locale-server";
import GalerieSlider from "../components/GalerieSlider";
// Photos de carreaux BOCARO (faces recadrées dans public/images/carreaux).
const face = (nom) => `/images/carreaux/${nom}-carreau.webp`;
import {
  getDict,
  translateFixedField,
  localizeProductField,
  productTypeTranslations,
} from "../lib/translations";

// Page rendue par le serveur : le HTML arrive complet (texte, produits,
// Instagram), sans attendre le JavaScript du navigateur — affichage
// beaucoup plus rapide sur mobile.

const projectImages = [
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=80",
  "/images/simulateur/salle-de-bain.jpg",
  "https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=700&q=80",
];

export default async function HomePage() {
  const locale = await getLocaleServeur();
  const t = getDict(locale);
  const h = t.home;

  const [{ data: produits, error }, { posts: instagramPosts }] = await Promise.all([
    // Tous les produits (catalogue de quelques dizaines) : 4 pour
    // « Produits populaires », les autres alimentent la galerie.
    lireProduits(),
    lireDerniersPostsInstagram(),
  ]);
  if (error) console.error("Erreur de chargement des produits populaires :", error.message);
  const featuredProducts = (produits ?? []).slice(0, 4);

  // Galerie : la 2e photo des produits qui en ont plusieurs (souvent une
  // mise en situation), puis la photo unique des autres ; 8 au maximum.
  const avecPhotos = (produits ?? []).filter((p) => p.images?.length);
  const galerie = [
    ...avecPhotos.filter((p) => p.images.length > 1),
    ...avecPhotos.filter((p) => p.images.length === 1),
  ]
    .slice(0, 8)
    .map((p) => {
      const nom = localizeProductField(p, "nom", locale);
      return {
        src: p.images.length > 1 ? p.images[1] : p.images[0],
        alt: nom,
        nom,
        type: translateFixedField(productTypeTranslations, p.type, locale),
        href: `/produits/${p.id}`,
      };
    });

  return (
    <div>
      {/* HERO — texte + mur de carreaux peints (motifs SVG de la marque) */}
      <section className="relative overflow-hidden bg-hero-pattern text-white">
        <div className="container-app relative section-padding grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
          <div>
            <span className="eyebrow eyebrow-start !text-brand-300 mb-6 entree">{h.heroOverline}</span>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] mt-6 mb-4 entree" style={{ "--d": "80ms" }}>
              {h.heroTitlePrefix}
            </h1>
            {/* Nom de la société mis en valeur */}
            <div className="flex items-baseline gap-3 mb-7">
              {h.heroTitleSuffix && (
                <span className="text-2xl md:text-3xl text-bocaro-100 font-medium">
                  {h.heroTitleSuffix}
                </span>
              )}
              <span className="font-serif text-5xl md:text-6xl lg:text-7xl font-black text-brand-300 tracking-tight">
                BOCARO
              </span>
            </div>
            <p className="text-bocaro-100/90 text-lg leading-relaxed mb-9 max-w-lg">
              {h.heroLead}
            </p>
            <div className="flex flex-wrap gap-4 entree" style={{ "--d": "220ms" }}>
              <Link href="/produits" className="btn-primary">
                {h.ctaCatalogue}
              </Link>
              <Link href="/contact" className="btn-outline !border-white/70 !text-white hover:!bg-white hover:!text-[#26231d]">
                {h.ctaDevis}
              </Link>
            </div>
          </div>

          <MurDeCarreaux legende={h.heroWallCaption} />
        </div>
      </section>

      {/* CHIFFRES CLÉS — grille séparée par des « joints » */}
      <section className="bg-surface border-b border-bocaro-100">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-bocaro-100 border-x border-bocaro-100">
            {h.stats.map((s, i) => (
              <div key={s.label} className="text-center py-8 md:py-10 px-3 reveal" style={{ "--d": `${i * 80}ms` }}>
                <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-bocaro-950">
                  {s.value}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-brand-600 font-semibold mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="eyebrow">{h.servicesBadge}</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bocaro-950 mt-4">
              {h.servicesTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {h.services.map((s, i) => (
              <div
                key={s.title}
                className="group bg-surface rounded-lg p-8 card-hover border border-bocaro-100 reveal"
                style={{ "--d": `${i * 90}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <Image
                    src={face(["madrid", "tournesol", "venettier"][i % 3])}
                    alt=""
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-sm shadow-sm ring-1 ring-black/5 shrink-0 carreau-vivant object-cover"
                  />
                  <span className="font-serif text-3xl text-bocaro-200 font-bold">0{i + 1}</span>
                </div>
                <h3 className="font-serif text-xl font-bold text-bocaro-950 mb-3">
                  {s.title}
                </h3>
                <p className="text-bocaro-600 text-sm leading-relaxed">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUITS POPULAIRES */}
      <section className="section-padding bg-surface">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="eyebrow">
              {h.popularBadge}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bocaro-950 mt-3 mb-3">
              {h.popularTitle}
            </h2>
            <p className="text-bocaro-600">{h.popularLead}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.slice(0, 3).map((p, i) => {
              const nomAffiche = localizeProductField(p, "nom", locale);
              return (
                <Link
                  key={p.id}
                  href={`/produits/${p.id}`}
                  className="group rounded-lg overflow-hidden bg-surface border border-bocaro-100 card-hover block reveal"
                  style={{ "--d": `${i * 90}ms` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-bocaro-50">
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={nomAffiche}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-bocaro-300 text-sm">
                        {t.catalogue.noImage ?? "Photo à venir"}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex items-end justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                        {translateFixedField(productTypeTranslations, p.type, locale)}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-bocaro-950 mt-1.5">
                        {nomAffiche}
                      </h3>
                    </div>
                    <p className="text-bocaro-950 text-sm font-semibold whitespace-nowrap">
                      {p.prix ? `${p.prix} ${t.catalogue.unit}` : t.catalogue.priceOnQuote}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {featuredProducts.length === 0 && (
            <p className="text-center text-bocaro-400 text-sm">
              {t.catalogue.noResults}
            </p>
          )}

          <div className="text-center mt-12">
            <Link
              href="/produits"
              className="inline-flex items-center justify-center rounded-md border border-bocaro-200 h-11 px-8 font-medium text-bocaro-900 hover:bg-bocaro-50 transition-colors"
            >
              {h.popularCta}
            </Link>
          </div>
        </div>
      </section>

      {/* GALERIE — carrousel de photos de nos carreaux */}
      {galerie.length > 0 && (
        <section className="section-padding bg-hero-pattern text-white overflow-hidden">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-8 reveal">
              <span className="eyebrow !text-brand-300">{h.galleryBadge}</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mt-4 mb-3">{h.galleryTitle}</h2>
              <p className="text-bocaro-100/85">{h.galleryLead}</p>
            </div>
          </div>
          <GalerieSlider
            photos={galerie}
            textes={{
              label: h.galleryLabel,
              cta: h.galleryCta,
              prev: h.galleryPrev,
              next: h.galleryNext,
              go: h.galleryGo,
            }}
          />
        </section>
      )}

      {/* PROJETS REALISES */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="eyebrow">
              {h.projectsBadge}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bocaro-950 mt-3 mb-3">
              {h.projectsTitle}
            </h2>
            <p className="text-bocaro-600">{h.projectsLead}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {h.projects.map((p, i) => (
              <div key={p.name} className="group relative rounded-lg overflow-hidden aspect-[4/5] bg-bocaro-900 reveal" style={{ "--d": `${i * 90}ms` }}>
                <Image
                  src={projectImages[i]}
                  alt={p.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a15]/90 via-[#1c1a15]/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-brand-300 font-semibold">{p.ville}</p>
                  <h3 className="font-serif text-2xl font-bold mt-1.5">{p.name}</h3>
                  <p className="text-sm text-white/75 mt-2 pt-3 border-t border-white/20">{p.surface}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="section-padding bg-surface">
        <div className="container-app">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bocaro-950 mb-3">
              {h.testimonialsTitle}
            </h2>
            <p className="text-bocaro-600">{h.testimonialsLead}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {h.testimonials.map((tm, i) => (
              <figure
                key={tm.nom}
                className="relative bg-bocaro-50 rounded-lg p-8 pt-12 border border-bocaro-100 flex flex-col reveal"
                style={{ "--d": `${i * 90}ms` }}
              >
                <span aria-hidden="true" className="absolute top-3 start-6 font-serif text-7xl leading-none text-brand-600/25">
                  “
                </span>
                <blockquote className="font-serif text-lg leading-relaxed text-bocaro-900 flex-1">
                  {tm.citation}
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-bocaro-100 flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-semibold text-bocaro-950 text-sm">{tm.nom}</span>
                    <span className="block text-bocaro-500 text-xs mt-0.5">{tm.role}</span>
                  </span>
                  <span className="flex gap-0.5 text-brand-600" role="img" aria-label="5/5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      {instagramPosts.length > 0 && (
        <section className="section-padding bg-surface">
          <div className="container-app">
            <div className="text-center max-w-2xl mx-auto mb-14 reveal">
              <span className="eyebrow">
                {h.instagramBadge}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-bocaro-950 mt-3 mb-3">
                {h.instagramTitle}
              </h2>
              <p className="text-bocaro-600">{h.instagramLead}</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {instagramPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-lg overflow-hidden aspect-square block bg-bocaro-100"
                >
                  <Image
                    src={post.image}
                    alt={post.caption?.slice(0, 100) || "Publication Instagram BOCARO"}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      width="32"
                      height="32"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.8"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center mt-10">
              <a
                href="https://www.instagram.com/caroantika_officiel/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-bocaro-200 h-11 px-8 font-medium text-bocaro-900 hover:bg-bocaro-50 transition-colors"
              >
                {h.instagramCta}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* CTA FINALE */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app">
          <div className="reveal relative overflow-hidden bg-bocaro-950 rounded-xl px-8 py-14 md:px-16 md:py-20 grid md:grid-cols-[1fr_auto] gap-10 items-center">
            <Image
              src="/images/carreaux/etoile-bleue.webp"
              alt=""
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#1c1a15]/95 via-[#1c1a15]/80 to-[#1c1a15]/40 rtl:bg-gradient-to-l" />
            <div className="relative max-w-xl">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                {h.finalCtaTitle}
              </h2>
              <p className="text-bocaro-100/90 leading-relaxed">
                {h.finalCtaText}
              </p>
            </div>
            <div className="relative flex flex-wrap gap-4">
              <Link
                href="/simulateur"
                className="inline-flex items-center justify-center bg-white text-[#873a20] font-bold rounded-md px-7 py-3 hover:bg-[#f5efe4] transition-colors"
              >
                {h.finalCtaButton1}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border-2 border-white/60 text-white font-bold rounded-md px-7 py-3 hover:border-white transition-colors"
              >
                {h.finalCtaButton2}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Mur de carreaux du hero : 3 × 3 vrais carreaux BOCARO (photos), posés
// avec un joint ; ils se posent un à un au chargement.
function MurDeCarreaux({ legende }) {
  // Carreaux du catalogue BOCARO : Madrid aux coins, Décor Floral en haut
  // et en bas, Venettier sur les côtés, Tournesol au centre (cobalt et
  // blanc émaillé, touche d'ocre au cœur).
  const poses = ["madrid", "decor-floral", "madrid", "venettier", "tournesol", "venettier", "madrid", "decor-floral", "madrid"];
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-4 rounded-xl border border-white/10" aria-hidden="true" />
      <div className="relative grid grid-cols-3 gap-[5px] p-[5px] bg-[#e7e0d2] rounded-md shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
        {poses.map((nom, i) => (
          <div key={i} className="pose-carreau relative aspect-square overflow-hidden" style={{ "--i": i }}>
            <Image
              src={face(nom)}
              alt=""
              fill
              priority={i === 4}
              sizes="(min-width: 1024px) 200px, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <p className="relative mt-4 text-xs tracking-[0.18em] uppercase text-bocaro-200/80 text-center">
        {legende}
      </p>
    </div>
  );
}
