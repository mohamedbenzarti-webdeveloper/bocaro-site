import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { construireCsp, creerNonce } from "./lib/securite";
import { estMembreAdmin, niveauSession } from "./lib/supabase/admin";

// Exécuté avant chaque page :
// 1. Politique de sécurité du contenu (CSP) avec un nonce propre à la
//    requête (voir lib/securite.js). Next.js lit l'en-tête de la requête
//    pour ajouter ce nonce à ses scripts ; layout.js le lit via x-nonce.
// 2. Sur /dashboard et /login seulement : contrôle de la session Supabase,
//    des droits d'administration et de la double authentification (code
//    validé = niveau "aal2").
export async function proxy(request) {
  const nonce = creerNonce();
  const csp = construireCsp(nonce);

  // En-têtes de la requête transmise à la page (cookies compris, relus à
  // chaque fois : Supabase peut les mettre à jour).
  const suivante = () => {
    const entetes = new Headers(request.headers);
    entetes.set("x-nonce", nonce);
    entetes.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers: entetes } });
  };
  const avecCsp = (reponse) => {
    reponse.headers.set("Content-Security-Policy", csp);
    return reponse;
  };

  let response = suivante();

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  if (!isDashboard && !isLogin) return avecCsp(response);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers = {}) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = suivante();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          // Une réponse qui pose des cookies de session ne doit jamais
          // être mise en cache (sinon un cache partagé pourrait la servir
          // à un autre visiteur).
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pas connecté et essaie d'accéder au dashboard -> vers /login
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return avecCsp(NextResponse.redirect(url));
  }

  // Connecté mais pas administrateur -> déconnexion et retour à /login
  if (user && (isDashboard || isLogin)) {
    const admin = await estMembreAdmin(supabase);
    if (!admin) {
      if (isLogin) return avecCsp(response);
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("erreur", "acces");
      const redirection = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => redirection.cookies.set(c));
      return avecCsp(redirection);
    }
  }

  // Administrateur connecté par mot de passe seulement (code pas encore
  // saisi) : le dashboard attend la 2e étape, affichée par /login.
  const codeValide = user ? (await niveauSession(supabase)).actuel === "aal2" : false;
  if (isDashboard && !codeValide) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return avecCsp(NextResponse.redirect(url));
  }

  // Administrateur déjà connecté (code validé) qui va sur /login -> vers /dashboard
  if (isLogin && user && codeValide) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return avecCsp(NextResponse.redirect(url));
  }

  return avecCsp(response);
}

export const config = {
  matcher: [
    // Toutes les pages, sauf l'API, les fichiers de Next.js, l'optimiseur
    // d'images et les fichiers statiques (images, icônes, robots.txt,
    // sitemap.xml) ; les préchargements de liens n'ont pas besoin de CSP.
    {
      source: "/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
