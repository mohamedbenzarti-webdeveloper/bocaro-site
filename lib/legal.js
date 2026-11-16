// Textes des pages Politique de confidentialité et Mentions légales, dans
// les trois langues du site. Ils décrivent ce que le site fait réellement :
// à mettre à jour si une collecte de données change (nouveau formulaire,
// outil de mesure d'audience, nouveau service tiers…).
//
// Cadre légal : loi organique tunisienne n° 2004-63 du 27 juillet 2004
// portant sur la protection des données à caractère personnel (autorité :
// INPDP) ; RGPD pour les clients situés dans l'Union européenne.

import { ENTREPRISE, SITE_URL } from "./site";

/** Durée de conservation des demandes reçues (devis, messages), en mois. */
export const RETENTION_DEMANDES_MOIS = 12;

/** Date de la dernière mise à jour des deux pages. */
export const MISE_A_JOUR = "2026-11-16";

const domaine = new URL(SITE_URL).host;
// Numéros isolés (caractères Unicode LRI … PDI) : ils restent écrits de
// gauche à droite dans le texte arabe, sinon « +216 98 514 014 »
// s'afficherait à l'envers.
const LRI = String.fromCharCode(0x2066); // début d'isolement gauche → droite
const PDI = String.fromCharCode(0x2069); // fin d'isolement
const isoler = (texte) => `${LRI}${texte}${PDI}`;
const tels = ENTREPRISE.telephones.map((t) =>
  isoler(t.replace(/^\+216/, "+216 ").replace(/(\d{2})(\d{3})(\d{3})$/, "$1 $2 $3"))
);

const CONFIDENTIALITE = {
  fr: {
    titre: "Politique de confidentialité",
    intro:
      "Cette page explique quelles données personnelles le site BOCARO recueille, pourquoi, combien de temps elles sont gardées et comment exercer vos droits. Le site ne vend aucune donnée et n'utilise aucun outil publicitaire ni de mesure d'audience.",
    majLabel: "Dernière mise à jour",
    sections: [
      {
        titre: "Responsable du traitement",
        texte: [
          `${ENTREPRISE.nom} (CAROANTIKA), ${ENTREPRISE.adresse.rue}, ${ENTREPRISE.adresse.ville}, Tunisie.`,
          `Contact : ${ENTREPRISE.email} · WhatsApp ${tels.join(" / ")}.`,
        ],
      },
      {
        titre: "Données recueillies et finalités",
        liste: [
          "Formulaire de contact et boutons WhatsApp : nom, adresse e-mail et message que vous saisissez, ou le récapitulatif de votre simulation. Le site ne les enregistre pas : ils sont préparés dans votre navigateur et transmis par WhatsApp. Ils servent uniquement à répondre à votre demande.",
          "Simulateur : aucune photo ni donnée ne quitte votre appareil. Le rendu est calculé dans votre navigateur à partir de nos propres photos de pièces.",
          "Espace direction : adresse e-mail et session de connexion des seuls administrateurs du site.",
        ],
      },
      {
        titre: "Durée de conservation",
        texte: [
          `Les demandes reçues (devis, messages) sont conservées ${RETENTION_DEMANDES_MOIS} mois au plus après le dernier échange, puis supprimées, sauf si elles donnent lieu à une commande : les documents commerciaux sont alors conservés pendant la durée imposée par la loi.`,
        ],
      },
      {
        titre: "Cookies et stockage dans le navigateur",
        texte: ["Le site n'utilise que des cookies nécessaires à son fonctionnement ; aucun consentement n'est donc demandé :"],
        liste: [
          "bocaro-locale (cookie, 1 an) : la langue choisie.",
          "bocaro-theme (stockage local) : le mode jour ou nuit choisi.",
          "Cookies de session Supabase : uniquement pour les administrateurs connectés à l'espace direction.",
        ],
      },
      {
        titre: "Services tiers",
        liste: [
          "Supabase : hébergement de la base de données et des photos des produits.",
          "WhatsApp (Meta) : acheminement des messages que vous choisissez d'envoyer ; sa propre politique de confidentialité s'applique.",
          "Google Maps : la carte de la page Contact n'est chargée que si vous cliquez sur « Afficher la carte » ; Google peut alors déposer ses propres cookies.",
          "Instagram : les photos de nos publications sont affichées via notre serveur ; votre navigateur ne contacte pas Instagram.",
        ],
      },
      {
        titre: "Vos droits",
        texte: [
          "Conformément à la loi organique n° 2004-63 du 27 juillet 2004, vous pouvez demander l'accès à vos données, leur rectification ou leur suppression, et vous opposer à leur traitement. Les clients situés dans l'Union européenne disposent des mêmes droits au titre du RGPD, ainsi que du droit à la portabilité.",
          `Pour exercer ces droits, écrivez à ${ENTREPRISE.email}. Nous répondons dans un délai d'un mois. Vous pouvez aussi saisir l'Instance nationale de protection des données personnelles (INPDP, www.inpdp.tn).`,
        ],
      },
      {
        titre: "Sécurité",
        texte: [
          "Le site est servi en HTTPS. L'accès aux données est réservé aux administrateurs, contrôlé par la base de données elle-même, et le site applique une politique de sécurité qui bloque l'exécution de scripts étrangers.",
        ],
      },
    ],
  },
  en: {
    titre: "Privacy policy",
    intro:
      "This page explains which personal data the BOCARO website collects, why, how long it is kept and how to exercise your rights. The site sells no data and uses no advertising or audience-measurement tools.",
    majLabel: "Last updated",
    sections: [
      {
        titre: "Data controller",
        texte: [
          `${ENTREPRISE.nom} (CAROANTIKA), ${ENTREPRISE.adresse.rue}, ${ENTREPRISE.adresse.ville}, Tunisia.`,
          `Contact: ${ENTREPRISE.email} · WhatsApp ${tels.join(" / ")}.`,
        ],
      },
      {
        titre: "Data collected and purposes",
        liste: [
          "Contact form and WhatsApp buttons: the name, email address and message you enter, or the summary of your simulation. The site does not store them: they are prepared in your browser and sent through WhatsApp, only to answer your request.",
          "Simulator: no photo or data leaves your device. The rendering is computed in your browser from our own room photos.",
          "Management area: email address and login session of the site administrators only.",
        ],
      },
      {
        titre: "Retention period",
        texte: [
          `Requests received (quotes, messages) are kept for at most ${RETENTION_DEMANDES_MOIS} months after the last exchange, then deleted, unless they lead to an order: business records are then kept for the period required by law.`,
        ],
      },
      {
        titre: "Cookies and browser storage",
        texte: ["The site only uses cookies required for it to work, so no consent is requested:"],
        liste: [
          "bocaro-locale (cookie, 1 year): your chosen language.",
          "bocaro-theme (local storage): your chosen light or dark mode.",
          "Supabase session cookies: only for administrators logged in to the management area.",
        ],
      },
      {
        titre: "Third-party services",
        liste: [
          "Supabase: hosting of the database and product photos.",
          "WhatsApp (Meta): delivery of the messages you choose to send; its own privacy policy applies.",
          "Google Maps: the map on the Contact page only loads if you click “Show map”; Google may then set its own cookies.",
          "Instagram: photos from our posts are displayed through our server; your browser does not contact Instagram.",
        ],
      },
      {
        titre: "Your rights",
        texte: [
          "Under Tunisian Organic Law No. 2004-63 of 27 July 2004, you may request access to, correction or deletion of your data, and object to its processing. Customers in the European Union have the same rights under the GDPR, plus the right to data portability.",
          `To exercise these rights, write to ${ENTREPRISE.email}. We reply within one month. You may also contact the Tunisian data protection authority (INPDP, www.inpdp.tn).`,
        ],
      },
      {
        titre: "Security",
        texte: [
          "The site is served over HTTPS. Access to data is restricted to administrators and enforced by the database itself, and the site applies a security policy that blocks foreign scripts.",
        ],
      },
    ],
  },
  ar: {
    titre: "سياسة الخصوصية",
    intro:
      "توضّح هذه الصفحة البيانات الشخصية التي يجمعها موقع BOCARO، وسبب جمعها، ومدة الاحتفاظ بها، وكيفية ممارسة حقوقكم. لا يبيع الموقع أي بيانات ولا يستعمل أي أداة إعلانية أو لقياس عدد الزوار.",
    majLabel: "آخر تحديث",
    sections: [
      {
        titre: "المسؤول عن المعالجة",
        texte: [
          `${ENTREPRISE.nom} (CAROANTIKA)، ${ENTREPRISE.adresse.rue}، ${ENTREPRISE.adresse.ville}، تونس.`,
          `للتواصل: ${ENTREPRISE.email} · واتساب ${tels.join(" / ")}.`,
        ],
      },
      {
        titre: "البيانات المجمّعة والغرض منها",
        liste: [
          "نموذج الاتصال وأزرار واتساب: الاسم والبريد الإلكتروني والرسالة التي تكتبونها، أو ملخّص المحاكاة. لا يحفظها الموقع: تُحضَّر في متصفحكم وتُرسَل عبر واتساب للرد على طلبكم فقط.",
          "المحاكي: لا تغادر أي صورة أو بيانات جهازكم، إذ يُحسَب العرض في متصفحكم انطلاقًا من صور الغرف الخاصة بنا.",
          "فضاء الإدارة: البريد الإلكتروني وجلسة الدخول الخاصة بمسؤولي الموقع فقط.",
        ],
      },
      {
        titre: "مدة الاحتفاظ",
        texte: [
          `تُحفظ الطلبات المستلمة (عروض الأسعار والرسائل) مدة أقصاها ${RETENTION_DEMANDES_MOIS} شهرًا بعد آخر تواصل، ثم تُحذف، إلا إذا أفضت إلى طلبية، فتُحفظ الوثائق التجارية حينها طوال المدة التي يفرضها القانون.`,
        ],
      },
      {
        titre: "ملفات تعريف الارتباط والتخزين في المتصفح",
        texte: ["لا يستعمل الموقع إلا ملفات تعريف الارتباط الضرورية لعمله، لذلك لا يُطلب أي إذن:"],
        liste: [
          "bocaro-locale (ملف تعريف ارتباط، سنة واحدة): اللغة المختارة.",
          "bocaro-theme (تخزين محلي): الوضع النهاري أو الليلي المختار.",
          "ملفات جلسة Supabase: للمسؤولين المتصلين بفضاء الإدارة فقط.",
        ],
      },
      {
        titre: "خدمات الأطراف الثالثة",
        liste: [
          "Supabase: استضافة قاعدة البيانات وصور المنتجات.",
          "واتساب (Meta): إيصال الرسائل التي تختارون إرسالها، وتنطبق عليه سياسة الخصوصية الخاصة به.",
          "خرائط Google: لا تُحمَّل خريطة صفحة الاتصال إلا عند النقر على «عرض الخريطة»، وقد تضع Google حينها ملفات تعريف الارتباط الخاصة بها.",
          "إنستغرام: تُعرض صور منشوراتنا عبر خادمنا، ولا يتصل متصفحكم بإنستغرام.",
        ],
      },
      {
        titre: "حقوقكم",
        texte: [
          "طبقًا للقانون الأساسي عدد 63 لسنة 2004 المؤرخ في 27 جويلية 2004، يمكنكم طلب النفاذ إلى بياناتكم أو تصحيحها أو حذفها، والاعتراض على معالجتها. ويتمتع الحرفاء المقيمون في الاتحاد الأوروبي بالحقوق نفسها بموجب اللائحة العامة لحماية البيانات، إضافةً إلى الحق في نقل البيانات.",
          `لممارسة هذه الحقوق، راسلونا على ${ENTREPRISE.email}، ونرد في أجل أقصاه شهر. كما يمكنكم التوجه إلى الهيئة الوطنية لحماية المعطيات الشخصية (www.inpdp.tn).`,
        ],
      },
      {
        titre: "الأمان",
        texte: [
          "يُقدَّم الموقع عبر HTTPS، والنفاذ إلى البيانات مقصور على المسؤولين وتفرضه قاعدة البيانات نفسها، كما يطبّق الموقع سياسة أمان تمنع تنفيذ البرامج النصية الأجنبية.",
        ],
      },
    ],
  },
};

/** Lignes d'identification de l'éditeur : seulement les champs renseignés. */
function identite(l) {
  const e = ENTREPRISE;
  const libelles = {
    fr: { forme: "Forme juridique", mf: "Matricule fiscal", rne: "Registre national des entreprises", dir: "Directeur de la publication" },
    en: { forme: "Legal form", mf: "Tax ID", rne: "National business register", dir: "Publication director" },
    ar: { forme: "الشكل القانوني", mf: "المعرّف الجبائي", rne: "السجل الوطني للمؤسسات", dir: "مدير النشر" },
  }[l];
  return [
    e.formeJuridique && `${libelles.forme} : ${e.formeJuridique}`,
    e.matriculeFiscal && `${libelles.mf} : ${e.matriculeFiscal}`,
    e.registreCommerce && `${libelles.rne} : ${e.registreCommerce}`,
    e.directeurPublication && `${libelles.dir} : ${e.directeurPublication}`,
  ].filter(Boolean);
}

function hebergement(l) {
  const h = ENTREPRISE.hebergeur;
  const site = h ? [`${h.nom}, ${h.adresse}${h.site ? ` (${h.site})` : ""}.`] : [];
  const donnees = {
    fr: "Base de données et photos : Supabase Inc. (supabase.com).",
    en: "Database and photos: Supabase Inc. (supabase.com).",
    ar: "قاعدة البيانات والصور: Supabase Inc. (supabase.com).",
  }[l];
  return [...site, donnees];
}

const MENTIONS = {
  fr: () => ({
    titre: "Mentions légales",
    intro: `Informations sur l'éditeur et l'hébergement du site ${domaine}.`,
    majLabel: "Dernière mise à jour",
    sections: [
      {
        titre: "Éditeur du site",
        texte: [
          `${ENTREPRISE.nom} (CAROANTIKA), fabricant de carreaux céramiques et de faïence faits main depuis ${ENTREPRISE.fondation}.`,
          `${ENTREPRISE.adresse.rue}, ${ENTREPRISE.adresse.ville}, Tunisie.`,
          `E-mail : ${ENTREPRISE.email} · Téléphone / WhatsApp : ${tels.join(" / ")}.`,
          ...identite("fr"),
        ],
      },
      { titre: "Hébergement", texte: hebergement("fr") },
      {
        titre: "Propriété intellectuelle",
        texte: [
          "Les textes, photographies, motifs de carreaux, logos et la marque BOCARO / CAROANTIKA sont la propriété de BOCARO. Toute reproduction, même partielle, sans autorisation écrite est interdite.",
        ],
      },
      {
        titre: "Prix et simulateur",
        texte: [
          "Les prix affichés sont indicatifs, en dinars tunisiens par mètre carré ; seul un devis confirmé engage BOCARO. Les rendus du simulateur sont des aperçus : les couleurs et motifs réels des carreaux faits main peuvent varier.",
        ],
      },
      {
        titre: "Données personnelles",
        texte: ["Le traitement des données personnelles est décrit dans la politique de confidentialité."],
        lien: { href: "/confidentialite", libelle: "Politique de confidentialité" },
      },
      { titre: "Droit applicable", texte: ["Le site et ces mentions sont soumis au droit tunisien."] },
    ],
  }),
  en: () => ({
    titre: "Legal notice",
    intro: `Information about the publisher and hosting of ${domaine}.`,
    majLabel: "Last updated",
    sections: [
      {
        titre: "Publisher",
        texte: [
          `${ENTREPRISE.nom} (CAROANTIKA), maker of handmade ceramic tiles and faience since ${ENTREPRISE.fondation}.`,
          `${ENTREPRISE.adresse.rue}, ${ENTREPRISE.adresse.ville}, Tunisia.`,
          `Email: ${ENTREPRISE.email} · Phone / WhatsApp: ${tels.join(" / ")}.`,
          ...identite("en"),
        ],
      },
      { titre: "Hosting", texte: hebergement("en") },
      {
        titre: "Intellectual property",
        texte: [
          "Texts, photographs, tile patterns, logos and the BOCARO / CAROANTIKA brand are the property of BOCARO. Any reproduction, even partial, without written permission is prohibited.",
        ],
      },
      {
        titre: "Prices and simulator",
        texte: [
          "Prices shown are indicative, in Tunisian dinars per square metre; only a confirmed quote binds BOCARO. Simulator renderings are previews: the actual colours and patterns of handmade tiles may vary.",
        ],
      },
      {
        titre: "Personal data",
        texte: ["The processing of personal data is described in the privacy policy."],
        lien: { href: "/confidentialite", libelle: "Privacy policy" },
      },
      { titre: "Governing law", texte: ["This site and this notice are governed by Tunisian law."] },
    ],
  }),
  ar: () => ({
    titre: "البيانات القانونية",
    intro: `معلومات حول ناشر الموقع ${domaine} واستضافته.`,
    majLabel: "آخر تحديث",
    sections: [
      {
        titre: "ناشر الموقع",
        texte: [
          `${ENTREPRISE.nom} (CAROANTIKA)، مصنع بلاط خزفي وخزف مصنوع يدويًا منذ ${ENTREPRISE.fondation}.`,
          `${ENTREPRISE.adresse.rue}، ${ENTREPRISE.adresse.ville}، تونس.`,
          `البريد الإلكتروني: ${ENTREPRISE.email} · الهاتف / واتساب: ${tels.join(" / ")}.`,
          ...identite("ar"),
        ],
      },
      { titre: "الاستضافة", texte: hebergement("ar") },
      {
        titre: "الملكية الفكرية",
        texte: [
          "النصوص والصور وزخارف البلاط والشعارات وعلامة BOCARO / CAROANTIKA ملك لـ BOCARO. يُمنع أي استنساخ، ولو جزئي، دون إذن كتابي.",
        ],
      },
      {
        titre: "الأسعار والمحاكي",
        texte: [
          "الأسعار المعروضة تقريبية، بالدينار التونسي للمتر المربع، ولا يُلزم BOCARO إلا عرض سعر مؤكَّد. صور المحاكي معاينات فقط، وقد تختلف الألوان والزخارف الحقيقية للبلاط المصنوع يدويًا.",
        ],
      },
      {
        titre: "البيانات الشخصية",
        texte: ["تُوصف معالجة البيانات الشخصية في سياسة الخصوصية."],
        lien: { href: "/confidentialite", libelle: "سياسة الخصوصية" },
      },
      { titre: "القانون المنطبق", texte: ["يخضع الموقع وهذه البيانات للقانون التونسي."] },
    ],
  }),
};

export function confidentialite(locale) {
  return CONFIDENTIALITE[locale] ?? CONFIDENTIALITE.fr;
}

export function mentionsLegales(locale) {
  return (MENTIONS[locale] ?? MENTIONS.fr)();
}

/** Champs des mentions légales encore à compléter dans lib/site.js. */
export function mentionsManquantes() {
  return ["formeJuridique", "matriculeFiscal", "registreCommerce", "directeurPublication", "hebergeur"].filter((c) => !ENTREPRISE[c]);
}
