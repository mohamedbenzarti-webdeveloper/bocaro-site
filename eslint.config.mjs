import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

// Règles recommandées par Next.js (React, hooks, performances web).
// Lancer : npm run lint (aussi exécuté par la CI, .github/workflows/ci.yml).
export default defineConfig([
  ...nextVitals,
  {
    // <img> voulu ici, <Image> de Next.js ne convient pas :
    // - simulateur : images lues par le canvas (pixels, CORS) et photos de
    //   pièces de taille fixe ;
    // - dashboard : aperçus blob: des photos pas encore envoyées, vignettes
    //   de 48 px réservées à l'administrateur.
    files: ["components/simulateur/**", "components/admin/**", "app/dashboard/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);
