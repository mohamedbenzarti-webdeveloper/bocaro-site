import { defineConfig, transformWithOxc } from "vite";

// Tests unitaires et de composants (npm test).
// - Logique serveur et données : environnement Node (par défaut).
// - Composants React : navigateur simulé, activé en tête de fichier par
//   le commentaire `// @vitest-environment jsdom`.
// Les tests de bout en bout dans un vrai Chrome sont dans tests/e2e
// (npm run test:e2e, avec le serveur lancé).

// Le projet écrit son JSX dans des fichiers .js (convention Next.js) :
// Vite les lirait comme du JavaScript pur. Ce plugin les transforme en
// déclarant le langage JSX (runtime automatique de React).
const jsxDansLesFichiersJs = {
  name: "bocaro:jsx-dans-js",
  enforce: "pre",
  async transform(code, id) {
    const fichier = id.split("?")[0];
    if (!fichier.endsWith(".js") || fichier.includes("node_modules")) return null;
    const resultat = await transformWithOxc(code, fichier, {
      lang: "jsx",
      jsx: { runtime: "automatic", development: false },
    });
    return { code: resultat.code, map: resultat.map };
  },
};

export default defineConfig({
  plugins: [jsxDansLesFichiersJs],
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.js"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    setupFiles: ["./tests/setup.js"],
    restoreMocks: true,
    // npm run test:couverture → rapport dans coverage/ (non versionné).
    coverage: {
      provider: "v8",
      include: ["app/**/*.js", "components/**/*.js", "context/**/*.js", "lib/**/*.js", "proxy.js"],
      exclude: ["**/__tests__/**"],
      reporter: ["text-summary", "text", "html"],
    },
    // Variables publiques lues à l'import de certains modules.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://projet-test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "cle-anon-test",
      NEXT_PUBLIC_SITE_URL: "https://www.bocaro.test",
    },
  },
});
