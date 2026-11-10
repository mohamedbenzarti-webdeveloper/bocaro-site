/** @type {import('tailwindcss').Config} */

// Direction artistique « artisanat méditerranéen » : ivoire, lin, sable,
// encre, terre cuite et olive (proposition de refonte validée).
//
// Les noms de classes historiques sont conservés pour ne pas toucher aux
// composants (plus de 300 usages) :
// - "bocaro-*" : les neutres chauds. Fonds clairs lin/sable (50-300),
//   fonds sombres olive (500-950), textes encre, filets sable.
// - "brand-*"  : la terre cuite, couleur des actions principales.
// - "olive-*"  : l'olive, nouvelle échelle (couleurs fixes, sans mode nuit).
//
// Mode nuit : "bocaro" et "brand" passent par des variables CSS (voir
// app/globals.css) qui changent de valeur quand <html> porte la classe
// "dark". Les fonds, textes et bordures ont chacun leur échelle : un même
// "bocaro-950" est un texte presque noir en mode jour, presque blanc en mode
// nuit, tandis qu'un fond "bocaro-950" (pied de page) reste sombre.
const palette = (prefixe) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
      n,
      `rgb(var(--${prefixe}-${n}) / <alpha-value>)`,
    ])
  );

// Ombres : réservées à ce qui flotte au-dessus de la page (menus, listes
// déroulantes, poignée du simulateur). Teinte encre chaude, très diffuse.
const ombre = (y, flou, alpha) => `0 ${y}px ${flou}px -${Math.round(flou / 3)}px rgb(38 35 29 / ${alpha})`;

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Valeurs fixes (dégradés, SVG) — mode jour. Les fonds, textes et
           bordures, eux, suivent le thème via les variables ci-dessous. */
        bocaro: {
          50: "#eee6d8",
          100: "#e6dcc9",
          200: "#d6c7ac",
          300: "#bfae90",
          400: "#9c8e74",
          500: "#6e7756",
          600: "#5c6644",
          700: "#4d5638",
          800: "#434d30",
          900: "#384028",
          950: "#2c3320",
        },
        /* Terre cuite : l'argile et la faïence artisanale. */
        brand: {
          50: "#f9eee6",
          100: "#f3dccd",
          200: "#e8bda3",
          300: "#d99a78",
          400: "#c7744e",
          500: "#b95a35",
          600: "#a9492a",
          700: "#873a20",
          800: "#6c2f1c",
          900: "#562719",
        },
        /* Olive foncé : accents, filtres actifs, bandes sombres. */
        olive: {
          50: "#f1f2ea",
          100: "#e2e5d3",
          200: "#c9ceb0",
          300: "#a7b185",
          400: "#858f63",
          500: "#6b7550",
          600: "#5c6644",
          700: "#4d5638",
          800: "#434d30",
          900: "#384028",
          950: "#2c3320",
        },
        terracotta: {
          400: "#c7744e",
          500: "#b95a35",
        },
      },
      backgroundColor: {
        surface: "rgb(var(--surface) / <alpha-value>)",
        bocaro: palette("bg"),
        brand: palette("bgb"),
      },
      textColor: {
        bocaro: palette("tx"),
        brand: palette("txb"),
      },
      borderColor: {
        bocaro: palette("bd"),
        brand: palette("bdb"),
      },
      divideColor: {
        bocaro: palette("bd"),
      },
      ringColor: {
        bocaro: palette("bd"),
      },
      accentColor: {
        bocaro: palette("tx"),
      },
      fontFamily: {
        sans: ["var(--font-texte)", "Segoe UI", "system-ui", "sans-serif"],
        serif: ["var(--font-titre)", "Iowan Old Style", "Georgia", "serif"],
      },
      /* Coins presque droits, comme le chant d'un carreau. "rounded-full"
         (puces, pastilles, boutons ronds) n'est pas modifié. */
      borderRadius: {
        sm: "1px",
        DEFAULT: "2px",
        md: "2px",
        lg: "2px",
        xl: "3px",
        "2xl": "4px",
        "3xl": "6px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(38 35 29 / 0.06)",
        DEFAULT: ombre(2, 6, 0.08),
        md: ombre(6, 16, 0.1),
        lg: ombre(12, 30, 0.14),
        xl: ombre(20, 44, 0.18),
      },
      backgroundImage: {
        // Fond des en-têtes : olive profond posé sur une texture de vrais
        // carreaux BOCARO (carreau Madrid du catalogue, répété).
        "hero-pattern":
          "radial-gradient(ellipse at 85% 0%, rgba(169,73,42,0.22), transparent 55%), " +
          "linear-gradient(rgba(36,41,26,0.90), rgba(36,41,26,0.93)), " +
          "url('/images/carreaux/madrid-carreau.webp')",
      },
    },
  },
  plugins: [],
};
