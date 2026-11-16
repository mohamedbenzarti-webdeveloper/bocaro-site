// @vitest-environment jsdom
// Pages rendues par le serveur : contenu, langue, référencement et accès.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { useRouter } from "next/navigation";
import { rendreAvecLangue, produitsExemple } from "../../tests/utils";
import { fauxSupabase } from "../../tests/fauxSupabase";

// --- Sources de données remplacées ---
let locale = "fr";
vi.mock("../../lib/locale-server", () => ({ getLocaleServeur: async () => locale, COOKIE_LANGUE: "bocaro-locale" }));

let catalogue = { data: [], error: null };
let produitUnique = { data: null, error: null };
vi.mock("../../lib/supabase/public", () => ({
  lireProduits: vi.fn(async () => catalogue),
  lireProduit: vi.fn(async () => produitUnique),
}));

let instagram = { posts: [] };
vi.mock("../../lib/instagram", () => ({ lireDerniersPostsInstagram: async () => instagram }));

let base;
vi.mock("../../lib/supabase/server", () => ({ createClient: async () => base }));
vi.mock("../../lib/supabase/client", () => ({ createClient: () => base }));
vi.mock("../actions/produits", () => ({
  compterOrphelins: async () => ({ nombre: 0, octets: 0 }),
  purgerOrphelins: async () => ({}),
  supprimerProduit: async () => undefined,
  creerProduit: async () => undefined,
  modifierProduit: async () => undefined,
  annulerEnvois: async () => null,
  deconnexion: async () => undefined,
}));

// En-têtes de la requête : nonce de la CSP posé par proxy.js.
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-nonce": "nonce-de-test" }) }));

// Polices Google : sans le compilateur de Next.js, on renvoie des noms fixes.
vi.mock("next/font/google", () => {
  const police = (nom) => () => ({ variable: `--police-${nom}`, className: nom });
  return { Newsreader: police("titre"), Instrument_Sans: police("texte"), Tajawal: police("tajawal"), Amiri: police("amiri") };
});

beforeEach(() => {
  locale = "fr";
  catalogue = { data: produitsExemple(), error: null };
  produitUnique = { data: null, error: null };
  instagram = { posts: [] };
  base = fauxSupabase({ produits: produitsExemple() });
});

/** Rend une page serveur (fonction async) dans le contexte de langue. */
async function rendrePage(Page, props = {}) {
  const ui = await Page(props);
  return rendreAvecLangue(ui, { locale });
}

describe("accueil", () => {
  const Accueil = async (p) => (await import("../page")).default(p);

  it("présente la marque, les actions principales et les produits populaires", async () => {
    await rendrePage(Accueil);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("L'art de la faïence");
    expect(screen.getByRole("link", { name: "Voir les produits" })).toHaveAttribute("href", "/produits");
    expect(screen.getAllByRole("link", { name: /Tester le simulateur/ })[0]).toHaveAttribute("href", "/simulateur");
    for (const nom of ["Étoile", "Avoine", "Brique"]) expect(screen.getByRole("heading", { level: 3, name: nom })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 3, name: "Lagon" })).not.toBeInTheDocument(); // 3 au maximum
  });

  it("calcule les années d'expérience depuis 2006 (jamais un chiffre figé)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2031-03-01"));
    await rendrePage(Accueil);
    vi.useRealTimers();
    const chiffre = screen.getByText("Années d'expérience").parentElement.querySelector("dd");
    expect(chiffre).toHaveTextContent("25+");
    expect(document.body.textContent).not.toContain("{annees}");
  });

  it("met en avant une vraie photo de produit et alimente la galerie", async () => {
    await rendrePage(Accueil);
    // Avoine a une 2e photo (mise en situation) : elle ouvre la page.
    expect(document.querySelector('img[src$="avoine-situation.webp"]')).not.toBeNull();
    expect(screen.getByRole("region", { name: "Galerie de nos carreaux" })).toBeInTheDocument();
  });

  it("reste affichable si la base est indisponible", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    catalogue = { data: null, error: { message: "hors ligne" } };
    await rendrePage(Accueil);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Galerie de nos carreaux" })).not.toBeInTheDocument();
  });

  it("affiche Instagram seulement s'il y a des publications", async () => {
    await rendrePage(Accueil);
    expect(screen.queryByRole("link", { name: /Voir le profil Instagram/ })).not.toBeInTheDocument();
    instagram = { posts: [{ id: "1", image: "https://cdn/1.jpg", caption: "Nouveau carreau", permalink: "https://instagram.com/p/1" }] };
    await rendrePage(Accueil);
    expect(screen.getByRole("link", { name: /Voir le profil Instagram/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Nouveau carreau" }).closest("a")).toHaveAttribute("href", "https://instagram.com/p/1");
  });

  it("s'affiche en arabe", async () => {
    locale = "ar";
    await rendrePage(Accueil);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("فن الخزف");
  });
});

describe("page Produits", () => {
  it("affiche le catalogue de la base et décrit la page aux moteurs de recherche", async () => {
    const module = await import("../produits/page");
    expect(module.metadata.alternates.canonical).toBe("/produits");
    await rendrePage(module.default);
    expect(screen.getAllByRole("article")).toHaveLength(4);
  });

  it("base injoignable : erreur (page d'erreur, statut 500) au lieu d'un catalogue vide", async () => {
    const sauvegarde = catalogue;
    catalogue = { data: null, error: { message: "hors ligne" } };
    const module = await import("../produits/page");
    await expect(module.default()).rejects.toThrow(/hors ligne/);
    catalogue = sauvegarde;
  });
});

describe("fiche produit : absent ou panne", () => {
  const charger = () => import("../produits/[id]/page");

  it("produit absent : 404", async () => {
    produitUnique = { data: null, error: null };
    const { default: Page } = await charger();
    await expect(Page({ params: Promise.resolve({ id: "absent" }) })).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/);
  });

  it("base injoignable : erreur, pas 404", async () => {
    produitUnique = { data: null, error: { message: "hors ligne" } };
    const { default: Page, generateMetadata } = await charger();
    await expect(Page({ params: Promise.resolve({ id: "p2" }) })).rejects.toThrow(/hors ligne/);
    await expect(generateMetadata({ params: Promise.resolve({ id: "p3" }) })).rejects.toThrow(/hors ligne/);
  });
});

describe("pages d'erreur", () => {
  it("la page 404 est traduite et propose le catalogue", async () => {
    locale = "en";
    await rendrePage((await import("../not-found")).default);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page not found");
    expect(screen.getByRole("link", { name: "See the products" })).toHaveAttribute("href", "/produits");
    locale = "fr";
  });

  it("la page d'erreur permet de réessayer", async () => {
    const retry = vi.fn();
    const { default: Erreur } = await import("../error");
    rendreAvecLangue(<Erreur error={new Error("x")} retry={retry} />);
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Le site rencontre un problème");
  });
});

describe("fiche produit", () => {
  const charger = () => import("../produits/[id]/page");
  const etoile = produitsExemple()[0];

  it("décrit le produit pour le référencement (titre, description, image)", async () => {
    produitUnique = { data: etoile, error: null };
    const { generateMetadata } = await charger();
    const meta = await generateMetadata({ params: Promise.resolve({ id: "p1" }) });
    expect(meta.title).toBe("Étoile — Carreau ciment");
    expect(meta.description).toBe("Motif étoilé bleu");
    expect(meta.alternates.canonical).toBe("/produits/p1");
    expect(meta.openGraph.images[0].url).toContain("etoile.webp");
  });

  it("raccourcit une longue description à 158 caractères", async () => {
    produitUnique = { data: { ...etoile, description: "Très ".repeat(60) }, error: null };
    const { generateMetadata } = await charger();
    const meta = await generateMetadata({ params: Promise.resolve({ id: "p1" }) });
    expect(meta.description.length).toBeLessThanOrEqual(158);
    expect(meta.description.endsWith("…")).toBe(true);
  });

  it("publie les données structurées Product avec l'offre en dinars", async () => {
    produitUnique = { data: etoile, error: null };
    await rendrePage((await charger()).default, { params: Promise.resolve({ id: "p1" }) });
    const donnees = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    expect(donnees).toMatchObject({
      "@type": "Product",
      name: "Étoile",
      brand: { name: "BOCARO" },
      url: "https://www.bocaro.test/produits/p1",
      offers: { price: 120, priceCurrency: "TND" },
    });
    expect(screen.getByRole("heading", { level: 1, name: "Étoile" })).toBeInTheDocument();
  });

  it("n'annonce pas de prix pour un produit sans prix", async () => {
    produitUnique = { data: { ...etoile, prix: 0 }, error: null };
    await rendrePage((await charger()).default, { params: Promise.resolve({ id: "p1" }) });
    const donnees = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    expect(donnees.offers).toBeUndefined();
  });

  it("empêche l'injection de balises dans les données structurées", async () => {
    produitUnique = { data: { ...etoile, nom: "</script><script>alert(1)</script>" }, error: null };
    await rendrePage((await charger()).default, { params: Promise.resolve({ id: "p1" }) });
    const brut = document.querySelector('script[type="application/ld+json"]').innerHTML;
    expect(brut).not.toContain("</script>");
    expect(JSON.parse(brut).name).toBe("</script><script>alert(1)</script>");
  });

  it("renvoie la page 404 pour un produit inexistant", async () => {
    const { default: Page, generateMetadata } = await charger();
    await expect(Page({ params: Promise.resolve({ id: "absent" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    const meta = await generateMetadata({ params: Promise.resolve({ id: "absent" }) });
    expect(meta.robots).toEqual({ index: false });
  });
});

describe("pages À propos et Contact", () => {
  it("À propos raconte l'histoire et les valeurs, dans la langue choisie", async () => {
    await rendrePage((await import("../a-propos/page")).default);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("À propos de BOCARO");
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("2016")).toBeInTheDocument();
    locale = "en";
    await rendrePage((await import("../a-propos/page")).default);
    expect(screen.getAllByRole("heading", { level: 1 }).at(-1)).toHaveTextContent("About BOCARO");
  });

  it("Contact donne les coordonnées cliquables, le formulaire et la carte", async () => {
    await rendrePage((await import("../contact/page")).default);
    expect(screen.getByRole("link", { name: "bocaro_tunisia@yahoo.com" })).toHaveAttribute("href", "mailto:bocaro_tunisia@yahoo.com");
    expect(screen.getByRole("link", { name: "+216 98 514 014" })).toHaveAttribute("href", "https://wa.me/21698514014");
    expect(screen.getByRole("link", { name: "+216 22 447 900" })).toHaveAttribute("href", "https://wa.me/21622447900");
    expect(screen.getByLabelText("Nom complet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Afficher la carte" })).toBeInTheDocument();
  });

  it("chaque page a ses propres titre et adresse canonique", async () => {
    for (const [chemin, canonique] of [["../a-propos/layout", "/a-propos"], ["../contact/layout", "/contact"], ["../simulateur/layout", "/simulateur"]]) {
      const { metadata } = await import(chemin);
      expect(metadata.alternates.canonical).toBe(canonique);
      expect(metadata.description.length).toBeGreaterThan(50);
    }
  });
});

describe("pages Confidentialité et Mentions légales", () => {
  it("la politique de confidentialité annonce la durée de conservation et les droits", async () => {
    await rendrePage((await import("../confidentialite/page")).default);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Politique de confidentialité");
    expect(screen.getByRole("heading", { level: 2, name: "Durée de conservation" })).toBeInTheDocument();
    expect(screen.getByText(/12 mois/)).toBeInTheDocument();
    expect(screen.getByText(/loi organique n° 2004-63/)).toBeInTheDocument();
    expect(screen.getByText(/bocaro-locale/)).toBeInTheDocument();
    expect(document.querySelector("time")).toHaveAttribute("dateTime", "2026-11-16");
  });

  it("les mentions légales donnent l'éditeur et renvoient vers la confidentialité", async () => {
    await rendrePage((await import("../mentions-legales/page")).default);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mentions légales");
    expect(screen.getByText(/Rue Ras Jedir, Soukra, Tunis, Tunisie/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Politique de confidentialité" })).toHaveAttribute("href", "/confidentialite");
    expect(document.body.textContent).not.toMatch(/null|undefined/);
  });

  it("s'affichent en arabe", async () => {
    locale = "ar";
    await rendrePage((await import("../confidentialite/page")).default);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("سياسة الخصوصية");
  });

  it("ont leur titre et leur adresse canonique", async () => {
    expect((await import("../confidentialite/page")).metadata.alternates.canonical).toBe("/confidentialite");
    expect((await import("../mentions-legales/page")).metadata.alternates.canonical).toBe("/mentions-legales");
  });
});

describe("connexion", () => {
  const Connexion = async () => (await import("../login/page")).default;

  async function seConnecter(email, mdp) {
    const u = userEvent.setup();
    const Page = await Connexion();
    render(<Page />);
    await u.type(screen.getByLabelText("Email"), email);
    await u.type(screen.getByLabelText("Mot de passe"), mdp);
    await u.click(screen.getByRole("button", { name: "Se connecter" }));
  }

  it("ouvre le dashboard pour un administrateur", async () => {
    base.auth.signInWithPassword = vi.fn(async () => ({ error: null }));
    await seConnecter("directeur@bocaro.tn", "secret");
    expect(base.auth.signInWithPassword).toHaveBeenCalledWith({ email: "directeur@bocaro.tn", password: "secret" });
    await waitFor(() => expect(useRouter().push).toHaveBeenCalledWith("/dashboard"));
  });

  it("explique le refus quand le proxy renvoie ici (?erreur=acces)", async () => {
    window.history.pushState({}, "", "/login?erreur=acces");
    const Page = await Connexion();
    render(<Page />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Ce compte n'a pas accès à l'espace direction.");
    window.history.pushState({}, "", "/");
  });

  it("n'affiche aucune erreur sur une connexion normale", async () => {
    const Page = await Connexion();
    render(<Page />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("refuse un mauvais mot de passe sans dire lequel des deux est faux", async () => {
    base.auth.signInWithPassword = vi.fn(async () => ({ error: { message: "Invalid login credentials" } }));
    await seConnecter("x@y.tn", "faux");
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou mot de passe incorrect.");
  });

  it("déconnecte aussitôt un compte qui n'est pas administrateur", async () => {
    base = fauxSupabase({ admin: false });
    base.auth.signInWithPassword = vi.fn(async () => ({ error: null }));
    await seConnecter("client@exemple.tn", "secret");
    expect(await screen.findByRole("alert")).toHaveTextContent("Ce compte n'a pas accès à l'espace direction.");
    expect(base.auth.signOut).toHaveBeenCalled();
    expect(useRouter().push).not.toHaveBeenCalledWith("/dashboard");
  });
});

describe("dashboard (côté serveur)", () => {
  it("la mise en page renvoie vers la connexion sans droits administrateur", async () => {
    const { default: Layout, metadata } = await import("../dashboard/layout");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    base = fauxSupabase({ admin: false });
    await expect(Layout({ children: null })).rejects.toThrow("NEXT_REDIRECT /login?erreur=acces");
    base = fauxSupabase({ user: null });
    await expect(Layout({ children: null })).rejects.toThrow("NEXT_REDIRECT");
  });

  it("la mise en page affiche le compte connecté et le contenu", async () => {
    const { default: Layout } = await import("../dashboard/layout");
    render(await Layout({ children: <p>contenu</p> }));
    expect(screen.getByText("directeur@bocaro.tn")).toBeInTheDocument();
    expect(screen.getByText("contenu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });

  it("liste les produits avec les actions Modifier et Supprimer", async () => {
    base.from = () => ({ select: () => ({ order: async () => ({ data: produitsExemple(), error: null }) }) });
    render(await (await import("../dashboard/page")).default());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Produits (4)");
    const ligne = screen.getByText("Lagon", { selector: "td" }).closest("tr");
    expect(within(ligne).getByRole("link", { name: "Modifier" })).toHaveAttribute("href", "/dashboard/p4");
    expect(within(ligne).getByRole("button", { name: "Supprimer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+ Ajouter un produit" })).toHaveAttribute("href", "/dashboard/nouveau");
  });

  it("signale une erreur de chargement et une liste vide", async () => {
    base.from = () => ({ select: () => ({ order: async () => ({ data: [], error: { message: "RLS" } }) }) });
    render(await (await import("../dashboard/page")).default());
    expect(screen.getByText("Erreur de chargement : RLS")).toBeInTheDocument();
    expect(screen.getByText(/Aucun produit pour l'instant/)).toBeInTheDocument();
  });

  it("la page de modification charge le produit, ou renvoie 404", async () => {
    const { default: Page } = await import("../dashboard/[id]/page");
    render(await Page({ params: Promise.resolve({ id: "p4" }) }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Modifier « Lagon »");
    await expect(Page({ params: Promise.resolve({ id: "absent" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("la page d'ajout affiche un formulaire vide", async () => {
    render((await import("../dashboard/nouveau/page")).default());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ajouter un produit");
    expect(screen.getByRole("button", { name: "Ajouter le produit" })).toBeInTheDocument();
  });
});

describe("mise en page générale", () => {
  it("décrit l'entreprise aux moteurs de recherche", async () => {
    const { metadata } = await import("../layout");
    expect(metadata.title.template).toBe("%s | BOCARO");
    expect(metadata.metadataBase.href).toBe("https://www.bocaro.test/");
    expect(metadata.openGraph.locale).toBe("fr_TN");
  });

  it("annonce la langue et le sens d'écriture dès le HTML, avec la fiche entreprise", async () => {
    locale = "ar";
    const RootLayout = (await import("../layout")).default;
    const html = renderToStaticMarkup(await RootLayout({ children: <main>page</main> }));
    expect(html).toMatch(/<html[^>]* lang="ar"[^>]* dir="rtl"/);
    expect(html).toContain('"@type":"HomeAndConstructionBusiness"');
    // Le logo de la fiche entreprise est le vrai logo, pas une photo.
    const fiche = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
    expect(fiche.logo).toMatch(/\/images\/logo-oiseau\.png$/);
    expect(fiche.image).toMatch(/\/images\/simulateur\/salon\.jpg$/);
    expect(html).toContain("localStorage.getItem('bocaro-theme')");
    // Le script du thème porte le nonce, sinon la CSP le bloquerait.
    expect(html).toMatch(/<script nonce="nonce-de-test">try\{var t=localStorage/);
    expect(html).toContain("<main>page</main>");
    // Lien d'évitement : premier lien de la page, vers le contenu principal.
    expect(html.match(/<a [^>]*>/)[0]).toContain('href="#contenu"');
    expect(html).toContain("الانتقال إلى المحتوى");
    expect(html).toMatch(/<main id="contenu" tabindex="-1"/i);
  });
});
