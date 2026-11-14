// Préparation commune à tous les tests Vitest.
import { afterEach, expect, vi } from "vitest";
import { createElement } from "react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Assertions DOM lisibles : toBeInTheDocument, toHaveAttribute, etc.
expect.extend(matchers);

// Fonctions du navigateur absentes de jsdom, remplacées par des versions
// simples (thème système clair, animations normales, galerie visible).
if (typeof window !== "undefined") {
  window.matchMedia ??= (requete) => ({
    matches: false,
    media: requete,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  window.IntersectionObserver ??= class {
    constructor(rappel) {
      this.rappel = rappel;
    }
    observe(el) {
      this.rappel([{ isIntersecting: true, target: el }]);
    }
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= function () {};
  window.scrollTo = () => {};
  URL.createObjectURL ??= (f) => `blob:test/${f?.name ?? "fichier"}`;
  URL.revokeObjectURL ??= () => {};
}

// Nettoyage du DOM entre deux tests (composants).
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
  }
});

// --- Modules propres à Next.js, remplacés par des versions de test ---

// <Link> → simple lien.
vi.mock("next/link", () => ({
  default: ({ href, children, prefetch, scroll, replace, ...reste }) =>
    createElement("a", { href: typeof href === "string" ? href : href?.pathname, ...reste }, children),
}));

// <Image> → <img> (sans l'optimiseur).
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, preload, priority, sizes, quality, placeholder, ...reste }) =>
    createElement("img", { src, alt, ...reste }),
}));

// Navigation : fonctions espionnables ; redirect() lève la même erreur
// que Next.js (digest NEXT_REDIRECT) pour pouvoir la vérifier.
const routeur = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => routeur),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  notFound: vi.fn(() => {
    throw Object.assign(new Error("NEXT_NOT_FOUND"), { digest: "NEXT_NOT_FOUND" });
  }),
  redirect: vi.fn((url) => {
    throw Object.assign(new Error(`NEXT_REDIRECT ${url}`), { digest: `NEXT_REDIRECT;replace;${url}` });
  }),
}));
