"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const chemin = usePathname();
  // Lien actif : page exacte pour l'accueil, sinon la section entière
  // (ex. une fiche produit garde « Produits » actif).
  const estActif = (href) =>
    href === "/" ? chemin === "/" : chemin === href || chemin.startsWith(href + "/");

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/a-propos", label: t.nav.about },
    { href: "/produits", label: t.nav.catalogue },
    { href: "/simulateur", label: t.nav.simulator },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    // Barre ivoire pleine, séparée de la page par un simple filet sable
    // (plus d'ombre ni de flou).
    <header className="sticky top-0 z-50 bg-surface border-b border-bocaro-200">
      <div className="container-app flex items-center justify-between h-20">
        <Link href="/" aria-label="BOCARO — Accueil" className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <span aria-hidden="true" className="logo-oiseau w-11 h-10 sm:w-14 sm:h-12 shrink-0 text-bocaro-950" />
          <span aria-hidden="true" className="w-px h-9 sm:h-11 bg-current opacity-60 text-bocaro-950 shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="font-sans text-xl sm:text-2xl font-semibold tracking-[0.12em] text-bocaro-950">
              BOCARO
            </span>
            <span className="mt-1 text-[10px] sm:text-[11px] tracking-[0.32em] whitespace-nowrap text-bocaro-950/70 font-normal uppercase">
              Caroantika
            </span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={estActif(link.href) ? "page" : undefined}
              className="lien-anime text-[13px] font-medium uppercase tracking-[0.14em] text-bocaro-950 hover:text-brand-600 aria-[current=page]:text-brand-600 transition-colors pb-1"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <LanguageSwitcher />
          <a
            href="https://wa.me/21698514014"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm"
          >
            WhatsApp
          </a>
        </div>

        <div className="lg:hidden flex items-center gap-1.5 sm:gap-3">
          {/* Sous 380 px, le bouton thème passe dans le menu (sinon il
              chevauche le logo). */}
          <div className="hidden min-[380px]:block">
            <ThemeToggle />
          </div>
          <LanguageSwitcher />
          {/* Bouton du menu : les trois traits se transforment en croix
              (rotation avec léger rebond), et le bouton s'enfonce au toucher. */}
          <button
            className="group w-11 h-11 -me-2 relative rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-bocaro-50 active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bocaro-300 aria-expanded:bg-bocaro-50"
            onClick={() => setOpen(!open)}
            aria-label={t.nav.menu}
            aria-expanded={open}
            aria-controls="menu-mobile"
          >
            <span aria-hidden="true" className="relative block w-6 h-4 text-bocaro-950">
              <span
                className={`absolute left-0 top-0 h-0.5 w-6 rounded-full bg-current origin-center transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-0.5 rounded-full bg-current transition-all duration-300 ${
                  open ? "w-0 opacity-0 translate-x-3" : "w-4 group-hover:w-6"
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-0.5 w-6 rounded-full bg-current origin-center transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        inert={!open}
        className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        {/* Panneau plein écran : grands liens en serif, séparés par des
            filets, puis l'adresse et WhatsApp en bas. */}
        <div className="overflow-hidden bg-surface">
          <nav className="container-app flex flex-col pt-6 pb-8 min-h-[calc(100dvh-5rem)] overflow-y-auto">
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={estActif(link.href) ? "page" : undefined}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
                className={`flex items-baseline justify-between gap-4 py-4 font-serif text-[2rem] leading-tight text-bocaro-950 aria-[current=page]:text-brand-600 border-b border-bocaro-200 transition-all duration-300 ${
                  open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 rtl:translate-x-3"
                }`}
              >
                {link.label}
                <span aria-hidden="true" className="text-base font-sans text-bocaro-400 rtl:-scale-x-100">→</span>
              </Link>
            ))}
            <div className="min-[380px]:hidden flex items-center justify-between py-4">
              <span className="text-sm text-bocaro-600">{t.nav.theme}</span>
              <ThemeToggle />
            </div>
            <div className="mt-auto pt-10">
              <p className="text-sm text-bocaro-600 mb-4">Rue Ras Jedir, Soukra, Tunis</p>
              <a
                href="https://wa.me/21698514014"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm w-full"
              >
                {t.nav.whatsappCta}
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
