// Tests de bout en bout : le vrai site (serveur Next.js lancé) dans un vrai
// Chrome sans interface, piloté par le protocole DevTools. Aucune
// dépendance : Node 22+ (WebSocket intégré) et Google Chrome suffisent.
//
//   npm run dev            (dans un autre terminal)
//   npm run test:e2e
//
// Variables facultatives :
//   E2E_URL      adresse du site (défaut http://localhost:3000)
//   CHROME_PATH  chemin de Chrome (défaut : emplacement Windows standard)
//   E2E_PHOTOS_RESEAU=1  télécharge les vraies photos Supabase ; par défaut
//                elles sont remplacées par un carreau local pour que les
//                tests ne dépendent pas de la vitesse du réseau.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.env.E2E_URL || "http://localhost:3000").replace(/\/$/, "");
const CHROME =
  process.env.CHROME_PATH ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find((p) => fs.existsSync(p));
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CARREAU_LOCAL = fs.readFileSync(path.join(RACINE, "public/images/carreaux/madrid-carreau.webp")).toString("base64");

// ---------------------------------------------------------------- Chrome
async function lancerChrome() {
  if (!CHROME) throw new Error("Chrome introuvable : définissez CHROME_PATH.");
  const port = 9200 + Math.floor(Math.random() * 500);
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), "bocaro-e2e-"));
  const processus = spawn(
    CHROME,
    ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`, "--no-first-run", "--hide-scrollbars", "about:blank"],
    { stdio: "ignore" }
  );
  let ws;
  for (let i = 0; i < 80 && !ws; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((x) => x.type === "page");
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        ws.ouvert = new Promise((ok) => (ws.onopen = ok));
      }
    } catch {}
    await pause(250);
  }
  if (!ws) throw new Error("Chrome n'a pas démarré.");
  await ws.ouvert;

  let n = 0;
  const attente = new Map();
  const erreursConsole = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Fetch.requestPaused") {
      envoyerSansReponse("Fetch.fulfillRequest", {
        requestId: m.params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: "Content-Type", value: "image/webp" },
          { name: "Access-Control-Allow-Origin", value: "*" },
        ],
        body: CARREAU_LOCAL,
      });
      return;
    }
    if (m.method === "Runtime.exceptionThrown") erreursConsole.push(m.params.exceptionDetails.exception?.description?.split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
      erreursConsole.push(m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 200));
    if (m.id && attente.has(m.id)) {
      attente.get(m.id)(m);
      attente.delete(m.id);
    }
  };
  const envoyerSansReponse = (method, params) => ws.send(JSON.stringify({ id: ++n, method, params }));
  const cdp = (method, params = {}) =>
    new Promise((ok) => {
      const id = ++n;
      attente.set(id, ok);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Network.enable");
  if (process.env.E2E_PHOTOS_RESEAU !== "1") await cdp("Fetch.enable", { patterns: [{ urlPattern: "*supabase.co/storage/*" }] });

  const navigateur = {
    erreursConsole,
    async ecran(largeur, hauteur = 900) {
      await cdp("Emulation.setDeviceMetricsOverride", { width: largeur, height: hauteur, deviceScaleFactor: 1, mobile: largeur < 768 });
    },
    async langue(locale) {
      await cdp("Network.setCookie", { name: "bocaro-locale", value: locale, url: BASE });
    },
    async ouvrir(chemin) {
      erreursConsole.length = 0;
      await cdp("Page.navigate", { url: BASE + chemin });
      await this.attendre("document.readyState === 'complete'", 30000);
      await pause(800); // hydratation React
    },
    async js(expression) {
      const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "Erreur JavaScript");
      return r.result?.result?.value;
    },
    async attendre(condition, delai = 20000) {
      const debut = Date.now();
      while (Date.now() - debut < delai) {
        if (await this.js(`Boolean(${condition})`).catch(() => false)) return;
        await pause(200);
      }
      throw new Error(`Délai dépassé en attendant : ${condition}`);
    },
    async cliquer(selecteurOuTexte) {
      const ok = await this.js(`(() => {
        const cible = ${JSON.stringify(selecteurOuTexte)};
        let el = null;
        try { el = document.querySelector(cible); } catch {}
        el ??= [...document.querySelectorAll("button, a, [role=radio]")].find((e) => e.offsetParent !== null && !e.disabled && e.textContent.trim() === cible);
        el ??= [...document.querySelectorAll("button, a, [role=radio]")].find((e) => e.offsetParent !== null && !e.disabled && e.textContent.includes(cible));
        if (!el) return false;
        el.click();
        return true;
      })()`);
      if (!ok) throw new Error(`Élément introuvable : ${selecteurOuTexte}`);
      await pause(400);
    },
    async fermer() {
      ws.close();
      processus.kill();
      await pause(800);
      fs.rmSync(profil, { recursive: true, force: true });
    },
  };
  return navigateur;
}

const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---------------------------------------------------------------- Tests
const tests = [];
const test = (nom, fn) => tests.push({ nom, fn });
function verifier(condition, message) {
  if (!condition) throw new Error(message);
}

test("chaque page publique répond et s'affiche sans erreur JavaScript", async (nav) => {
  for (const chemin of ["/", "/produits", "/simulateur", "/a-propos", "/contact", "/login"]) {
    const reponse = await fetch(BASE + chemin);
    verifier(reponse.status === 200, `${chemin} : statut ${reponse.status}`);
    await nav.ouvrir(chemin);
    verifier(await nav.js("document.querySelector('h1')?.textContent.trim().length > 0"), `${chemin} : pas de titre h1`);
    const erreurs = nav.erreursConsole.filter((e) => !/Failed to load resource|upstream image/i.test(e));
    verifier(erreurs.length === 0, `${chemin} : erreurs console ${JSON.stringify(erreurs)}`);
  }
});

test("une page inconnue renvoie 404", async () => {
  const reponse = await fetch(BASE + "/page-qui-n-existe-pas");
  verifier(reponse.status === 404, `statut ${reponse.status}`);
});

test("le dashboard renvoie un visiteur non connecté vers la connexion", async (nav) => {
  await nav.ouvrir("/dashboard");
  verifier((await nav.js("location.pathname")) === "/login", "pas redirigé vers /login");
});

test("robots.txt et sitemap.xml sont servis", async () => {
  const robots = await (await fetch(BASE + "/robots.txt")).text();
  verifier(robots.includes("Disallow: /dashboard"), "robots.txt ne protège pas /dashboard");
  const sitemap = await (await fetch(BASE + "/sitemap.xml")).text();
  verifier(sitemap.includes("/produits</loc>"), "sitemap sans /produits");
});

test("la navigation marque la page active", async (nav) => {
  await nav.ecran(1440);
  await nav.ouvrir("/produits");
  verifier(
    (await nav.js("document.querySelector('header nav a[aria-current=page]')?.getAttribute('href')")) === "/produits",
    "« Produits » n'est pas marqué actif"
  );
});

test("catalogue : un filtre réduit la liste et se retire", async (nav) => {
  await nav.ecran(1440);
  await nav.ouvrir("/produits");
  await nav.attendre("document.querySelectorAll('article').length > 0");
  const compte = () => nav.js("parseInt(document.querySelector('[aria-live=polite]').textContent)");
  const total = await compte();
  await nav.cliquer("Sur mesure");
  const filtre = await compte();
  verifier(filtre > 0 && filtre < total, `filtre sans effet (${total} → ${filtre})`);
  await nav.cliquer("Réinitialiser");
  verifier((await compte()) === total, "Réinitialiser ne rend pas tout le catalogue");
});

test("fiche produit → simulateur avec le carreau présélectionné (étape Carrelage sautée)", async (nav) => {
  await nav.ecran(1280);
  await nav.ouvrir("/produits");
  await nav.attendre("document.querySelector('article a[href^=\"/produits/\"]')");
  const fiche = await nav.js("document.querySelector('article a[href^=\"/produits/\"]').getAttribute('href')");
  await nav.ouvrir(fiche);
  const lien = await nav.js("[...document.querySelectorAll('a')].find(a => a.href.includes('/simulateur?carreau='))?.getAttribute('href')");
  verifier(lien === `/simulateur?carreau=${fiche.split("/").pop()}`, `lien simulateur : ${lien}`);
  await nav.ouvrir(lien);
  await nav.attendre("document.querySelector('button[role=radio]:not([disabled])')");
  await nav.cliquer("button[role=radio]:not([disabled])");
  await nav.attendre("[...document.querySelectorAll('button')].some(b => b.textContent === 'Continuer' && !b.disabled)", 30000);
  await nav.cliquer("Continuer");
  await nav.attendre("document.querySelector('[aria-current=step]')?.textContent.includes('Simulation')");
});

test("simulateur : le rendu du sol dessine bien des carreaux", async (nav) => {
  await nav.ecran(1280);
  await nav.ouvrir("/simulateur");
  await nav.cliquer("button[role=radio]:not([disabled])");
  await nav.cliquer("Continuer");
  await nav.attendre("document.querySelector('[role=radiogroup] button[role=radio]')", 30000);
  await nav.cliquer("[role=radiogroup] button[role=radio]");
  await nav.cliquer("Continuer");
  await nav.attendre("document.querySelector('canvas')", 30000);
  await pause(4000);
  // Le calque « après » doit contenir des pixels de couleurs variées
  // (carreaux posés), pas une surface vide ou unie.
  const couleurs = await nav.js(`(() => {
    let max = 0;
    for (const c of document.querySelectorAll("canvas")) {
      if (!c.width || !c.height) continue;
      const lecture = document.createElement("canvas");
      lecture.width = 64; lecture.height = 64;
      const ctx = lecture.getContext("2d");
      try { ctx.drawImage(c, 0, c.height * 0.6, c.width, c.height * 0.4, 0, 0, 64, 64); } catch { continue; }
      const d = ctx.getImageData(0, 0, 64, 64).data;
      const vues = new Set();
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) vues.add((d[i] >> 4) + "," + (d[i + 1] >> 4) + "," + (d[i + 2] >> 4));
      max = Math.max(max, vues.size);
    }
    return max;
  })()`);
  verifier(couleurs > 20, `rendu vide ou uni (${couleurs} teintes)`);
  await nav.cliquer("Voir le résultat");
  await nav.attendre("[...document.querySelectorAll('a')].some(a => a.href.startsWith('https://wa.me/') && a.href.includes('text='))");
});

test("contact : le formulaire ouvre WhatsApp avec le message structuré", async (nav) => {
  await nav.ecran(1280);
  await nav.ouvrir("/contact");
  await nav.js(`(() => {
    window.__whatsapp = null;
    window.open = (url) => { window.__whatsapp = url; };
    const saisir = (sel, val) => {
      const el = document.querySelector(sel);
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    saisir("#contact-nom", "Test E2E");
    saisir("#contact-email", "e2e@exemple.tn");
    saisir("#contact-message", "Message de test automatique.");
  })()`);
  await nav.cliquer("form button[type=submit]");
  const url = await nav.js("window.__whatsapp");
  verifier(url?.startsWith("https://wa.me/21698514014?text="), `lien WhatsApp : ${url}`);
  const texte = new URL(url).searchParams.get("text");
  verifier(texte.includes("• Nom : Test E2E") && texte.includes("*Mon message*"), "message mal formé");
});

test("langue : l'arabe passe la page de droite à gauche", async (nav) => {
  await nav.langue("ar");
  await nav.ouvrir("/");
  verifier((await nav.js("document.documentElement.dir")) === "rtl", "dir n'est pas rtl");
  verifier((await nav.js("document.documentElement.lang")) === "ar", "lang n'est pas ar");
  await nav.langue("fr");
});

test("responsive : aucune page ne déborde en largeur (320 → 1920 px)", async (nav) => {
  const fautes = [];
  for (const largeur of [320, 375, 768, 1024, 1440, 1920]) {
    await nav.ecran(largeur, 800);
    for (const chemin of ["/", "/produits", "/simulateur", "/a-propos", "/contact"]) {
      await nav.ouvrir(chemin);
      const [page, ecran] = await nav.js("[document.documentElement.scrollWidth, document.documentElement.clientWidth]");
      if (page > ecran) fautes.push(`${chemin} à ${largeur}px (${page} > ${ecran})`);
    }
  }
  verifier(fautes.length === 0, `débordements : ${fautes.join(", ")}`);
});

test("menu mobile : s'ouvre, tient dans l'écran et bloque la page", async (nav) => {
  await nav.ecran(740, 360);
  await nav.ouvrir("/");
  await nav.cliquer("button[aria-controls=menu-mobile]");
  await pause(700);
  const etat = await nav.js(`({
    ouvert: document.querySelector("button[aria-controls=menu-mobile]").getAttribute("aria-expanded"),
    bloquee: document.documentElement.style.overflow,
    bas: Math.round(document.querySelector("#menu-mobile nav").getBoundingClientRect().bottom),
    hauteur: innerHeight,
  })`);
  verifier(etat.ouvert === "true", "menu non ouvert");
  verifier(etat.bloquee === "hidden", "la page derrière défile encore");
  verifier(etat.bas <= etat.hauteur + 1, `le menu dépasse l'écran (${etat.bas} > ${etat.hauteur})`);
});

// ---------------------------------------------------------------- Lancement
async function principal() {
  try {
    await fetch(BASE);
  } catch {
    console.error(`Le site ne répond pas sur ${BASE}. Lancez d'abord « npm run dev » (ou définissez E2E_URL).`);
    process.exit(1);
  }
  const nav = await lancerChrome();
  let echecs = 0;
  const debut = Date.now();
  for (const { nom, fn } of tests) {
    const t0 = Date.now();
    try {
      await nav.ecran(1280);
      await fn(nav);
      console.log(`  ✓ ${nom} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    } catch (e) {
      echecs++;
      console.log(`  ✗ ${nom}\n      ${e.message}`);
    }
  }
  await nav.fermer();
  const duree = ((Date.now() - debut) / 1000).toFixed(0);
  console.log(`\n${tests.length - echecs}/${tests.length} tests de bout en bout réussis (${duree} s)`);
  process.exit(echecs ? 1 : 0);
}

principal();
