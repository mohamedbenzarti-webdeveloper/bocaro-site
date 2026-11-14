/** @type {import('next').NextConfig} */

// En-têtes de sécurité envoyés avec TOUTES les réponses (pages, API,
// images, fichiers). La politique de sécurité du contenu (CSP), propre à
// chaque page, est ajoutée par proxy.js (voir lib/securite.js).
const ENTETES_SECURITE = [
  // Le navigateur ne devine pas le type d'un fichier (un fichier envoyé
  // ne peut pas être exécuté comme script).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Les autres sites ne reçoivent que l'adresse du site, pas la page visitée.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Ancien équivalent de frame-ancestors 'none' (anciens navigateurs).
  { key: "X-Frame-Options", value: "DENY" },
  // Fonctions de l'appareil inutiles au site : refusées, même à un script.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  // Isole la fenêtre du site des fenêtres ouvertes par d'autres sites.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // En production (https) : le navigateur n'utilise plus que https pendant
  // 2 ans. Pas en développement (http sur le Wi-Fi pour le téléphone).
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  // Ne révèle pas la technologie du serveur (en-tête X-Powered-By).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: ENTETES_SECURITE }];
  },
  allowedDevOrigins: ["192.168.*.*"],
  images: {
    // Sources externes autorisées pour l'optimisation next/image
    // (redimensionnement + WebP/AVIF à la taille réellement affichée).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  async redirects() {
    return [
      {
        source: "/catalogue",
        destination: "/produits",
        permanent: true,
      },
      {
        source: "/catalogue/:id",
        destination: "/produits/:id",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
