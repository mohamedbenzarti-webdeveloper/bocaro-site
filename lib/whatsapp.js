// Messages WhatsApp préremplis envoyés depuis le site (simulateur et page
// Contact). Fonctions pures : testées dans lib/__tests__/whatsapp.test.js.
// Mise en forme WhatsApp : *texte* = gras, _texte_ = italique.

export const NUMERO_WHATSAPP = "21698514014";

/** Lien wa.me qui ouvre WhatsApp avec le message prérempli. */
export function lienWhatsApp(texte, numero = NUMERO_WHATSAPP) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`;
}

/**
 * Message envoyé après une simulation : présentation, récapitulatif
 * (carreau, prix, pièce, format, pose, lien de la fiche), demande précise
 * avec la surface à compléter, formule de politesse.
 *
 * textes : dictionnaire wizard.resultat.wa de la langue active.
 */
export function messageSimulation(textes, {
  nomProduit,
  type,
  prix,
  piece,
  format,
  rotation = 0,
  joint,
  lienFiche,
}) {
  const w = textes;
  const lignes = [
    w.greeting,
    "",
    w.intro,
    "",
    `*${w.sectionSimulation}*`,
    `• ${w.product} : ${nomProduit}${type ? ` (${type})` : ""}`,
    prix ? `• ${w.price} : ${prix}` : null,
    `• ${w.room} : ${piece}`,
    format ? `• ${w.format} : ${format}` : null,
    `• ${w.pose} : ${w.rotation} ${rotation}° · ${w.joint} ${joint} mm`,
    lienFiche ? `• ${w.link} : ${lienFiche}` : null,
    "",
    `*${w.sectionRequest}*`,
    `• ${w.surface}`,
    ...w.requests.map((r) => `• ${r}`),
    "",
    w.thanks,
    w.signature,
  ];
  return lignes.filter((l) => l !== null).join("\n");
}

/**
 * Message du formulaire de contact : salutation, coordonnées, message
 * séparé, remerciement et mention de la page d'origine.
 *
 * textes : dictionnaire contact de la langue active.
 */
export function messageContact(textes, { nom, email, message }) {
  const c = textes;
  return [
    c.waGreeting,
    "",
    c.waIntro,
    "",
    `*${c.waSection}*`,
    `• ${c.waName} : ${String(nom ?? "").trim()}`,
    `• ${c.waEmail} : ${String(email ?? "").trim()}`,
    "",
    `*${c.waMessage}*`,
    String(message ?? "").trim(),
    "",
    c.waThanks,
    "",
    `_${c.waFooter}_`,
  ].join("\n");
}
