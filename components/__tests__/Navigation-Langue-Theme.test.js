// @vitest-environment jsdom
// Barre de navigation, choix de la langue et mode nuit.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "../Navbar";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeToggle from "../ThemeToggle";
import { useLanguage } from "../../context/LanguageContext";
import { rendreAvecLangue } from "../../tests/utils";

beforeEach(() => {
  document.cookie = "bocaro-locale=; max-age=0; path=/";
  localStorage.clear();
});

describe("Navbar", () => {
  const navBureau = () => screen.getAllByRole("navigation")[0];
  const menuMobile = () => document.getElementById("menu-mobile");
  const boutonMenu = () => screen.getByRole("button", { name: "Ouvrir ou fermer le menu" });

  it("affiche les cinq pages et WhatsApp", () => {
    rendreAvecLangue(<Navbar />);
    const liens = within(navBureau()).getAllByRole("link").map((l) => [l.textContent, l.getAttribute("href")]);
    expect(liens).toEqual([
      ["Accueil", "/"],
      ["À propos", "/a-propos"],
      ["Produits", "/produits"],
      ["Simulateur", "/simulateur"],
      ["Contact", "/contact"],
    ]);
    expect(screen.getAllByRole("link", { name: /WhatsApp/ })[0]).toHaveAttribute("href", "https://wa.me/21698514014");
  });

  it("marque la page active, y compte une fiche produit sous « Produits »", () => {
    vi.mocked(usePathname).mockReturnValue("/produits/p1");
    rendreAvecLangue(<Navbar />);
    expect(within(navBureau()).getByRole("link", { name: "Produits" })).toHaveAttribute("aria-current", "page");
    expect(within(navBureau()).getByRole("link", { name: "Accueil" })).not.toHaveAttribute("aria-current");
  });

  it("l'accueil n'est actif que sur la page d'accueil", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    rendreAvecLangue(<Navbar />);
    expect(within(navBureau()).getByRole("link", { name: "Accueil" })).toHaveAttribute("aria-current", "page");
    expect(within(navBureau()).getAllByRole("link").filter((l) => l.hasAttribute("aria-current"))).toHaveLength(1);
  });

  it("le menu mobile s'ouvre, bloque la page derrière et se referme", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<Navbar />);
    expect(boutonMenu()).toHaveAttribute("aria-expanded", "false");
    expect(menuMobile()).toHaveAttribute("inert");

    await u.click(boutonMenu());
    expect(boutonMenu()).toHaveAttribute("aria-expanded", "true");
    expect(menuMobile()).not.toHaveAttribute("inert");
    expect(document.documentElement.style.overflow).toBe("hidden");

    await u.click(within(menuMobile()).getByRole("link", { name: "Contact" }));
    expect(boutonMenu()).toHaveAttribute("aria-expanded", "false");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("le menu fermé est retiré du parcours clavier (inert)", () => {
    rendreAvecLangue(<Navbar />);
    expect(menuMobile()).toHaveAttribute("inert");
  });
});

describe("Langue", () => {
  function LangueActive() {
    const { locale } = useLanguage();
    return <output aria-label="langue">{locale}</output>;
  }

  it("applique la langue et le sens d'écriture à la page", () => {
    rendreAvecLangue(<LangueActive />, { locale: "ar" });
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("changer de langue mémorise le choix et recharge les textes du serveur", async () => {
    const u = userEvent.setup();
    const routeur = useRouter();
    rendreAvecLangue(
      <>
        <LanguageSwitcher />
        <LangueActive />
      </>
    );
    await u.click(screen.getByRole("button", { name: "Changer de langue" }));
    await u.click(screen.getByRole("button", { name: /English/ }));
    expect(screen.getByLabelText("langue")).toHaveTextContent("en");
    expect(document.cookie).toContain("bocaro-locale=en");
    expect(localStorage.getItem("bocaro-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(routeur.refresh).toHaveBeenCalled();
  });

  it("choisir la langue déjà active ne recharge rien", async () => {
    const u = userEvent.setup();
    const routeur = useRouter();
    routeur.refresh.mockClear();
    rendreAvecLangue(<LanguageSwitcher />);
    await u.click(screen.getByRole("button", { name: "Changer de langue" }));
    await u.click(screen.getByRole("button", { name: /Français/ }));
    expect(routeur.refresh).not.toHaveBeenCalled();
  });

  it("reprend une langue choisie avant l'existence du cookie", () => {
    localStorage.setItem("bocaro-locale", "ar");
    rendreAvecLangue(<LangueActive />);
    expect(screen.getByLabelText("langue")).toHaveTextContent("ar");
    expect(document.cookie).toContain("bocaro-locale=ar");
  });

  it("useLanguage hors du fournisseur signale l'erreur", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<LangueActive />)).toThrow(/LanguageProvider/);
  });
});

describe("ThemeToggle", () => {
  it("passe en mode nuit, le mémorise, puis revient en mode jour", async () => {
    const u = userEvent.setup();
    rendreAvecLangue(<ThemeToggle />);
    const bouton = screen.getByRole("button", { name: "Changer de thème (jour / nuit)" });
    expect(bouton).toHaveAttribute("aria-pressed", "false");

    await u.click(bouton);
    expect(document.documentElement).toHaveClass("dark");
    expect(bouton).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("bocaro-theme")).toBe("dark");

    await u.click(bouton);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("bocaro-theme")).toBe("light");
  });

  it("reflète le thème déjà appliqué au chargement", () => {
    document.documentElement.classList.add("dark");
    rendreAvecLangue(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Changer de thème (jour / nuit)" })).toHaveAttribute("aria-pressed", "true");
  });
});
