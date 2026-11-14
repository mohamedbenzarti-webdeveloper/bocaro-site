// Publications Instagram (API Graph) et langue lue côté serveur.
import { describe, it, expect, vi, beforeEach } from "vitest";

let cookieLangue;
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (nom) => (nom === "bocaro-locale" && cookieLangue ? { value: cookieLangue } : undefined) }),
}));

const { lireDerniersPostsInstagram } = await import("../instagram");
const { getLocaleServeur, COOKIE_LANGUE } = await import("../locale-server");
const { GET } = await import("../../app/api/instagram/route");

describe("lireDerniersPostsInstagram", () => {
  let fetch;
  beforeEach(() => {
    fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.stubEnv("INSTAGRAM_ACCESS_TOKEN", "jeton");
    vi.stubEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "1789");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const post = (id, jour, extra = {}) => ({
    id,
    caption: `Post ${id}`,
    media_type: "IMAGE",
    media_url: `https://cdn/${id}.jpg`,
    permalink: `https://instagram.com/p/${id}`,
    timestamp: `2026-10-${String(jour).padStart(2, "0")}T10:00:00+0000`,
    ...extra,
  });

  it("ne contacte pas l'API si Instagram n'est pas configuré", async () => {
    vi.stubEnv("INSTAGRAM_ACCESS_TOKEN", "");
    expect(await lireDerniersPostsInstagram()).toEqual({ posts: [], erreur: "instagram_non_configure" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("garde les 3 plus récents, avec la miniature des vidéos", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          post("ancien", 1),
          post("video-sans-miniature", 30, { media_type: "VIDEO", media_url: "x.mp4" }),
          post("video", 20, { media_type: "VIDEO", media_url: "v.mp4", thumbnail_url: "https://cdn/v.jpg" }),
          post("recent", 25),
          post("moyen", 10, { caption: undefined }),
        ],
      }),
    });
    const { posts, erreur } = await lireDerniersPostsInstagram();
    expect(erreur).toBeUndefined();
    expect(posts.map((p) => p.id)).toEqual(["recent", "video", "moyen"]);
    expect(posts[1].image).toBe("https://cdn/v.jpg");
    expect(posts[2].caption).toBe("");
    expect(fetch.mock.calls[0][0]).toContain("/1789/media?");
    expect(fetch.mock.calls[0][1]).toEqual({ next: { revalidate: 900 } });
  });

  it("renvoie une liste vide en cas d'erreur de l'API ou du réseau", async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: "token expiré" } }) });
    expect(await lireDerniersPostsInstagram()).toEqual({ posts: [], erreur: "instagram_api_error" });
    fetch.mockRejectedValueOnce(new Error("hors ligne"));
    expect(await lireDerniersPostsInstagram()).toEqual({ posts: [], erreur: "instagram_fetch_failed" });
  });

  it("la route /api/instagram renvoie le résultat sans cache", async () => {
    vi.stubEnv("INSTAGRAM_ACCESS_TOKEN", "");
    const reponse = await GET();
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get("Cache-Control")).toBe("no-store");
    expect(await reponse.json()).toEqual({ posts: [], erreur: "instagram_non_configure" });
  });
});

describe("getLocaleServeur", () => {
  it("lit la langue du cookie", async () => {
    expect(COOKIE_LANGUE).toBe("bocaro-locale");
    cookieLangue = "ar";
    expect(await getLocaleServeur()).toBe("ar");
    cookieLangue = "en";
    expect(await getLocaleServeur()).toBe("en");
  });

  it("retombe sur le français sans cookie ou avec une langue inconnue", async () => {
    cookieLangue = undefined;
    expect(await getLocaleServeur()).toBe("fr");
    cookieLangue = "de";
    expect(await getLocaleServeur()).toBe("fr");
  });
});
