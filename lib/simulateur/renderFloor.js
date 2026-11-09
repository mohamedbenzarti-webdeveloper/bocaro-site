import { homographieDepuisCarreUnite, projeter } from "./homography";
import { TAILLE_PAR_DEFAUT } from "./tileSize";
import { carrelageGL } from "./renderGL";

// Garde-fou de performance : au-delà, on ne dessine rien plutôt que de
// figer le navigateur (ex. mosaïque 1 cm sur une grande pièce).
const MAX_CARREAUX = 12000;

// Sous cette taille à l'écran (px), un carreau est rempli de la couleur
// moyenne de sa texture : le motif n'y est pas visible, et l'énorme
// réduction qu'il demanderait au GPU (précision réduite sur mobile)
// faisait échouer tout le sol sur certains téléphones (Adreno, Chrome).
const TAILLE_MIN_MOTIF = 3;

/** Couleur moyenne d'une texture (mise en cache). */
const cacheCouleurs = new WeakMap();
function couleurMoyenne(image) {
  let couleur = cacheCouleurs.get(image);
  if (!couleur) {
    couleur = "#bbbbbb";
    try {
      const c = document.createElement("canvas");
      c.width = c.height = 1;
      const cctx = c.getContext("2d", { willReadFrequently: true });
      cctx.drawImage(image, 0, 0, 1, 1);
      const [r, g, b] = cctx.getImageData(0, 0, 1, 1).data;
      couleur = `rgb(${r},${g},${b})`;
    } catch {
      // Texture non lisible : gris neutre.
    }
    cacheCouleurs.set(image, couleur);
  }
  return couleur;
}

// Canvas de travail réutilisés d'un rendu à l'autre. Les navigateurs
// mobiles (Safari iOS surtout) plafonnent la mémoire totale des canvas et
// la libèrent tard : créer un canvas pleine taille par surface et par
// rendu (7 murs → ~46 Mo à chaque mouvement de curseur) finit par faire
// refuser les suivants, et le rendu s'interrompt (murs incomplets, sol
// vide). Avec ces canvas partagés, la mémoire reste constante.
const canvasTravail = {};
function canvasPartage(nom, width, height) {
  if (typeof document === "undefined") return null;
  let c = canvasTravail[nom];
  if (!c) c = canvasTravail[nom] = document.createElement("canvas");
  if (c.width !== width || c.height !== height) {
    c.width = width;
    c.height = height;
  }
  const cctx = c.getContext("2d");
  if (!cctx || !c.width) return null;
  cctx.setTransform(1, 0, 0, 1, 0, 0);
  cctx.globalCompositeOperation = "source-over";
  cctx.globalAlpha = 1;
  cctx.filter = "none";
  cctx.clearRect(0, 0, width, height);
  return c;
}

// Moteur de rendu du simulateur (sol et murs).
//
// Pipeline : photo de la pièce → masque de la surface (clip) → grille
// de carreaux générée dans son plan → chaque carreau projeté en
// perspective via l'homographie → dessiné par mapping de 2 triangles
// → composition "multiply" pour conserver les ombres de la photo →
// avant-plans redessinés → reflet des murs dans le sol (option).
// En mode "mur", chaque face réelle est un plan distinct (sa propre
// homographie) : les murs d'une pièce ne sont pas coplanaires.

/** Triangle agrandi : chaque arête décalée de d vers l'extérieur (onglet borné). */
function decalerTriangle(a, b, c, d) {
  const pts = [a, b, c];
  const aire = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const sens = aire > 0 ? 1 : -1;
  // Droites décalées : point + direction, pour chaque arête i -> i+1.
  const lignes = pts.map((p, i) => {
    const q = pts[(i + 1) % 3];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (dy / len) * sens;
    const ny = (-dx / len) * sens;
    return { p: [p[0] + nx * d, p[1] + ny * d], dir: [dx, dy] };
  });
  return pts.map((p, i) => {
    const l1 = lignes[(i + 2) % 3];
    const l2 = lignes[i];
    const den = l1.dir[0] * l2.dir[1] - l1.dir[1] * l2.dir[0];
    if (Math.abs(den) < 1e-9) return p;
    const t = ((l2.p[0] - l1.p[0]) * l2.dir[1] - (l2.p[1] - l1.p[1]) * l2.dir[0]) / den;
    const x = l1.p[0] + l1.dir[0] * t;
    const y = l1.p[1] + l1.dir[1] * t;
    // Onglet borné pour les angles très aigus.
    const ox = x - p[0];
    const oy = y - p[1];
    const o = Math.hypot(ox, oy);
    const max = d * 4;
    return o > max ? [p[0] + (ox / o) * max, p[1] + (oy / o) * max] : [x, y];
  });
}

/**
 * Remplit un triangle quelconque avec la texture du carreau.
 * Canvas 2D ne sait faire que des transformations affines : un triangle
 * (3 points) définit exactement une affine, donc en découpant chaque
 * carreau en 2 triangles on obtient un mapping correct du motif.
 *
 * Le triangle est REMPLI avec un motif (createPattern) dont la matrice
 * place la texture, au lieu de clip() + drawImage() : sur certains GPU
 * mobiles (ex. Adreno, Chrome Android), des milliers de clip/drawImage
 * successifs ne dessinaient rien ou seulement une partie (sol vide, murs
 * incomplets). Le remplissage par motif n'utilise ni clip ni save/restore
 * et passe sur tous les GPU testés.
 */
function dessinerTriangle(ctx, motif, s0, s1, s2, d0, d1, d2) {
  // Matrice affine envoyant les points source (texture) sur les
  // points destination (écran).
  const sx1 = s1[0] - s0[0];
  const sy1 = s1[1] - s0[1];
  const sx2 = s2[0] - s0[0];
  const sy2 = s2[1] - s0[1];
  const det = sx1 * sy2 - sx2 * sy1;
  if (!det) return;

  const dx1 = d1[0] - d0[0];
  const dy1 = d1[1] - d0[1];
  const dx2 = d2[0] - d0[0];
  const dy2 = d2[1] - d0[1];

  const a = (dx1 * sy2 - dx2 * sy1) / det;
  const b = (dy1 * sy2 - dy2 * sy1) / det;
  const c = (dx2 * sx1 - dx1 * sx2) / det;
  const d = (dy2 * sx1 - dy1 * sx2) / det;
  const e = d0[0] - a * s0[0] - c * s0[1];
  const f = d0[1] - b * s0[0] - d * s0[1];

  motif.setTransform(new DOMMatrix([a, b, c, d, e, f]));

  // Triangle agrandi en décalant chaque arête de 0,9 px vers l'extérieur
  // (vrai décalage parallèle) : sans cela l'anti-aliasing laisse une
  // diagonale visible dans chaque carreau.
  const [e0, e1, e2] = decalerTriangle(d0, d1, d2, 0.9);
  ctx.beginPath();
  ctx.moveTo(e0[0], e0[1]);
  ctx.lineTo(e1[0], e1[1]);
  ctx.lineTo(e2[0], e2[1]);
  ctx.closePath();
  ctx.fill();
}

/** Parse un masque "x,y x,y ... | x,y x,y ..." en liste de sous-tracés. */
function parsePolygone(polygon) {
  return polygon
    .split("|")
    .map((sous) => sous.trim().split(" ").map((p) => p.split(",").map(Number)));
}

/** Trace (moveTo/lineTo/closePath) un ou plusieurs sous-tracés sur le ctx courant. */
function tracerSousTraces(ctx, sousTraces) {
  ctx.beginPath();
  for (const points of sousTraces) {
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
  }
}

/**
 * Dessine la grille de carreaux (joint + tuiles) dans le clip déjà en
 * place sur ctx, en projetant chaque coin de carreau via `proj(u,v)`.
 * Factorisé pour être réutilisé tel quel par le reflet au sol (même
 * grille, seule la projection change : elle y est en plus repliée
 * autour de la ligne de plinthe).
 */
/**
 * Découpe un axe [0,1] en cellules de pas 1/n, alignées sur le début (0)
 * ou la fin (1) de l'axe. Pour chaque cellule visible : l'intervalle du
 * corps du carreau (joint exclu) et la portion de texture correspondante,
 * y compris pour une cellule coupée d'un côté ou de l'autre.
 */
function cellulesAxe(n, marge, alignerFin) {
  const pas = 1 / n;
  const cellules = [];
  for (let k = 0; k < Math.ceil(n - 1e-9); k++) {
    const a0 = alignerFin ? 1 - (k + 1) * pas : k * pas;
    const a1 = a0 + pas;
    const c0 = a0 + marge * pas;
    const c1 = a1 - marge * pas;
    const b0 = Math.max(0, c0);
    const b1 = Math.min(1, c1);
    if (b1 - b0 < 0.02 * pas) continue;
    const span = c1 - c0;
    cellules.push({ b0, b1, t0: (b0 - c0) / span, t1: (b1 - c0) / span });
  }
  return cellules;
}

function dessinerGrilleCarreaux(ctx, { tileImage, width, height, surfaceSize, reglages, proj, H, alignerBas = false }) {
  const {
    tuileCm = TAILLE_PAR_DEFAUT,
    rotation = 0,
    jointWidth = 2,
    jointColor = "#ffffff",
  } = reglages;
  const tourne = rotation % 180 !== 0;

  // Fond = couleur du joint. Les carreaux sont ensuite dessinés
  // légèrement rétrécis : l'espace laissé libre EST le joint, donc
  // il rétrécit lui aussi avec la perspective.
  ctx.fillStyle = jointColor;
  ctx.beginPath();
  const coins = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([u, v]) => proj(u, v));
  ctx.moveTo(coins[0][0], coins[0][1]);
  for (let i = 1; i < coins.length; i++) ctx.lineTo(coins[i][0], coins[i][1]);
  ctx.closePath();
  ctx.fill();

  // Taille réelle : la surface représentée par le quad mesure
  // surfaceSize (en mètres) ; on pose des carreaux de tuileCm (en cm),
  // donc le nombre de carreaux par axe découle des vraies dimensions
  // et non d'un réglage arbitraire. Un carreau tourné à 90° échange
  // sa largeur et sa hauteur sur la surface.
  const { w: tw_cm, h: th_cm } = tuileCm;
  const cellU = tourne ? th_cm : tw_cm;
  const cellV = tourne ? tw_cm : th_cm;
  const nu = (surfaceSize.width * 100) / cellU;
  const nv = (surfaceSize.depth * 100) / cellV;
  if (nu * nv > MAX_CARREAUX) return { prevus: Math.round(nu * nv), dessines: 0, ignore: "MAX_CARREAUX" };

  // Joint en mm -> fraction de carreau de chaque côté.
  const margeU = Math.min(0.25, jointWidth / 10 / cellU / 2);
  const margeV = Math.min(0.25, jointWidth / 10 / cellV / 2);

  // Rendu WebGL en priorité : un seul dessin calculé pixel par pixel par
  // le GPU (voir renderGL.js). Le dessin par triangles ci-dessous ne sert
  // que si WebGL est indisponible.
  if (H) {
    const gl = carrelageGL({
      tileImage,
      width,
      height,
      H,
      nu,
      nv,
      margeU,
      margeV,
      tourne,
      alignerBas,
      jointColor,
      ratio: tw_cm / th_cm,
    });
    if (gl) {
      ctx.drawImage(gl, 0, 0);
      return { mode: "webgl", prevus: Math.round(nu * nv) };
    }
  }

  const tw = tileImage.naturalWidth || tileImage.width;
  const th = tileImage.naturalHeight || tileImage.height;

  // Un seul motif pour tous les triangles ; seule sa matrice change.
  const motif = ctx.createPattern(tileImage, "repeat");
  const couleurUnie = couleurMoyenne(tileImage);
  if (!motif) return { prevus: Math.round(nu * nv), dessines: 0, ignore: "motif indisponible" };

  // Recadrage centré de la texture au format du carreau (carré pour
  // un 10x10) : évite d'étirer une photo qui n'a pas ce format.
  const ratio = tw_cm / th_cm;
  const cropW = tw / th > ratio ? th * ratio : tw;
  const cropH = tw / th > ratio ? th : tw / ratio;
  const cropX = (tw - cropW) / 2;
  const cropY = (th - cropH) / 2;

  // Point de la texture pour la position (tu, tv) dans le carreau,
  // tu/tv dans [0,1] ; la rotation 90° fait tourner le motif avec le
  // carreau.
  const texture = (tu, tv) =>
    tourne
      ? [cropX + tv * cropW, cropY + (1 - tu) * cropH]
      : [cropX + tu * cropW, cropY + tv * cropH];

  // Murs : rangées alignées sur le bas (haut de plinthe), comme une vraie
  // pose ; sol : alignement historique sur le coin fond-gauche.
  const colonnes = cellulesAxe(nu, margeU, false);
  const rangees = cellulesAxe(nv, margeV, alignerBas);

  let dessines = 0;
  for (const cu of colonnes) {
    const u0 = cu.b0;
    const u1 = cu.b1;
    for (const cv of rangees) {
      const v0 = cv.b0;
      const v1 = cv.b1;

      const p00 = proj(u0, v0);
      const p10 = proj(u1, v0);
      const p11 = proj(u1, v1);
      const p01 = proj(u0, v1);

      // On ignore les carreaux entièrement hors cadre : gros gain de
      // performance, la grille dépassant largement la photo.
      const maxY = Math.max(p00[1], p10[1], p11[1], p01[1]);
      const minY = Math.min(p00[1], p10[1], p11[1], p01[1]);
      const maxX = Math.max(p00[0], p10[0], p11[0], p01[0]);
      const minX = Math.min(p00[0], p10[0], p11[0], p01[0]);
      if (maxY < 0 || minY > height || maxX < 0 || minX > width) continue;
      // Carreaux dégénérés (trop loin, sous le pixel) : inutile.
      if (maxX - minX < 1 && maxY - minY < 1) continue;

      // Carreau minuscule (près de l'horizon) : couleur moyenne, sans motif.
      if (maxX - minX < TAILLE_MIN_MOTIF && maxY - minY < TAILLE_MIN_MOTIF) {
        ctx.fillStyle = couleurUnie;
        ctx.beginPath();
        ctx.moveTo(p00[0], p00[1]);
        ctx.lineTo(p10[0], p10[1]);
        ctx.lineTo(p11[0], p11[1]);
        ctx.lineTo(p01[0], p01[1]);
        ctx.closePath();
        ctx.fill();
        dessines++;
        continue;
      }

      // Portion de texture visible (carreau entier, ou partie restante
      // d'un carreau coupé en bord de surface, joints exclus).
      const t00 = texture(cu.t0, cv.t0);
      const t10 = texture(cu.t1, cv.t0);
      const t11 = texture(cu.t1, cv.t1);
      const t01 = texture(cu.t0, cv.t1);

      ctx.fillStyle = motif;
      dessinerTriangle(ctx, motif, t00, t10, t11, p00, p10, p11);
      dessinerTriangle(ctx, motif, t00, t11, t01, p00, p11, p01);
      dessines++;
    }
  }
  return { mode: "2d", prevus: colonnes.length * rangees.length, dessines };
}

// Reflet : longueur (en mètres réels) et largeur des bandes verticales.
const REFLET_LONGUEUR_M = 1.4;
const REFLET_BANDE_PX = 2;

/**
 * Reflet au sol des murs carrelés (option "reflet").
 *
 * Un mur vertical se reflète dans un sol brillant par symétrie autour de
 * sa ligne de pied, colonne par colonne : un point à la hauteur h au-
 * dessus du pied apparaît à h en dessous, à la même échelle (même
 * profondeur). On reproduit donc exactement cette symétrie par bandes
 * verticales de 2 px, chacune retournée autour du pied réel du mur à cet
 * x (pied incliné pour les murs fuyants) — et seulement sous son propre
 * mur, jamais sur toute la largeur. La longueur suit l'échelle locale
 * (1 m réel), le fondu est appliqué sur un calque hors-écran avant le
 * flou (pas de bord transparent net → pas de franges colorées), puis le
 * tout est composé en une seule passe, borné au vrai masque de sol.
 *
 * pxParMetre(y_pied) : échelle verticale au pied, fournie par l'appelant
 * (dépend de l'horizon et de la hauteur de caméra de la pièce).
 */
function dessinerReflets(ctx, { width, height, surfaces, floorPolygon, reflet, pxParMetre }) {
  if (!floorPolygon || !reflet?.actif || !pxParMetre) return;
  if (typeof document === "undefined") return;
  const murs = (surfaces ?? []).filter((s) => s?.type === "mur" && s.pied);
  if (!murs.length) return;

  const off = canvasPartage("reflet", width, height);
  if (!off) return;
  const octx = off.getContext("2d");

  for (const mur of murs) {
    const [[xa, ya], [xb, yb]] = mur.pied;
    const piedA = (x) => ya + ((yb - ya) * (x - xa)) / (xb - xa);
    const exclu = mur.refletExclu ?? [];
    const x0 = Math.max(0, Math.floor(Math.min(xa, xb)));
    const x1 = Math.min(width, Math.ceil(Math.max(xa, xb)));

    for (let x = x0; x < x1; x += REFLET_BANDE_PX) {
      const w = Math.min(REFLET_BANDE_PX, x1 - x);
      const xm = x + w / 2;
      if (exclu.some(([e0, e1]) => xm >= e0 && xm <= e1)) continue;
      const yp = piedA(xm);
      const L = Math.min(REFLET_LONGUEUR_M * pxParMetre(yp), yp);
      if (L <= 1) continue;

      // Bande [yp-L, yp] retournée sur [yp, yp+L].
      octx.save();
      octx.translate(0, 2 * yp);
      octx.scale(1, -1);
      octx.drawImage(ctx.canvas, x, yp - L, w, L, x, yp - L, w, L);
      octx.restore();

      // Fondu vers le bas, sur le calque, avant le flou.
      const g = octx.createLinearGradient(0, yp, 0, yp + L);
      g.addColorStop(0, "rgba(0,0,0,0.05)");
      g.addColorStop(0.55, "rgba(0,0,0,0.6)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      octx.globalCompositeOperation = "destination-out";
      octx.fillStyle = g;
      octx.fillRect(x, yp, w, L);
      octx.globalCompositeOperation = "source-over";
    }
  }

  ctx.save();
  tracerSousTraces(ctx, parsePolygone(floorPolygon));
  ctx.clip();
  ctx.globalAlpha = reflet.opacite ?? 0.3;
  ctx.filter = `blur(${reflet.flou ?? 5}px)`;
  ctx.drawImage(off, 0, 0);
  ctx.restore();
}

/** Rend une seule surface (un plan) dans le canvas. */
function dessinerSurface(ctx, { tileImage, width, height, surface, reglages }) {
  const { polygon, quad } = surface ?? {};
  const surfaceSize = surface?.size ?? { width: 5, depth: 4 };

  if (!tileImage || !quad) return { ignore: "pas de texture ou de quad" };

  const H = homographieDepuisCarreUnite(quad);
  if (!H) return { ignore: "homographie impossible" };

  // Un masque peut être fait de plusieurs zones disjointes : les
  // sous-tracés sont séparés par "|", chacun un polygone "x,y x,y ...".
  const sousTraces = parsePolygone(polygon);

  // Calque carreaux dessiné à part en "source-over", puis composé UNE
  // fois en "multiply" : dessiné directement en multiply, le léger
  // recouvrement des deux triangles d'un carreau était multiplié deux
  // fois et laissait une diagonale sombre dans chaque carreau.
  const calque = canvasPartage("calque", width, height);
  const lctx = calque ? calque.getContext("2d") : ctx;
  const proj = (u, v) => projeter(H, u, v);
  const stats = dessinerGrilleCarreaux(lctx, {
    tileImage,
    width,
    height,
    surfaceSize,
    reglages,
    proj,
    H,
    alignerBas: Boolean(surface?.alignerBas),
  });

  // Le masque : seule la zone ciblée (sol ou mur) est touchée, le reste
  // de la photo reste intact. Composition "multiply" pour garder les
  // ombres et reflets réels de la photo.
  //
  // Sans clip() : sur certains GPU de téléphone (Adreno, Chrome Android),
  // un clip() sur un polygone complexe (le sol : 9 à 31 points) combiné
  // au "multiply" n'affichait rien (sol vide, alors que les murs, à 4
  // points, passaient). On découpe donc le calque lui-même à la forme du
  // masque ("destination-in", simple remplissage), puis on le compose sans
  // clip ; le voile est un simple remplissage de la même forme.
  if (calque) {
    lctx.save();
    lctx.globalCompositeOperation = "destination-in";
    lctx.fillStyle = "#000";
    tracerSousTraces(lctx, sousTraces);
    lctx.fill();
    lctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(calque, 0, 0);
    ctx.restore();
  }

  // Voile clair pour compenser l'assombrissement du "multiply".
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  tracerSousTraces(ctx, sousTraces);
  ctx.fill();
  ctx.restore();
  return { ...stats, calque: Boolean(calque) };
}

/**
 * Rend la simulation complète dans un canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} options
 * @param {HTMLImageElement} options.roomImage photo de la pièce
 * @param {HTMLImageElement|null} options.tileImage texture du carreau
 * @param {HTMLImageElement[]} options.occluderImages calques PNG transparents des éléments d'avant-plan (un par surface, dans l'ordre)
 * @param {number} options.width largeur de la photo (px)
 * @param {number} options.height hauteur de la photo (px)
 * @param {object[]} options.surfaces liste de { polygon, quad, size: {width, depth} }
 *   — depth = étendue physique le long de l'axe v du quad (profondeur), en
 *   mètres. Plusieurs éléments en mode "mur" (un par pan réel).
 * @param {object} options.reglages { tuileCm: {w,h}, rotation, jointWidth (mm),
 *   jointColor, reflet: { actif, opacite, flou } } — reflet ne s'applique
 *   qu'aux surfaces de type "mur", sans effet en mode "sol".
 * @param {string} [options.floorPolygon] masque du vrai sol de la pièce
 *   (room.floorPolygon), pour borner le reflet au sol des murs carrelés.
 * @param {object} [options.camera] { horizon (y px), hauteur (m) } de la
 *   photo : donne l'échelle verticale au pied d'un mur, pour le reflet.
 */
export function rendreScene(ctx, { roomImage, tileImage, occluderImages, width, height, surfaces, reglages, floorPolygon, camera }) {
  ctx.clearRect(0, 0, width, height);

  // 1. La photo, intacte.
  ctx.drawImage(roomImage, 0, 0, width, height);

  if (!tileImage) return null;
  const texture = textureBitmap(tileImage);

  let erreur = null;
  const statsSurfaces = [];
  for (const surface of surfaces ?? []) {
    try {
      statsSurfaces.push(dessinerSurface(ctx, { tileImage: texture, width, height, surface, reglages }));
    } catch (e) {
      statsSurfaces.push({ erreur: String(e?.message ?? e) });
      // Une surface en échec (mémoire insuffisante…) ne doit pas
      // empêcher de dessiner les autres.
      ctx.restore?.();
      erreur ??= e;
    }
  }

  // 2. Avant-plan (feuillage, pieds de meuble, robinetterie...) : pixels
  //    de la photo redessinés par-dessus le carrelage, pour qu'il passe
  //    derrière. Un calque par surface, dans le même ordre.
  for (const occluderImage of occluderImages ?? []) {
    if (occluderImage) ctx.drawImage(occluderImage, 0, 0, width, height);
  }

  // 3. Reflet des murs carrelés dans le sol, calculé sur l'image finale
  //    (meubles compris) et borné au masque de sol : il ne passe jamais
  //    sur un meuble posé au sol.
  if (camera) {
    const pxParMetre = (y) => Math.max(0, (y - camera.horizon) / camera.hauteur);
    try {
      dessinerReflets(ctx, { width, height, surfaces, floorPolygon, reflet: reglages?.reflet, pxParMetre });
    } catch (e) {
      erreur ??= e;
    }
  }
  if (erreur) throw erreur;
  return { texture: [texture.width, texture.height], surfaces: statsSurfaces };
}

// Texture figée en bitmap une fois par image : une image vectorielle
// (SVG) est sinon re-rastérisée à chaque triangle, ce qui laisse une
// couture diagonale dans chaque carreau. Plafonnée à TEXTURE_MAX px :
// un carreau ne dépasse pas quelques dizaines de pixels à l'écran, une
// photo de plusieurs Mpx ne ferait que consommer de la mémoire mobile.
const TEXTURE_MAX = 512;
const cacheTextures = new WeakMap();
function textureBitmap(image) {
  if (typeof document === "undefined") return image;
  let bmp = cacheTextures.get(image);
  if (!bmp) {
    const w0 = image.naturalWidth || image.width;
    const h0 = image.naturalHeight || image.height;
    const k = Math.min(1, TEXTURE_MAX / Math.max(w0, h0));
    bmp = document.createElement("canvas");
    bmp.width = Math.max(1, Math.round(w0 * k));
    bmp.height = Math.max(1, Math.round(h0 * k));
    const bctx = bmp.getContext("2d");
    if (!bctx) return image;
    bctx.imageSmoothingQuality = "high";
    bctx.drawImage(image, 0, 0, bmp.width, bmp.height);
    cacheTextures.set(image, bmp);
  }
  return bmp;
}

/** Charge une image (avec CORS pour permettre l'export du canvas). */
export function chargerImage(src, avecCors = false) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (avecCors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image non chargée : ${src}`));
    img.src = src;
  });
}
