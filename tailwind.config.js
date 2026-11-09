/** @type {import('tailwindcss').Config} */

// Mode nuit : les couleurs "bocaro" (bleu) et "brand" (terre cuite) sont
// exposées à travers des variables CSS (voir app/globals.css) qui changent
// de valeur quand <html> porte la classe "dark". Les fonds, textes et
// bordures ont chacun leur échelle : un même "bocaro-950" est un texte
// presque noir en mode jour, presque blanc en mode nuit, tandis qu'un
// fond "bocaro-950" (pied de page, en-tête du dashboard) reste sombre.
const palette = (prefixe) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [
      n,
      `rgb(var(--${prefixe}-${n}) / <alpha-value>)`,
    ])
  );

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Couleur secondaire — bleu cobalt d'émail, celui des motifs de
           la faïence traditionnelle tunisienne (Nabeul) : profond et
           légèrement mat, pas un bleu électrique d'interface. */
        bocaro: {
          50: "#f2f5fa",
          100: "#e2e9f3",
          200: "#c5d3e7",
          300: "#9cb2d4",
          400: "#6d8bbb",
          500: "#4a6aa3",
          600: "#36528a",
          700: "#2a4273",
          800: "#22365e",
          900: "#1b2b4b",
          950: "#121d33",
        },
        /* Couleur principale de la marque — terre cuite chaude,
           évoquant l'argile et la faïence artisanale */
        brand: {
          50: "#fdf3ee",
          100: "#fbe3d6",
          200: "#f5c4ab",
          300: "#eda078",
          400: "#df7a4d",
          500: "#c85a2f",
          600: "#a84424",
          700: "#87361d",
          800: "#6c2c1a",
          900: "#582519",
        },
        terracotta: {
          400: "#d98a5f",
          500: "#c76f42",
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
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      backgroundImage: {
        // Fond des en-têtes : encre cobalt profonde posée sur une texture
        // de vrais carreaux BOCARO (carreau Madrid du catalogue, répété).
        "hero-pattern":
          "radial-gradient(ellipse at 85% 0%, rgba(168,68,36,0.30), transparent 55%), " +
          "linear-gradient(rgba(20,31,56,0.90), rgba(20,31,56,0.93)), " +
          "url('/images/carreaux/madrid-carreau.webp')",
      },
    },
  },
  plugins: [],
};
