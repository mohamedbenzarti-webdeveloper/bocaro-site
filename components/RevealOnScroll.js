"use client";

import { useEffect } from "react";

// Fait apparaître les éléments .reveal quand ils entrent à l'écran.
// Un seul observateur pour tout le site ; les éléments ajoutés plus tard
// (navigation, filtre du catalogue…) sont pris en charge automatiquement.
// La classe "js-reveal" n'est posée qu'ici : sans JavaScript, tout reste
// visible.
export default function RevealOnScroll() {
  useEffect(() => {
    document.documentElement.classList.add("js-reveal");
    const afficher = (el) => el.classList.add("is-visible");

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(afficher);
      return;
    }

    const observateur = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (e.isIntersecting) {
            afficher(e.target);
            observateur.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    const surveiller = (racine) => {
      if (racine.nodeType !== 1) return;
      if (racine.matches(".reveal:not(.is-visible)")) observateur.observe(racine);
      racine.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => observateur.observe(el));
    };
    surveiller(document.body);

    const mutations = new MutationObserver((liste) => {
      liste.forEach((m) => m.addedNodes.forEach(surveiller));
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observateur.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
