// Droits administrateur et lecture publique des produits (API REST).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { estAdmin, exigerAdmin } from "../admin";
import { lireProduits, lireProduit } from "../public";
import { fauxSupabase } from "../../../tests/fauxSupabase";

describe("estAdmin / exigerAdmin", () => {
  it("accepte un administrateur connecté", async () => {
    const supabase = fauxSupabase();
    expect(await estAdmin(supabase)).toBe(true);
    expect(await exigerAdmin(supabase)).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith("is_admin");
  });

  it("refuse un compte non administrateur ou un visiteur", async () => {
    expect(await exigerAdmin(fauxSupabase({ admin: false }))).toEqual({ erreur: "Accès réservé à l'administration." });
    expect(await exigerAdmin(fauxSupabase({ user: null }))).toEqual({ erreur: "Accès réservé à l'administration." });
  });

  it("refuse si la vérification échoue (erreur ou réponse inattendue)", async () => {
    const enErreur = { rpc: async () => ({ data: true, error: { message: "panne" } }) };
    const reponseBizarre = { rpc: async () => ({ data: "true", error: null }) };
    expect(await estAdmin(enErreur)).toBe(false);
    expect(await estAdmin(reponseBizarre)).toBe(false);
  });
});

describe("lecture publique des produits", () => {
  let fetch;
  beforeEach(() => {
    fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
  });
  const reponse = (corps, ok = true, status = 200) => ({ ok, status, json: async () => corps });

  it("lit tous les produits, du plus récent au plus ancien, avec la clé publique", async () => {
    fetch.mockResolvedValue(reponse([{ id: "p1" }]));
    expect(await lireProduits()).toEqual({ data: [{ id: "p1" }], error: null });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("https://projet-test.supabase.co/rest/v1/produits?select=*&order=created_at.desc");
    expect(options.headers).toEqual({ apikey: "cle-anon-test", Authorization: "Bearer cle-anon-test" });
    expect(options.next).toEqual({ revalidate: 60, tags: ["produits"] });
  });

  it("peut limiter le nombre de produits", async () => {
    fetch.mockResolvedValue(reponse([]));
    await lireProduits({ limite: 4 });
    expect(fetch.mock.calls[0][0]).toContain("limit=4");
  });

  it("renvoie le message d'erreur de l'API", async () => {
    fetch.mockResolvedValue(reponse({ message: "JWT expired" }, false, 401));
    expect(await lireProduits()).toEqual({ data: null, error: { message: "JWT expired" } });
  });

  it("renvoie un message générique si l'erreur n'est pas lisible", async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: async () => { throw new Error("pas du JSON"); } });
    expect(await lireProduits()).toEqual({ data: null, error: { message: "Erreur 503" } });
  });

  it("ne lève pas d'exception en cas de panne réseau", async () => {
    fetch.mockRejectedValue(new Error("fetch failed"));
    expect(await lireProduits()).toEqual({ data: null, error: { message: "fetch failed" } });
    expect(await lireProduit("p1")).toEqual({ data: null, error: { message: "fetch failed" } });
  });

  it("lit un produit par identifiant, encodé dans l'URL", async () => {
    fetch.mockResolvedValue(reponse([{ id: "a b" }]));
    expect(await lireProduit("a b")).toEqual({ data: { id: "a b" }, error: null });
    expect(fetch.mock.calls[0][0]).toBe("https://projet-test.supabase.co/rest/v1/produits?id=eq.a%20b&select=*");
  });

  it("un identifiant qui n'est pas un UUID est un produit absent, pas une panne", async () => {
    fetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({ code: "22P02", message: "invalid input syntax for type uuid" }) });
    expect(await lireProduit("abc")).toEqual({ data: null, error: null });
  });

  it("une base en panne renvoie une erreur, pas un produit absent", async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: "Service Unavailable" }) });
    expect(await lireProduit("p1")).toEqual({ data: null, error: { message: "Service Unavailable" } });
  });

  it("renvoie null pour un produit introuvable", async () => {
    fetch.mockResolvedValue(reponse([]));
    expect(await lireProduit("absent")).toEqual({ data: null, error: null });
  });
});
