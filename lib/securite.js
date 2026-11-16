// Politique de sécurité du contenu (CSP), envoyée par proxy.js sur chaque
// page. Les autres en-têtes de sécurité, identiques pour toutes les
// réponses, sont dans next.config.js (headers()).
//
// Scripts : seulement ceux du site portant le nonce de la requête (Next.js
// l'ajoute à ses propres scripts ; layout.js l'ajoute au script du thème).
// 'strict-dynamic' laisse ces scripts charger leurs morceaux de code. Un
// script injecté par un attaquant, sans nonce, est bloqué.
//
// Styles : 'unsafe-inline' reste nécessaire, des composants utilisent des
// styles en ligne (animations, galerie, poignée du simulateur). Le risque
// est faible : un style ne peut pas exécuter de code.

/** Nonce aléatoire, différent à chaque requête (base64). */
export function creerNonce() {
  const octets = new Uint8Array(16);
  crypto.getRandomValues(octets);
  return btoa(String.fromCharCode(...octets));
}

/** Origine du projet Supabase (API, connexion, photos), sinon *.supabase.co. */
function origineSupabase() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    return "https://*.supabase.co";
  }
}

/**
 * Valeur de l'en-tête Content-Security-Policy.
 * dev : en développement, React a besoin de 'unsafe-eval' (piles d'erreurs).
 * https : la page a été demandée en https. upgrade-insecure-requests n'est
 * envoyé que dans ce cas : sur un site servi en http (npm start ouvert
 * depuis un téléphone du Wi-Fi), il forcerait le navigateur à charger
 * scripts et styles en https à la même adresse, où rien ne répond, et la
 * page s'afficherait cassée.
 */
export function construireCsp(nonce, { dev = process.env.NODE_ENV === "development", https = !dev } = {}) {
  const supabase = origineSupabase();
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    // Photos des produits (simulateur, dashboard), aperçus des envois
    // (blob:) ; les autres images passent par /_next/image ('self').
    "img-src": ["'self'", "data:", "blob:", supabase],
    "font-src": ["'self'", "data:"],
    // API Supabase (lecture des produits, connexion, envoi des photos).
    "connect-src": ["'self'", supabase, supabase.replace("https://", "wss://"), ...(dev ? ["ws:"] : [])],
    // Carte Google Maps de la page Contact (chargée au clic).
    "frame-src": ["https://www.google.com"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    // Le site ne peut pas être affiché dans un cadre d'un autre site
    // (protection contre le détournement de clic).
    "frame-ancestors": ["'none'"],
  };
  const texte = Object.entries(directives).map(([nom, valeurs]) => `${nom} ${valeurs.join(" ")}`);
  if (https) texte.push("upgrade-insecure-requests");
  return texte.join("; ");
}
