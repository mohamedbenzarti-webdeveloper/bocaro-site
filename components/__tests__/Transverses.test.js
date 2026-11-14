// @vitest-environment jsdom
// Composants présents sur toutes les pages, chargement des produits côté
// navigateur et partage du résultat du simulateur.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Footer from "../Footer";
import ScrollToTop from "../ScrollToTop";
import RevealOnScroll from "../RevealOnScroll";
import { rendreAvecLangue, produitsExemple } from "../../tests/utils";

vi.mock("../../lib/supabase/public", () => ({ lireProduits: vi.fn() }));
// Rendu du simulateur remplacé (pas de carte graphique dans jsdom).
vi.mock("../simulateur/CanvasCompare", () => ({ default: () => <div /> }));
vi.mock("../simulateur/exportCanvas", () => ({
  construireCanvasResultat: async () => ({
    toDataURL: () => "data:image/png;base64,AAAA",
    toBlob: (rappel) => rappel(new Blob(["png"], { type: "image/png" })),
  }),
}));
const { lireProduits } = await import("../../lib/supabase/public");
const { useProduits } = await import("../../lib/hooks/useProduits");

describe("Footer", () => {
  it("donne la navigation, les coordonnées et les réseaux", () => {
    rendreAvecLangue(<Footer />);
    const pied = screen.getByRole("contentinfo");
    for (const [nom, href] of [["Accueil", "/"], ["Produits", "/produits"], ["Simulateur", "/simulateur"], ["Contact", "/contact"]])
      expect(within(pied).getByRole("link", { name: nom })).toHaveAttribute("href", href);
    expect(within(pied).getByRole("link", { name: "bocaro_tunisia@yahoo.com" })).toHaveAttribute("href", "mailto:bocaro_tunisia@yahoo.com");
    expect(within(pied).getByRole("link", { name: "Facebook" })).toHaveAttribute("href", "https://www.facebook.com/CAROANTIKA");
    expect(within(pied).getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/caroantika_officiel/");
    expect(within(pied).getByText(new RegExp(`© ${new Date().getFullYear()} BOCARO`))).toBeInTheDocument();
    expect(within(pied).getByRole("link", { name: "Confidentialité" })).toHaveAttribute("href", "/confidentialite");
    expect(within(pied).getByRole("link", { name: "Mentions légales" })).toHaveAttribute("href", "/mentions-legales");
  });
});

describe("ScrollToTop", () => {
  it("apparaît après 400 px de défilement et ramène en haut", async () => {
    const u = userEvent.setup();
    const defiler = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    rendreAvecLangue(<ScrollToTop />);
    const bouton = screen.getByRole("button", { name: "Remonter en haut de page" });
    expect(bouton).toHaveClass("pointer-events-none");

    Object.defineProperty(window, "scrollY", { value: 900, configurable: true });
    fireEvent.scroll(window);
    expect(bouton).not.toHaveClass("pointer-events-none");

    await u.click(bouton);
    expect(defiler).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });
});

describe("RevealOnScroll", () => {
  it("fait apparaître les éléments .reveal, y compris ceux ajoutés ensuite", async () => {
    document.body.innerHTML = '<div class="reveal" id="a"></div>';
    render(<RevealOnScroll />);
    expect(document.documentElement).toHaveClass("js-reveal");
    expect(document.getElementById("a")).toHaveClass("is-visible");

    const nouveau = Object.assign(document.createElement("div"), { className: "reveal", id: "b" });
    document.body.appendChild(nouveau);
    await waitFor(() => expect(nouveau).toHaveClass("is-visible"));
  });
});

describe("useProduits", () => {
  beforeEach(() => lireProduits.mockReset());

  it("charge les produits", async () => {
    lireProduits.mockResolvedValue({ data: produitsExemple(), error: null });
    const { result } = renderHook(() => useProduits());
    expect(result.current.chargement).toBe(true);
    await waitFor(() => expect(result.current.chargement).toBe(false));
    expect(result.current.produits).toHaveLength(4);
    expect(result.current.erreur).toBeNull();
  });

  it("signale une erreur, puis réussit au nouvel essai", async () => {
    lireProduits.mockResolvedValueOnce({ data: null, error: { message: "hors ligne" } });
    const { result } = renderHook(() => useProduits());
    await waitFor(() => expect(result.current.erreur).toBe("hors ligne"));
    expect(result.current.produits).toEqual([]);

    lireProduits.mockResolvedValueOnce({ data: produitsExemple(), error: null });
    await act(() => result.current.recharger());
    expect(result.current.erreur).toBeNull();
    expect(result.current.produits).toHaveLength(4);
  });
});

describe("partage du résultat du simulateur", () => {
  async function afficherResultat() {
    const { default: StepResultat } = await import("../simulateur/StepResultat");
    const { getDict } = await import("../../lib/translations");
    const { getRoom, getSurfaces } = await import("../../lib/rooms");
    const room = getRoom("salon");
    rendreAvecLangue(
      <StepResultat
        room={room}
        surfaces={getSurfaces(room, "sol")}
        produit={produitsExemple()[0]}
        nomProduit="Étoile"
        uniteLabel="DT / m²"
        reglages={{ format: null, rotation: 0, jointWidth: 2, jointColor: "#ffffff", reflet: { actif: true, opacite: 0.4, flou: 3 } }}
        texts={getDict("fr").wizard.resultat}
        roomLabel="Salon"
        surfaceLabel="Sol"
        locale="fr"
        onStartOver={() => {}}
      />
    );
  }

  it("partage l'image du rendu quand le téléphone le permet", async () => {
    const partager = vi.fn(async () => {});
    Object.assign(navigator, { share: partager, canShare: () => true });
    await afficherResultat();
    await userEvent.setup().click(screen.getByRole("button", { name: "Partager" }));
    await waitFor(() => expect(partager).toHaveBeenCalled());
    const donnees = partager.mock.calls[0][0];
    expect(donnees.title).toBe("Ma simulation BOCARO");
    expect(donnees.files[0].name).toBe("bocaro-simulation-salon-sol.png");
    delete navigator.share;
    delete navigator.canShare;
  });

  it("télécharge l'image si le partage n'existe pas (ordinateur)", async () => {
    const clic = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await afficherResultat();
    await userEvent.setup().click(screen.getByRole("button", { name: "Partager" }));
    await waitFor(() => expect(clic).toHaveBeenCalled());
  });
});
