// Configuration des pièces du simulateur visuel.
//
// Chaque pièce a une photo réelle (public/images/simulateur/) et un
// masque de sol : un polygone en coordonnées pixels *exactement*
// calées sur les dimensions de cette photo (viewBox de l'aperçu).
// Le polygone a été calibré à la main sur chaque photo pour suivre
// la ligne de plinthe (mur/sol) et contourner les meubles au premier
// plan (canapé, baignoire, lit...).
//
// width/height = dimensions réelles des photos fournies (1536x1024).
//
// floorSize = dimensions réelles estimées du sol représenté par
// floorQuad, en mètres : width = largeur (axe fond-gauche → fond-droit),
// depth = profondeur (du fond de la pièce au bas de la photo). Estimées
// depuis la perspective des photos : à ajuster si les carreaux
// paraissent trop grands ou trop petits par rapport à la réalité.
//
// walls = liste des murs simulables (même principe que le sol :
// polygon = masque, quad = 4 coins du plan en perspective dans l'ordre
// [haut-gauche, haut-droit, bas-droit, bas-gauche], size.width/depth en
// mètres, mesurés au pixel près sur la vraie photo — jamais à l'œil).
// zone = regroupement utilisé par le sélecteur "Mur principal / gauche
// / droit / tous les murs" (StepEspace) : plusieurs `walls[]` peuvent
// partager la même zone si un même pan logique est coupé en plusieurs
// plans (mur + retour de fenêtre). Une pièce sans "walls" ne propose
// que le sol (voir hasMur/getSurfaces plus bas).

export const ROOMS = [
  {
    id: "salon",
    floorSize: { width: 8.57, depth: 7.08 },
    image: "/images/simulateur/salon.jpg",
    width: 1536,
    height: 1024,
    floorPolygon:
      "0,634.4 262,538.6 262,511 312,494 356,492 357,503 920,503 923,485 960,485 960,508 1065,508 1065,483 1164,481 1259,535 1355,536 1353,592.5 1536,729.1 1536,1024 0,1024",
    // Quadrilatère du plan du sol en perspective, dans l'ordre
    // [fond-gauche, fond-droit, avant-droit, avant-gauche]. Les deux
    // coins avant débordent volontairement du cadre : le sol continue
    // hors champ. Calibré sur les joints réels visibles sur la photo.
    // Quad cohérent avec la perspective : point de fuite (878,323) =
    // intersection des plinthes gauche/droite, bords latéraux passant
    // par ce point, fond calé sur la vraie jonction mur/sol du fond
    // (y≈492 à gauche, ≈481 à droite : légèrement inclinée).
    floorQuad: [
      [240, 489],
      [1370, 474],
      [3165, 1024],
      [-1820, 1024],
    ],
    // Caméra de la photo : horizon (y du point de fuite du sol) et hauteur
    // de l'objectif au-dessus du sol (bord arrière de floorQuad :
    // 1130 px pour 8,57 m à 158,5 px sous l'horizon → 1,202 m).
    camera: { horizon: 323, hauteur: 1.202 },
    // Murs : un plan par face réelle, calculés à partir d'un modèle de
    // caméra unique plutôt que de coins estimés un à un.
    //   - horizon y=323 et point de fuite des murs latéraux (878,323),
    //     déjà validés par le sol ; hauteur caméra 1,202 m (déduite du
    //     bord arrière de floorQuad : 1130 px pour 8,57 m) ;
    //   - échelle verticale au pied d'un mur = (y_pied − 323) / 1,202 px/m ;
    //   - pied de chaque mur mesuré sur la photo (contact mur/sol), coins
    //     du quad = ce pied relevé de 0,13 m (plinthe de ~11 cm + 2 cm de
    //     marge : la plinthe n'est jamais carrelée) et de 3,8 m
    //     (au-dessus du cadre) ; largeur réelle via l'homographie du sol.
    // Contrôle : la plinthe mesurée donne ~11 cm sur les six faces, et les
    // coins partagés tombent au même pixel (fond/flanc : 466,5 et −18,4).
    // pied = contact mur/sol (axe du miroir pour le reflet au sol).
    walls: [
      {
        // Mur du fond : x 312→1164 (le canapé masque son pied, visible
        // seulement à gauche du canapé et autour de la table : y 492→481).
        id: "fond",
        zone: "principal",
        label: "Mur principal",
        size: { width: 6.31, depth: 3.67 },
        occluder: "/images/simulateur/salon-avant-plan.png",
        polygon: "312,0 1164,0 1164,463 312,473",
        quad: [
          [312, -42.8],
          [1164, -18.4],
          [1164, 463.9],
          [312, 473.9],
        ],
        pied: [[312, 492.2], [1164, 481.0]],
        // Pied caché par le canapé et le pied de table : pas de reflet
        // du carrelage au sol devant eux.
        refletExclu: [[350, 926], [950, 1066]],
      },
      {
        // Mur gauche (fenêtre), fuyant : de la fenêtre au retrait, appui et
        // allège sous la fenêtre compris jusqu'au bord gauche du cadre.
        // Exclut le cadre noir (x 135-157) et l'embrasure (plan à part).
        id: "fenetre",
        zone: "gauche",
        label: "Mur gauche (fenêtre)",
        size: { width: 2.2, depth: 3.67 },
        occluder: "/images/simulateur/salon-fenetre-avant-plan.png",
        polygon: "186,0 259,0 259,518 0,600 0,506 157,471 186,471",
        quad: [
          [-30, -371.7],
          [259, -150.6],
          [259, 518.4],
          [-30, 609.6],
        ],
        pied: [[-30, 644.4], [259, 542.1]],
      },
      {
        // Embrasure de la fenêtre : face frontale (parallèle au fond),
        // entre le cadre et le nu du mur, de l'appui (h≈0,48 m) au haut.
        id: "embrasure",
        zone: "gauche",
        label: "Mur gauche (fenêtre)",
        size: { width: 0.14, depth: 3.32 },
        polygon: "158,0 186,0 186,471 158,471",
        quad: [
          [158, -214],
          [186, -214],
          [186, 470],
          [158, 470],
        ],
      },
      {
        // Retrait entre le mur de la fenêtre et le coin du fond (x 259→312),
        // fuyant, en recul par rapport au mur de la fenêtre.
        id: "retrait",
        zone: "gauche",
        label: "Mur gauche (fenêtre)",
        size: { width: 0.76, depth: 3.67 },
        polygon: "259,0 312,0 312,473 259,488",
        quad: [
          [259, -77.0],
          [312, -42.8],
          [312, 473.9],
          [259, 488.1],
        ],
        pied: [[259, 508.1], [312, 492.2]],
      },
      {
        // Flanc droit, fuyant (x 1164→1260), avec interrupteur et prise.
        id: "flanc",
        zone: "droite",
        label: "Mur droit (couloir)",
        size: { width: 2.22, depth: 3.67 },
        occluder: "/images/simulateur/salon-flanc-avant-plan.png",
        polygon: "1164,0 1260,0 1260,511 1164,463",
        quad: [
          [1164, -18.5],
          [1260, -133.1],
          [1260, 511.2],
          [1164, 463.9],
        ],
        pied: [[1164, 481.0], [1260, 534.0]],
      },
      {
        // Face du renfoncement (x 1260→1356), frontale, carrelée sur toute
        // sa hauteur (triangle du linteau compris).
        id: "renfoncement",
        zone: "droite",
        label: "Mur droit (couloir)",
        size: { width: 0.5, depth: 3.67 },
        polygon: "1260,0 1356,0 1356,512 1260,512",
        quad: [
          [1260, -136.3],
          [1356, -136.3],
          [1356, 512.5],
          [1260, 512.5],
        ],
        pied: [[1260, 535.5], [1356, 535.5]],
      },
      {
        // Mur droit proche (x 1356→1536), fuyant. Ses horizontales
        // convergent vers (986,323) et non (878,323) (bord de cadre) :
        // pied et plinthe mesurés directement sur ce mur.
        id: "couloir",
        zone: "droite",
        label: "Mur droit (couloir)",
        size: { width: 1.72, depth: 3.67 },
        polygon: "1356,0 1536,0 1536,684 1356,565",
        quad: [
          [1356, -262.7],
          [1536, -554.4],
          [1536, 685.0],
          [1356, 564.7],
        ],
        pied: [[1356, 594.0], [1536, 729.0]],
      },
    ],
  },
  {
    id: "cuisine",
    floorSize: { width: 4.72, depth: 3.32 },
    image: "/images/simulateur/cuisine.jpg",
    width: 1536,
    height: 1024,
    floorPolygon:
      "0,600 105,575.2 300,524 302,515.6 620,524.7 1020,538 1220,548 1370,545 1379.2,626.9 1536,780 1536,1024 0,1024",
    // Point de fuite (999,251) issu des plinthes gauche/droite.
    floorQuad: [
      [285, 505],
      [1380, 555],
      [1968, 1024],
      [-1177, 1024],
    ],
    // floorQuad suit le socle des meubles, pas le mur : caméra reprise
    // de ses bords fuyants (point principal (999,251), f≈1082 px,
    // h=1,161 m), le pied du mur du fond (caché) étant déduit du coin
    // gauche (arête verticale x≈345) et du pied du mur gauche.
    camera: { horizon: 251, hauteur: 1.161 },
    walls: [
      {
        // Crédence : mur du fond au-dessus du plan de travail (y≈349) et
        // au-dessus du réfrigérateur (haut y≈125), sous le plafond (y≈32).
        id: "fond",
        size: { width: 4.51, depth: 3.7 },
        occluder: "/images/simulateur/cuisine-avant-plan.png",
        polygon: "345,32 1268,32 1268,125 1083,125 1083,349 345,349",
        quad: [
          [345, -289.3],
          [1268, -289.3],
          [1268, 468.2],
          [345, 468.2],
        ],
      },
      {
        // Mur gauche fuyant, de l'embrasure au coin ; le caisson de gauche
        // (x≥293 sous le plan de travail) reste devant.
        id: "fenetre",
        size: { width: 1.22, depth: 3.7 },
        polygon: "140,0 287,0 345,34 345,349 293,349 293,501 140,545",
        quad: [
          [140, -451.4],
          [345, -289.3],
          [345, 486],
          [140, 545],
        ],
        pied: [[140, 560], [293, 506.8]],
      },
      {
        // Embrasure de la baie vitrée (face frontale).
        id: "embrasure",
        size: { width: 0.11, depth: 3.7 },
        polygon: "110,0 140,0 140,545 110,545",
        quad: [
          [110, -455.9],
          [140, -455.9],
          [140, 545],
          [110, 545],
        ],
        pied: [[110, 562], [140, 562]],
      },
      {
        // Pan frontal à droite du réfrigérateur (plus proche que le fond).
        id: "renfoncement",
        size: { width: 0.43, depth: 3.7 },
        polygon: "1268,32 1300,32 1322,0 1377,0 1377,528 1285,528 1285,125 1268,125",
        quad: [
          [1268, -424.1],
          [1377, -424.1],
          [1377, 528],
          [1268, 528],
        ],
        pied: [[1285, 548], [1377, 548]],
      },
      {
        // Mur droit proche, fuyant.
        id: "couloir",
        size: { width: 1.05, depth: 3.7 },
        polygon: "1377,0 1536,0 1536,733 1377,594",
        quad: [
          [1377, -551.4],
          [1536, -887.8],
          [1536, 733],
          [1377, 594],
        ],
        pied: [[1377, 604], [1536, 752]],
      },
    ],
  },
  {
    id: "salle-de-bain",
    floorSize: { width: 3, depth: 4.5 },
    image: "/images/simulateur/salle-de-bain.jpg",
    width: 1536,
    height: 1024,
    floorPolygon: "0,629.5 261.7,494.9 800,491 871.3,491 943.9,516.1 1234,714.1 1536,718 1536,1024 0,1024",
    floorQuad: [
      [230, 445],
      [880, 470],
      [2300, 1024],
      [-1200, 1024],
    ],
    // Horizon et point principal issus des bords fuyants de floorQuad
    // (517,5 ; 328,6) ; hauteur caméra 0,74 m (plan vasque à ~0,85 m),
    // f≈1090 px. Bas des quads calé 3 px au-dessus du haut réel des
    // plinthes (mesuré), les parties cachées par la baignoire au modèle.
    camera: { horizon: 328.6, hauteur: 0.74 },
    walls: [
      {
        // Mur du fond (vasque, miroir), x 240→885.
        id: "fond",
        size: { width: 2.94, depth: 3.71 },
        occluder: "/images/simulateur/salle-de-bain-avant-plan.png",
        polygon: "240,0 885,0 885,468 240,468",
        quad: [
          [240, -342.9],
          [885, -342.9],
          [885, 468],
          [240, 468],
        ],
        pied: [[240, 491], [885, 491]],
        refletExclu: [[268, 808]],
      },
      {
        // Mur gauche fuyant : à côté de la fenêtre, appui et allège compris.
        id: "fenetre",
        size: { width: 2.43, depth: 3.71 },
        polygon: "142,0 240,0 240,473 0,612 0,492 108,480 142,478",
        quad: [
          [-30, -1004.6],
          [240, -347.1],
          [240, 472.8],
          [-30, 629.4],
        ],
        pied: [[-30, 651], [240, 492]],
      },
      {
        // Embrasure de la fenêtre (face frontale).
        id: "embrasure",
        size: { width: 0.11, depth: 3.71 },
        polygon: "108,0 142,0 142,478 108,480",
        quad: [
          [108, -627],
          [142, -627],
          [142, 480],
          [108, 480],
        ],
      },
      {
        // Retour de mur fuyant entre le fond et la niche de la baignoire.
        id: "retour",
        size: { width: 0.36, depth: 3.71 },
        polygon: "885,0 914,0 914,480 885,468",
        quad: [
          [885, -342.9],
          [914, -395.9],
          [914, 480],
          [885, 468],
        ],
        pied: [[885, 491], [914, 503.8]],
      },
      {
        // Mur frontal derrière la baignoire (au-dessus du rebord).
        id: "baignoire",
        size: { width: 1.03, depth: 3.71 },
        polygon: "914,0 1158,0 1158,356 948,358 932,358 932,480 914,480",
        quad: [
          [914, -395.9],
          [1158, -395.9],
          [1158, 482.5],
          [914, 482.5],
        ],
      },
      {
        // Mur droit fuyant au-dessus de la baignoire (robinetterie devant).
        id: "droit",
        size: { width: 1.71, depth: 3.71 },
        polygon: "1158,0 1536,0 1536,402 1158,356",
        quad: [
          [1158, -395.9],
          [1536, -823.4],
          [1536, 573.3],
          [1158, 482.5],
        ],
      },
    ],
  },
  {
    id: "chambre",
    floorSize: { width: 5.07, depth: 4.5 },
    image: "/images/simulateur/chambre.jpg",
    width: 1536,
    height: 1024,
    floorPolygon:
      "0,559.5 305.8,447.0 400,446 394,450 383,460 373,470 366,480 360,490 357,500 356,506 356,566 359,572 1062,572 1066,566 1067,508 1071,503 1068,490 1063,480 1057,470 1051,460 1120,460 1120,447 1185,447 1255,481 1352,482 1352,544.2 1536,649.8 1536,1024 0,1024",
    // Quad calé sur la plinthe du fond et les deux lignes de fuite des
    // murs latéraux (point de fuite ~ (817,275)), élargi à droite pour
    // couvrir aussi le sol du couloir derrière le pilier.
    floorQuad: [
      [305, 446],
      [1352, 446],
      [3160, 1024],
      [-1412, 1024],
    ],
    // Même méthode que le salon : horizon et hauteur de caméra déduits de
    // floorQuad, pied de chaque mur mesuré sur la photo, quad = pied
    // relevé de 0,10 m (plinthe ~8 cm + marge) et de 3,8 m.
    camera: { horizon: 274.3, hauteur: 0.831 },
    walls: [
      {
        // Mur de la tête de lit (x 305→1183).
        id: "fond",
        size: { width: 4.23, depth: 3.7 },
        occluder: "/images/simulateur/chambre-avant-plan.png",
        polygon: "305,0 1183,0 1183,426 305,426",
        quad: [
          [305, -342.3],
          [1183, -342.3],
          [1183, 426.2],
          [305, 426.2],
        ],
        pied: [[305, 447], [1183, 447]],
        refletExclu: [[352, 1125]],
      },
      {
        // Mur gauche fuyant : à côté de la fenêtre, appui et allège compris.
        id: "fenetre",
        size: { width: 2.46, depth: 3.7 },
        polygon: "200,0 305,0 305,426 0,528 0,387 165,368 200,368",
        quad: [
          [-30, -795.8],
          [305, -342.3],
          [305, 426.2],
          [-30, 538.0],
        ],
        pied: [[-30, 574.0], [305, 447]],
      },
      {
        // Embrasure de la fenêtre (face frontale entre cadre et nu du mur).
        id: "embrasure",
        size: { width: 0.13, depth: 3.34 },
        polygon: "165,0 200,0 200,368 165,368",
        quad: [
          [165, -513],
          [200, -513],
          [200, 372],
          [165, 372],
        ],
      },
      {
        // Flanc droit fuyant entre le fond et le pilier.
        id: "flanc",
        size: { width: 0.95, depth: 3.7 },
        polygon: "1183,0 1257,0 1257,456 1183,426",
        quad: [
          [1183, -342.3],
          [1257, -463.7],
          [1257, 456.1],
          [1183, 426.2],
        ],
        pied: [[1183, 447], [1257, 481]],
      },
      {
        // Face du renfoncement (frontale).
        id: "renfoncement",
        size: { width: 0.37, depth: 3.7 },
        polygon: "1257,0 1350,0 1350,456 1257,456",
        quad: [
          [1257, -463.7],
          [1350, -463.7],
          [1350, 456.1],
          [1257, 456.1],
        ],
        pied: [[1257, 481], [1350, 481]],
      },
      {
        // Mur droit proche, fuyant.
        id: "couloir",
        size: { width: 1.05, depth: 3.7 },
        polygon: "1350,0 1536,0 1536,599 1350,508",
        quad: [
          [1350, -674.4],
          [1536, -1042.2],
          [1536, 598.7],
          [1350, 508.0],
        ],
        pied: [[1350, 540], [1536, 643]],
      },
    ],
  },
  {
    id: "terrasse",
    // Dalles de 120 cm visibles sur la photo : leurs joints donnent une
    // caméra à ~1,09 m ; largeur/profondeur déduites du quad ci-dessous.
    floorSize: { width: 5.06, depth: 5.36 },
    image: "/images/simulateur/terrasse.jpg",
    width: 1536,
    height: 1024,
    // Masque : plinthe du muret à gauche, dessous du fauteuil, canapé,
    // pied de table et pot, seuil de la baie vitrée à droite.
    // occluder = calque PNG transparent du feuillage au premier plan et
    // de l'ossature du fauteuil, redessinés par-dessus le carrelage.
    occluder: "/images/simulateur/terrasse-avant-plan.png",
    floorPolygon:
      "0,1024 0,560 300,436 312,449 537,449 538.7,427 577,427 577,442 587,442 587,420 715,420 740,421 756,423 750,487 762,492 870,492 884,487 880,423 900,421 925,420 1064,420 1064,443 1075,443 1082,422 1160,421 1165,414 1230,443 1298,441 1300,452 1536,572 1536,1024",
    // Point de fuite (830,217) = intersection de la plinthe du muret et
    // du seuil de la baie (horizon des collines à y≈212).
    floorQuad: [
      [354, 405],
      [1226, 405],
      [2531, 1024],
      [-1212, 1024],
    ],
  },
];

// Pièces proposées dans le parcours du simulateur, dans l'ordre
// d'affichage. La Terrasse est déclarée mais marquée indisponible
// tant qu'aucune photo réelle n'a été fournie pour cet espace : on
// ne génère pas de visuel factice.
export const WIZARD_ROOM_IDS = ["salon", "cuisine", "salle-de-bain", "chambre", "terrasse"];

export function getWizardRooms() {
  return WIZARD_ROOM_IDS.map((id) => {
    const room = ROOMS.find((r) => r.id === id) ?? null;
    return { id, room, disponible: Boolean(room) };
  });
}

export function isRoomDisponible(id) {
  return ROOMS.some((r) => r.id === id);
}

export function getRoom(id) {
  return ROOMS.find((r) => r.id === id) ?? ROOMS[0];
}

/** Une pièce propose-t-elle une simulation murale (en plus du sol) ? */
export function hasMur(room) {
  return Boolean(room?.walls?.length);
}

/**
 * Résout la ou les surfaces à simuler ("sol" ou "mur") sous la forme
 * consommée par le moteur de rendu : un tableau de
 * { polygon, quad, size, occluder }, un élément par plan. Pour "mur",
 * `zone` filtre quels murs sont inclus ("principal" | "gauche" |
 * "droite" | "tous" | absent → tous les murs, chacun avec sa propre
 * perspective : pas de plaquage sur un plan unique). Renvoie [] si le
 * type demandé n'est pas disponible.
 */
export function getSurfaces(room, type, zone) {
  if (!room) return [];
  if (type === "mur") {
    const walls =
      !zone || zone === "tous" ? room.walls ?? [] : (room.walls ?? []).filter((w) => w.zone === zone);
    return walls.map((wall) => ({
      type: "mur",
      murId: wall.id,
      polygon: wall.polygon,
      quad: wall.quad,
      size: { width: wall.size.width, depth: wall.size.depth ?? wall.size.height },
      occluder: wall.occluder ?? null,
      // Pose réelle : les rangées partent du haut de la plinthe (bas du
      // quad), la rangée coupée est en haut.
      alignerBas: true,
      pied: wall.pied ?? null,
      refletExclu: wall.refletExclu ?? [],
    }));
  }
  if (!room.floorPolygon || !room.floorQuad) return [];
  return [
    {
      type: "sol",
      polygon: room.floorPolygon,
      quad: room.floorQuad,
      size: room.floorSize ?? { width: 5, depth: 4 },
      occluder: room.occluder ?? null,
    },
  ];
}
