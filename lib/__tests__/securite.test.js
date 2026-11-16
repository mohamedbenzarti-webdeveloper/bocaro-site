// Politique de sécurité du contenu (CSP) construite par lib/securite.js.
import { describe, it, expect } from "vitest";
import { construireCsp, creerNonce } from "../securite";

const directives = (csp) =>
  Object.fromEntries(csp.split("; ").map((d) => {
    const [nom, ...valeurs] = d.split(" ");
    return [nom, valeurs];
  }));

describe("creerNonce", () => {
  it("produit une valeur aléatoire de 128 bits, différente à chaque appel", () => {
    const valeurs = new Set(Array.from({ length: 200 }, creerNonce));
    expect(valeurs.size).toBe(200);
    for (const v of valeurs) expect(atob(v)).toHaveLength(16);
  });
});

describe("construireCsp (production)", () => {
  const d = directives(construireCsp("abc123", { dev: false }));

  it("n'autorise que les scripts du site portant le nonce", () => {
    expect(d["script-src"]).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(d["script-src"]).not.toContain("'unsafe-inline'");
    expect(d["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("interdit l'affichage du site dans un cadre et les plugins", () => {
    expect(d["frame-ancestors"]).toEqual(["'none'"]);
    expect(d["object-src"]).toEqual(["'none'"]);
    expect(d["base-uri"]).toEqual(["'self'"]);
    expect(d["form-action"]).toEqual(["'self'"]);
  });

  it("autorise seulement le projet Supabase du site pour les photos et l'API", () => {
    expect(d["img-src"]).toContain("https://projet-test.supabase.co");
    expect(d["connect-src"]).toEqual(["'self'", "https://projet-test.supabase.co", "wss://projet-test.supabase.co"]);
    expect(d["img-src"].some((s) => s === "*" || s === "https:")).toBe(false);
  });

  it("n'autorise que Google Maps comme cadre intégré", () => {
    expect(d["frame-src"]).toEqual(["https://www.google.com"]);
  });

  it("force https en production", () => {
    expect(d["upgrade-insecure-requests"]).toEqual([]);
  });

  it("site servi en http (npm start sur le Wi-Fi) : pas de upgrade-insecure-requests", () => {
    const http = directives(construireCsp("abc123", { dev: false, https: false }));
    expect(http["upgrade-insecure-requests"]).toBeUndefined();
    // Le reste de la politique ne change pas.
    expect(http["script-src"]).toEqual(d["script-src"]);
  });
});

describe("construireCsp (développement)", () => {
  const d = directives(construireCsp("abc123", { dev: true }));

  it("ajoute ce qu'exigent React et le rechargement à chaud", () => {
    expect(d["script-src"]).toContain("'unsafe-eval'");
    expect(d["connect-src"]).toContain("ws:");
  });

  it("n'impose pas https (test sur téléphone en Wi-Fi)", () => {
    expect(d["upgrade-insecure-requests"]).toBeUndefined();
  });
});
