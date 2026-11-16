// Protection du dashboard (proxy.js) et référencement (sitemap, robots).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

let session;
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: async () => ({ data: { user: session.user } }),
      signOut: session.signOut,
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: session.aal, nextLevel: "aal2" }, error: null }) },
    },
    rpc: async () => ({ data: session.admin, error: null }),
  })),
}));

let produitsBase;
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: async () => {
        if (produitsBase instanceof Error) throw produitsBase;
        return { data: produitsBase, error: null };
      },
    }),
  }),
}));

const { proxy, config } = await import("../../proxy");
const sitemap = (await import("../sitemap")).default;
const robots = (await import("../robots")).default;

const requete = (chemin) => new NextRequest(new URL(chemin, "https://www.bocaro.test"));
const destination = (reponse) => {
  const lieu = reponse.headers.get("location");
  if (!lieu) return null;
  const url = new URL(lieu);
  return url.pathname + url.search;
};

beforeEach(() => {
  session = { user: null, admin: false, aal: "aal1", signOut: vi.fn(async () => ({})) };
});

describe("proxy (sécurité de chaque page)", () => {
  // Le motif de Next.js est une expression régulière (« : » mis à part).
  const motif = new RegExp(`^${config.matcher[0].source}$`);

  it("s'applique aux pages, pas aux fichiers statiques ni à l'API", () => {
    for (const page of ["/", "/produits", "/produits/abc", "/simulateur", "/contact", "/dashboard", "/login"]) expect(motif.test(page), page).toBe(true);
    for (const fichier of ["/api/instagram", "/_next/static/chunks/a.js", "/_next/image", "/images/carreaux/a.webp", "/icon.png", "/robots.txt", "/sitemap.xml"])
      expect(motif.test(fichier), fichier).toBe(false);
  });

  it("pose une CSP avec un nonce différent à chaque requête, transmis à la page", async () => {
    const [a, b] = await Promise.all([proxy(requete("/")), proxy(requete("/produits"))]);
    const csp = a.headers.get("content-security-policy");
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    expect(b.headers.get("content-security-policy")).not.toContain(nonce);
    // Next.js lit le nonce dans les en-têtes de la requête transmise.
    expect(a.headers.get("x-middleware-request-x-nonce")).toBe(nonce);
  });

  it("ne contacte pas Supabase pour une page publique", async () => {
    const { createServerClient } = await import("@supabase/ssr");
    createServerClient.mockClear();
    await proxy(requete("/produits"));
    await proxy(requete("/"));
    expect(createServerClient).not.toHaveBeenCalled();
    await proxy(requete("/login"));
    expect(createServerClient).toHaveBeenCalledTimes(1);
  });

  it("garde la CSP sur les redirections", async () => {
    const r = await proxy(requete("/dashboard"));
    expect(destination(r)).toBe("/login");
    expect(r.headers.get("content-security-policy")).toContain("'strict-dynamic'");
  });
});

describe("proxy (accès au dashboard)", () => {

  it("renvoie un visiteur non connecté vers /login", async () => {
    expect(destination(await proxy(requete("/dashboard")))).toBe("/login");
    expect(destination(await proxy(requete("/dashboard/abc")))).toBe("/login");
  });

  it("laisse un visiteur non connecté ouvrir /login", async () => {
    const r = await proxy(requete("/login"));
    expect(destination(r)).toBeNull();
  });

  it("déconnecte un compte non administrateur qui ouvre le dashboard", async () => {
    session = { ...session, user: { id: "u2" }, admin: false };
    expect(destination(await proxy(requete("/dashboard")))).toBe("/login?erreur=acces");
    expect(session.signOut).toHaveBeenCalled();
  });

  it("laisse un compte non administrateur sur /login (message d'erreur)", async () => {
    session = { ...session, user: { id: "u2" }, admin: false };
    expect(destination(await proxy(requete("/login")))).toBeNull();
    expect(session.signOut).not.toHaveBeenCalled();
  });

  it("laisse passer un administrateur qui a validé son code", async () => {
    session = { ...session, user: { id: "u1" }, admin: true, aal: "aal2" };
    expect(destination(await proxy(requete("/dashboard/nouveau")))).toBeNull();
  });

  it("envoie un administrateur déjà connecté (code validé) de /login vers le dashboard", async () => {
    session = { ...session, user: { id: "u1" }, admin: true, aal: "aal2" };
    expect(destination(await proxy(requete("/login")))).toBe("/dashboard");
  });

  it("double authentification : mot de passe seul → /login pour saisir le code, sans déconnexion", async () => {
    session = { ...session, user: { id: "u1" }, admin: true, aal: "aal1" };
    expect(destination(await proxy(requete("/dashboard")))).toBe("/login");
    expect(destination(await proxy(requete("/dashboard/nouveau")))).toBe("/login");
    // /login reste ouvert : il affiche l'étape du code.
    expect(destination(await proxy(requete("/login")))).toBeNull();
    expect(session.signOut).not.toHaveBeenCalled();
  });
});

describe("sitemap", () => {
  it("liste les pages publiques et chaque fiche produit", async () => {
    produitsBase = [
      { id: "p1", created_at: "2026-01-02T00:00:00Z" },
      { id: "p2", created_at: "2026-03-04T00:00:00Z" },
    ];
    const entrees = await sitemap();
    const urls = entrees.map((e) => e.url);
    expect(urls).toEqual([
      "https://www.bocaro.test",
      "https://www.bocaro.test/produits",
      "https://www.bocaro.test/simulateur",
      "https://www.bocaro.test/a-propos",
      "https://www.bocaro.test/contact",
      "https://www.bocaro.test/confidentialite",
      "https://www.bocaro.test/mentions-legales",
      "https://www.bocaro.test/produits/p1",
      "https://www.bocaro.test/produits/p2",
    ]);
    expect(urls.some((u) => u.includes("dashboard") || u.includes("login"))).toBe(false);
    expect(entrees[8].lastModified.toISOString()).toBe("2026-03-04T00:00:00.000Z");
  });

  it("date de dernière modification : updated_at, sinon création ; pas de fausse date sur les pages fixes", async () => {
    produitsBase = [
      { id: "p1", created_at: "2026-01-02T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
      { id: "p2", created_at: "2026-03-04T00:00:00Z" },
    ];
    const { MISE_A_JOUR } = await import("../../lib/legal");
    const parUrl = Object.fromEntries((await sitemap()).map((e) => [e.url.replace("https://www.bocaro.test", ""), e]));
    expect(parUrl["/produits/p1"].lastModified.toISOString()).toBe("2026-06-01T00:00:00.000Z");
    expect(parUrl["/produits/p2"].lastModified.toISOString()).toBe("2026-03-04T00:00:00.000Z");
    for (const page of ["", "/produits", "/simulateur", "/a-propos", "/contact"]) expect(parUrl[page].lastModified).toBeUndefined();
    expect(parUrl["/confidentialite"].lastModified).toEqual(new Date(MISE_A_JOUR));
  });

  it("garde les pages fixes si la base est injoignable", async () => {
    produitsBase = new Error("hors ligne");
    expect((await sitemap()).map((e) => e.url)).toHaveLength(7);
  });
});

describe("robots", () => {
  it("cache l'administration aux moteurs de recherche et indique le sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/login", "/api/"] },
      sitemap: "https://www.bocaro.test/sitemap.xml",
    });
  });
});
