// Calcul d'homographie : la matrice 3x3 qui transforme un point du
// plan du sol (repère "vu du dessus", où tous les carreaux sont des
// carrés identiques) vers un pixel de la photo (où ils apparaissent
// en perspective).
//
// C'est le coeur du moteur : c'est ce qui fait que les carreaux
// rétrécissent vers le fond et que les lignes de joint convergent
// vers le point de fuite, au lieu d'être un motif plat.

// Résout un système linéaire A·x = b par élimination de Gauss avec
// pivot partiel (8x8 ici, donc largement assez rapide).
function resoudre(A, b) {
  const n = b.length;
  const M = A.map((ligne, i) => [...ligne, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let l = col + 1; l < n; l++) {
      if (Math.abs(M[l][col]) > Math.abs(M[pivot][col])) pivot = l;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) return null; // dégénéré
    [M[col], M[pivot]] = [M[pivot], M[col]];

    for (let l = 0; l < n; l++) {
      if (l === col) continue;
      const f = M[l][col] / M[col][col];
      for (let c = col; c <= n; c++) M[l][c] -= f * M[col][c];
    }
  }

  const x = new Array(n);
  for (let i = 0; i < n; i++) x[i] = M[i][n] / M[i][i];
  return x;
}

/**
 * Homographie du carré unité [0,1]x[0,1] vers un quadrilatère image.
 * @param {Array<[number,number]>} quad 4 coins image, dans l'ordre
 *   [fond-gauche, fond-droit, avant-droit, avant-gauche].
 * @returns {number[]|null} matrice [a,b,c,d,e,f,g,h] (i = 1)
 */
export function homographieDepuisCarreUnite(quad) {
  const src = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];

  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const [x, y] = quad[i];
    A.push([u, v, 1, 0, 0, 0, -x * u, -x * v]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -y * u, -y * v]);
    b.push(y);
  }

  const H = resoudre(A, b);
  if (!H) return null;

  // Garde-fou supplémentaire : le seuil de pivot dans `resoudre` ne
  // suffit pas toujours à détecter un quadrilatère dégénéré (ex. 3
  // coins alignés). Dans ces cas, une matrice peut être renvoyée alors
  // qu'un des 4 coins source retombe exactement sur l'asymptote de la
  // projection (dénominateur w = 0), produisant silencieusement des
  // NaN/Infinity en aval (dans le moteur de rendu). On revalide donc
  // ici que les 4 coins connus se reprojettent bien sur des nombres
  // finis avant de considérer la matrice utilisable.
  for (const [u, v] of src) {
    const [x, y] = projeter(H, u, v);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  }

  return H;
}

/** Projette un point (u,v) du plan du sol vers ses pixels image. */
export function projeter(H, u, v) {
  const w = H[6] * u + H[7] * v + 1;
  return [
    (H[0] * u + H[1] * v + H[2]) / w,
    (H[3] * u + H[4] * v + H[5]) / w,
  ];
}
