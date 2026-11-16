import Link from "next/link";
import Image from "next/image";
import { lireProduits } from "../lib/supabase/public";
import { lireDerniersPostsInstagram } from "../lib/instagram";
import { getLocaleServeur } from "../lib/locale-server";
import GalerieSlider from "../components/GalerieSlider";
import { anneesExperience } from "../lib/site";
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

// Photos des projets réalisés : pièces du simulateur, en attendant de
// vraies photos de chantiers BOCARO (même ordre que home.projects).
const projectImages = [
  "/images/simulateur/terrasse.jpg",
  "/images/simulateur/salon.jpg",
  "/images/simulateur/chambre.jpg",
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

  // Grande photo du héros : la première photo de la galerie (vraie mise en
  // situation d'un carreau BOCARO) ; la galerie défilante commence alors à
  // la suivante pour ne pas montrer deux fois la même image.
  const photoHeros = galerie[0] ?? null;
  const galerieDefilante = galerie.length > 3 ? galerie.slice(1) : galerie;
  const [projetUne, ...autresProjets] = h.projects;
  const [temoignageUne, ...autresTemoignages] = h.testimonials;

  return (
    <div>
      {/* HÉROS — grand titre serif à gauche, photo en situation à droite
          avec des échantillons de carreaux posés un à un. */}
      <section className="bg-surface">
        <div className="container-app pt-12 pb-16 md:pt-16 md:pb-24 grid lg:grid-cols-12 gap-12 lg:gap-14 items-end">
          <div className="lg:col-span-6">
            <p className="eyebrow eyebrow-start entree">{h.heroOverline}</p>
            <h1
              className="font-serif text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.25rem] xl:text-[5rem] lg:leading-[0.98] text-bocaro-950 mt-7 entree"
              style={{ "--d": "80ms" }}
            >
              {h.heroTitlePrefix}{" "}
              <span className="block">
                {h.heroTitleSuffix && <>{h.heroTitleSuffix} </>}
                <em className="italic text-brand-600">BOCARO</em>
              </span>
            </h1>
            <p className="text-bocaro-600 text-lg leading-relaxed mt-8 max-w-xl entree" style={{ "--d": "160ms" }}>
              {h.heroLead}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-10 entree" style={{ "--d": "240ms" }}>
              <Link href="/produits" className="btn-primary">
                {h.ctaCatalogue}
              </Link>
              <Link href="/contact" className="btn-outline">
                {h.ctaDevis}
              </Link>
              <Link href="/simulateur" className="lien-anime group inline-flex items-center gap-2 font-semibold text-bocaro-950 pb-1">
                {h.finalCtaButton1}
                <Fleche />
              </Link>
            </div>

            {/* Chiffres clés sous un filet */}
            <dl className="flex flex-wrap gap-x-10 gap-y-6 mt-14 pt-6 border-t border-bocaro-200 entree" style={{ "--d": "320ms" }}>
              {h.stats.map((s) => (
                <div key={s.label} className="flex flex-col-reverse gap-1">
                  <dt className="text-xs text-bocaro-600">{s.label}</dt>
                  <dd className="font-serif text-2xl md:text-[1.75rem] leading-tight text-bocaro-950 whitespace-nowrap">{s.value.replace("{annees}", anneesExperience())}</dd>
                </div>
              ))}
            </dl>
          </div>

          <figure className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] overflow-hidden rounded bg-bocaro-100">
              <Image
                src={photoHeros ? photoHeros.src : "/images/simulateur/salon.jpg"}
                alt={photoHeros ? photoHeros.alt : ""}
                fill
                preload
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <Echantillons />
            <figcaption className="mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs text-bocaro-600">
              <span className="uppercase tracking-[0.16em]">{h.heroWallCaption}</span>
              {photoHeros && (
                <Link href={photoHeros.href} className="lien-anime text-bocaro-950 font-medium">
                  {photoHeros.nom}
                </Link>
              )}
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Frise de carreaux : séparateur, comme au-dessus du pied de page */}
      <div aria-hidden="true" className="h-7 bg-[url('/images/carreaux/frise-carreaux.webp')] bg-[length:112px_28px] bg-repeat-x" />

      {/* POURQUOI BOCARO — titre à gauche, engagements en liste à droite */}
      <section className="section-padding bg-surface">
        <div className="container-app grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5 reveal">
            <div className="lg:sticky lg:top-32">
              <span className="eyebrow eyebrow-start">{h.servicesBadge}</span>
              <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] text-bocaro-950 mt-5">
                {h.servicesTitle}
              </h2>
            </div>
          </div>
          <ul className="lg:col-span-7 border-b border-bocaro-200">
            {h.services.map((s, i) => (
              <li
                key={s.title}
                className="group flex gap-6 md:gap-8 py-8 md:py-10 border-t border-bocaro-200 reveal"
                style={{ "--d": `${i * 90}ms` }}
              >
                <Image
                  src={face(["madrid", "tournesol", "venettier"][i % 3])}
                  alt=""
                  width={72}
                  height={72}
                  className="w-14 h-14 md:w-[72px] md:h-[72px] shrink-0 carreau-vivant object-cover"
                />
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl md:text-[1.75rem] leading-tight text-bocaro-950">
                    {s.title}
                  </h3>
                  <p className="text-bocaro-600 leading-relaxed mt-3 max-w-xl">{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PRODUITS POPULAIRES — trois tailles et hauteurs décalées */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app">
          <EnTete
            badge={h.popularBadge}
            titre={h.popularTitle}
            texte={h.popularLead}
            lien={{ href: "/produits", label: h.popularCta }}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-x-6 lg:gap-x-8 gap-y-12 items-start">
            {featuredProducts.slice(0, 3).map((p, i) => {
              const nomAffiche = localizeProductField(p, "nom", locale);
              const placement = [
                "sm:col-span-2 lg:col-span-5",
                "lg:col-span-4 lg:mt-28",
                "lg:col-span-3 lg:mt-12",
              ][i];
              return (
                <Link
                  key={p.id}
                  href={`/produits/${p.id}`}
                  className={`group block reveal ${placement}`}
                  style={{ "--d": `${i * 90}ms` }}
                >
                  <div className={`relative overflow-hidden rounded bg-bocaro-100 ${i === 0 ? "aspect-[4/3] lg:aspect-[4/5]" : "aspect-square"}`}>
                    {p.images?.[0] ? (
                      <Image
                        src={p.images[0]}
                        alt={nomAffiche}
                        fill
                        sizes={i === 0 ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 30vw, 50vw"}
                        className="object-cover zoom-photo"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-bocaro-500 text-sm">
                        {t.catalogue.noImage ?? "Photo à venir"}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 mt-5">
                    {translateFixedField(productTypeTranslations, p.type, locale)}
                  </p>
                  <h3 className={`font-serif leading-tight text-bocaro-950 mt-1.5 ${i === 0 ? "text-3xl" : "text-2xl"}`}>
                    {nomAffiche}
                  </h3>
                  <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-bocaro-200 text-sm">
                    <span className="text-bocaro-950 font-medium whitespace-nowrap">
                      {p.prix ? `${p.prix} ${t.catalogue.unit}` : t.catalogue.priceOnQuote}
                    </span>
                    <span className="text-bocaro-600 group-hover:text-brand-600 transition-colors">
                      <Fleche />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {featuredProducts.length === 0 && (
            <p className="text-bocaro-500 text-sm">{t.catalogue.noResults}</p>
          )}
        </div>
      </section>

      {/* GALERIE — bande olive pleine largeur, carrousel inchangé */}
      {galerieDefilante.length > 0 && (
        <section className="section-padding bg-bocaro-950 text-white overflow-hidden">
          <div className="container-app">
            <div className="grid lg:grid-cols-12 gap-6 items-end mb-10 reveal">
              <div className="lg:col-span-7">
                <span className="eyebrow eyebrow-start !text-brand-300">{h.galleryBadge}</span>
                <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-5">{h.galleryTitle}</h2>
              </div>
              <p className="lg:col-span-5 text-bocaro-100/85 leading-relaxed">{h.galleryLead}</p>
            </div>
          </div>
          <GalerieSlider
            photos={galerieDefilante}
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

      {/* PROJETS RÉALISÉS — un projet à la une, les autres en liste */}
      <section className="section-padding bg-surface">
        <div className="container-app">
          <EnTete badge={h.projectsBadge} titre={h.projectsTitle} texte={h.projectsLead} />

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
            {projetUne && (
              <article className="lg:col-span-7 group reveal">
                <div className="relative aspect-[4/3] overflow-hidden rounded bg-bocaro-100">
                  <Image
                    src={projectImages[0]}
                    alt={projetUne.name}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="object-cover zoom-photo"
                  />
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-brand-600 font-semibold mt-6">{projetUne.ville}</p>
                <h3 className="font-serif text-3xl md:text-4xl text-bocaro-950 mt-2">{projetUne.name}</h3>
                <p className="text-bocaro-600 mt-2">{projetUne.surface}</p>
              </article>
            )}
            <ul className="lg:col-span-5 lg:pt-2">
              {autresProjets.map((p, i) => (
                <li
                  key={p.name}
                  className="group flex gap-5 py-6 border-t border-bocaro-200 last:border-b reveal"
                  style={{ "--d": `${(i + 1) * 90}ms` }}
                >
                  <div className="relative w-32 sm:w-40 aspect-[4/3] shrink-0 overflow-hidden rounded bg-bocaro-100">
                    <Image
                      src={projectImages[i + 1]}
                      alt={p.name}
                      fill
                      sizes="160px"
                      className="object-cover zoom-photo"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-brand-600 font-semibold">{p.ville}</p>
                    <h3 className="font-serif text-2xl text-bocaro-950 mt-1.5">{p.name}</h3>
                    <p className="text-sm text-bocaro-600 mt-1">{p.surface}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES — une grande citation, les autres en petit */}
      <section className="section-padding bg-bocaro-50">
        <div className="container-app grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-4 reveal">
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] text-bocaro-950">{h.testimonialsTitle}</h2>
            <p className="text-bocaro-600 mt-4">{h.testimonialsLead}</p>
          </div>
          <div className="lg:col-span-8">
            {temoignageUne && (
              <figure className="reveal">
                <blockquote className="font-serif italic text-2xl md:text-[2.125rem] leading-snug text-bocaro-950">
                  <span aria-hidden="true" className="text-brand-600">« </span>
                  {temoignageUne.citation}
                  <span aria-hidden="true" className="text-brand-600"> »</span>
                </blockquote>
                <Signature tm={temoignageUne} grande />
              </figure>
            )}
            <div className="grid sm:grid-cols-2 gap-x-10 mt-12">
              {autresTemoignages.map((tm, i) => (
                <figure
                  key={tm.nom}
                  className="pt-6 mt-6 sm:mt-0 border-t border-bocaro-300 flex flex-col reveal"
                  style={{ "--d": `${(i + 1) * 90}ms` }}
                >
                  <blockquote className="font-serif text-lg leading-relaxed text-bocaro-900 flex-1">
                    {tm.citation}
                  </blockquote>
                  <Signature tm={tm} />
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INSTAGRAM — mosaïque serrée */}
      {instagramPosts.length > 0 && (
        <section className="section-padding bg-surface">
          <div className="container-app">
            <EnTete
              badge={h.instagramBadge}
              titre={h.instagramTitle}
              texte={h.instagramLead}
              lien={{ href: "https://www.instagram.com/caroantika_officiel/", label: h.instagramCta, externe: true }}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {instagramPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden aspect-square block bg-bocaro-100"
                >
                  <Image
                    src={post.image}
                    alt={post.caption?.slice(0, 100) || "Publication Instagram BOCARO"}
                    fill
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-cover zoom-photo"
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
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* APPEL FINAL — bande lin, titre serif et carreau en regard */}
      <section className="bg-bocaro-100">
        <div className="container-app py-16 md:py-24 grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-7 reveal">
            <h2 className="font-serif text-4xl md:text-[3.25rem] leading-[1.06] text-bocaro-950">
              {h.finalCtaTitle}
            </h2>
            <p className="text-bocaro-600 text-lg leading-relaxed mt-5 max-w-xl">{h.finalCtaText}</p>
            <div className="flex flex-wrap gap-4 mt-9">
              <Link href="/simulateur" className="btn-primary">
                {h.finalCtaButton1}
              </Link>
              <Link href="/contact" className="btn-outline">
                {h.finalCtaButton2}
              </Link>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-5 reveal" style={{ "--d": "120ms" }}>
            <div className="relative aspect-[4/3] overflow-hidden rounded">
              <Image
                src="/images/carreaux/etoile-bleue.webp"
                alt=""
                fill
                sizes="40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// En-tête de section : intitulé, titre et texte à gauche, lien à droite.
function EnTete({ badge, titre, texte, lien }) {
  const classeLien =
    "lien-anime group inline-flex items-center gap-2 font-semibold text-bocaro-950 pb-1 self-start md:self-auto shrink-0";
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16 reveal">
      <div className="max-w-2xl">
        {badge && <span className="eyebrow eyebrow-start">{badge}</span>}
        <h2 className="font-serif text-4xl md:text-5xl leading-[1.08] text-bocaro-950 mt-5">{titre}</h2>
        {texte && <p className="text-bocaro-600 mt-4">{texte}</p>}
      </div>
      {lien &&
        (lien.externe ? (
          <a href={lien.href} target="_blank" rel="noopener noreferrer" className={classeLien}>
            {lien.label}
            <Fleche />
          </a>
        ) : (
          <Link href={lien.href} className={classeLien}>
            {lien.label}
            <Fleche />
          </Link>
        ))}
    </div>
  );
}

// Nom, rôle et étoiles d'un témoignage.
function Signature({ tm, grande = false }) {
  return (
    <figcaption className={`flex items-center justify-between gap-3 ${grande ? "mt-8" : "mt-5"}`}>
      <span>
        <span className="block font-semibold text-bocaro-950 text-sm">{tm.nom}</span>
        <span className="block text-bocaro-600 text-xs mt-0.5">{tm.role}</span>
      </span>
      <span className="flex gap-0.5 text-brand-600" role="img" aria-label="5/5">
        {[...Array(5)].map((_, i) => (
          <svg key={i} viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </span>
    </figcaption>
  );
}

// Flèche des liens : avance au survol, s'inverse en arabe.
function Fleche() {
  return (
    <span
      aria-hidden="true"
      className="inline-block transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
    >
      →
    </span>
  );
}

// Échantillons du héros : quatre vrais carreaux BOCARO posés sur la photo,
// qui se posent un à un au chargement (animation .pose-carreau).
function Echantillons() {
  const poses = ["madrid", "tournesol", "venettier", "decor-floral"];
  return (
    <div
      aria-hidden="true"
      className="absolute bottom-14 -start-3 sm:-start-4 lg:-start-10 grid grid-cols-2 gap-1 p-1 bg-surface"
    >
      {poses.map((nom, i) => (
        <div key={nom} className="pose-carreau relative w-14 h-14 sm:w-20 sm:h-20" style={{ "--i": i + 2 }}>
          <Image src={face(nom)} alt="" fill sizes="80px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}
