"use client";

import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-bocaro-950 text-white">
      {/* Frise de carreaux : signature de la marque en bas de chaque page */}
      <div aria-hidden="true" className="h-7 bg-[url('/images/carreaux/frise-carreaux.webp')] bg-[length:112px_28px] bg-repeat-x" />
      <div className="container-app py-16 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1.2fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-3.5 mb-5">
            <span aria-hidden="true" className="logo-oiseau w-14 h-12 shrink-0 text-white" />
            <span aria-hidden="true" className="w-px h-11 bg-white/40 shrink-0" />
            <span className="flex flex-col leading-none">
              <span className="font-sans text-2xl font-semibold tracking-[0.12em]">BOCARO</span>
              <span className="text-[11px] tracking-[0.32em] whitespace-nowrap text-white/70 font-normal uppercase mt-1">
                Caroantika
              </span>
            </span>
          </div>
          <p className="text-bocaro-200 text-sm leading-relaxed max-w-xs">
            {t.footer.tagline}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] mb-5 text-brand-300">
            {t.footer.navTitle}
          </h2>
          <ul className="text-sm text-bocaro-200">
            <li><Link href="/" className="inline-block py-2 hover:text-white">{t.nav.home}</Link></li>
            <li><Link href="/a-propos" className="inline-block py-2 hover:text-white">{t.nav.about}</Link></li>
            <li><Link href="/produits" className="inline-block py-2 hover:text-white">{t.nav.catalogue}</Link></li>
            <li><Link href="/simulateur" className="inline-block py-2 hover:text-white">{t.nav.simulator}</Link></li>
            <li><Link href="/contact" className="inline-block py-2 hover:text-white">{t.nav.contact}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] mb-5 text-brand-300">{t.footer.contactTitle}</h2>
          <ul className="space-y-2 text-sm text-bocaro-200">
            <li>Rue Ras Jedir, Soukra, Tunis</li>
            <li>
              <a href="mailto:bocaro_tunisia@yahoo.com" className="inline-block py-2 hover:text-white">
                bocaro_tunisia@yahoo.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/21698514014" className="inline-block py-2 hover:text-white">
                WhatsApp : +216 98 514 014
              </a>
            </li>
            <li>
              <a href="https://wa.me/21622447900" className="inline-block py-2 hover:text-white">
                WhatsApp : +216 22 447 900
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] mb-5 text-brand-300">{t.footer.hoursTitle}</h2>
          <ul className="space-y-2 text-sm text-bocaro-200">
            <li>{t.footer.hours1}</li>
            <li>{t.footer.hours2}</li>
          </ul>
          <div className="flex gap-3 mt-5">
            <a
              href="https://www.facebook.com/CAROANTIKA"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full bg-bocaro-800 flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/caroantika_officiel/"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-bocaro-800 flex items-center justify-center hover:bg-brand-500 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 01-1.15 1.77 4.9 4.9 0 01-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 01-1.77-1.15 4.9 4.9 0 01-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 015.45.53C6.09.28 6.82.11 7.88.06 8.94.01 9.28 0 12 0zm0 5a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-8.4a1.17 1.17 0 100-2.34 1.17 1.17 0 000 2.34z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-bocaro-800 py-5">
        <div className="container-app flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-bocaro-300">
          <p>© {new Date().getFullYear()} BOCARO — {t.footer.rights}</p>
          <p>{t.footer.founded}</p>
        </div>
      </div>
    </footer>
  );
}
