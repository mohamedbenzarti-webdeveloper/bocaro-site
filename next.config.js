/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
