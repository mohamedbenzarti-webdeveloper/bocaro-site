import "./globals.css";
import { Poppins, Playfair_Display, Tajawal } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";
import RevealOnScroll from "../components/RevealOnScroll";
import { LanguageProvider } from "../context/LanguageContext";
import { SITE_URL, SITE_NAME, ENTREPRISE } from "../lib/site";
import { getDict } from "../lib/translations";
import { getLocaleServeur } from "../lib/locale-server";

// Polices auto-hébergées par Next.js (plus de requête bloquante vers
// Google Fonts) : chaque police est exposée en variable CSS, utilisée par
// globals.css et tailwind.config.js. Seules les graisses employées sont
// chargées.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-tajawal",
  // Utilisée seulement en arabe : pas de préchargement pour les autres.
  preload: false,
});

const DESCRIPTION =
  "BOCARO, société tunisienne fondée en 2006, fabrique et vend des carreaux céramiques et de la faïence 100% faits main. Livraison dans le monde entier depuis Soukra, Tunis.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BOCARO | Carreaux Céramiques Tunisiens Faits Main",
    template: "%s | BOCARO",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "carreaux céramique",
    "faïence tunisienne",
    "carreau ciment",
    "terre cuite",
    "mosaïque",
    "carrelage fait main",
    "Tunisie",
    "Soukra",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_TN",
    title: "BOCARO | Carreaux Céramiques Tunisiens Faits Main",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/images/simulateur/salon.jpg", width: 1536, height: 1024, alt: "Intérieur carrelé BOCARO" }],
  },
  twitter: { card: "summary_large_image" },
};

// Fiche entreprise lisible par les moteurs de recherche (Google : nom,
// adresse, téléphones, réseaux sociaux dans les résultats).
const ORGANISATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: ENTREPRISE.nom,
  description: ENTREPRISE.description,
  url: SITE_URL,
  logo: `${SITE_URL}/images/simulateur/salon.jpg`,
  foundingDate: ENTREPRISE.fondation,
  email: ENTREPRISE.email,
  telephone: ENTREPRISE.telephones,
  address: {
    "@type": "PostalAddress",
    streetAddress: ENTREPRISE.adresse.rue,
    addressLocality: ENTREPRISE.adresse.ville,
    addressCountry: ENTREPRISE.adresse.pays,
  },
  sameAs: ENTREPRISE.reseaux,
};

export default async function RootLayout({ children }) {
  // Langue lue dans le cookie : la page arrive directement dans la bonne
  // langue et le bon sens d'écriture (arabe : droite à gauche).
  const locale = await getLocaleServeur();
  return (
    <html lang={locale} dir={getDict(locale).dir} data-scroll-behavior="smooth" suppressHydrationWarning className={`${poppins.variable} ${playfair.variable} ${tajawal.variable}`}>
      <head>
        {/* Applique le thème avant le premier affichage (évite le flash). */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('bocaro-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANISATION_JSON_LD) }}
        />
      </head>
      <body className="bg-surface text-bocaro-950 antialiased">
        <LanguageProvider initialLocale={locale} dict={getDict(locale)}>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ScrollToTop />
          <RevealOnScroll />
        </LanguageProvider>
      </body>
    </html>
  );
}
