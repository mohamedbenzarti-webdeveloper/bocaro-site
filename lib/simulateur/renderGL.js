// Rendu du carrelage d'une surface en WebGL.
//
// Pourquoi : le moteur Canvas 2D dessine chaque carreau en 2 triangles
// (≈ 9 500 triangles pour un grand sol). Sur certains GPU de téléphone
// (ex. Adreno, Chrome Android), ce volume de petits dessins ne s'affichait
// pas : sol vide. Ici, le GPU calcule directement, pour CHAQUE PIXEL, le
// point du plan correspondant (homographie inverse), le carreau qui s'y
// trouve, s'il tombe dans un joint, et la partie de texture à afficher :
// un seul dessin, quel que soit le nombre de carreaux, perspective exacte.
//
// Mêmes règles que le moteur 2D (renderFloor.js) : nombre de carreaux
// d'après les dimensions réelles, joint proportionnel, rotation 90°,
// recadrage centré de la texture, rangées alignées en bas pour les murs.
// Renvoie null si WebGL est indisponible : le moteur 2D prend le relais.

const SOMMETS = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

function sourceFragment(avecGradients) {
  return `
${avecGradients ? "#extension GL_OES_standard_derivatives : enable\n#extension GL_EXT_shader_texture_lod : enable" : ""}
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat3 Hinv;       // pixel -> plan (carré unité)
uniform float hauteur;   // hauteur du canvas (axe y vers le bas)
uniform vec2 n;          // nombre de carreaux (u, v)
uniform vec2 marge;      // demi-joint, en fraction de carreau
uniform float alignerBas;
uniform float tourne;
uniform vec4 crop;       // recadrage texture normalisé (x, y, w, h)
uniform vec3 joint;
uniform sampler2D tex;

void main() {
  vec2 px = vec2(gl_FragCoord.x, hauteur - gl_FragCoord.y);
  vec3 q = Hinv * vec3(px, 1.0);
  if (abs(q.z) < 1e-12) discard;
  vec2 uv = q.xy / q.z;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;

  float lu = fract(uv.x * n.x);
  float lv = alignerBas > 0.5 ? 1.0 - fract((1.0 - uv.y) * n.y) : fract(uv.y * n.y);

  if (lu < marge.x || lu > 1.0 - marge.x || lv < marge.y || lv > 1.0 - marge.y) {
    gl_FragColor = vec4(joint, 1.0);
    return;
  }
  float tu = (lu - marge.x) / (1.0 - 2.0 * marge.x);
  float tv = (lv - marge.y) / (1.0 - 2.0 * marge.y);
  vec2 st = tourne > 0.5
    ? vec2(crop.x + tv * crop.z, crop.y + (1.0 - tu) * crop.w)
    : vec2(crop.x + tu * crop.z, crop.y + tv * crop.w);
${
  avecGradients
    ? `
  // Gradients continus (sans le saut de fract en bord de carreau) : choix
  // du niveau de mipmap correct partout, pas de liseré aux bords.
  vec2 c = uv * n;
  vec2 ex = vec2(1.0 / (1.0 - 2.0 * marge.x), 1.0 / (1.0 - 2.0 * marge.y));
  vec2 dcx = dFdx(c) * ex;
  vec2 dcy = dFdy(c) * ex;
  vec2 gx = tourne > 0.5 ? vec2(dcx.y * crop.z, -dcx.x * crop.w) : vec2(dcx.x * crop.z, dcx.y * crop.w);
  vec2 gy = tourne > 0.5 ? vec2(dcy.y * crop.z, -dcy.x * crop.w) : vec2(dcy.x * crop.z, dcy.y * crop.w);
  gl_FragColor = vec4(texture2DGradEXT(tex, st, gx, gy).rgb, 1.0);`
    : `
  gl_FragColor = vec4(texture2D(tex, st).rgb, 1.0);`
}
}
`;
}

let etat = null; // { canvas, gl, prog, loc, textures }

function compiler(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error("Shader : " + log);
  }
  return s;
}

function initialiser() {
  if (etat?.gl && !etat.gl.isContextLost()) return etat;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const avecGradients = Boolean(gl.getExtension("OES_standard_derivatives") && gl.getExtension("EXT_shader_texture_lod"));
  const prog = gl.createProgram();
  gl.attachShader(prog, compiler(gl, gl.VERTEX_SHADER, SOMMETS));
  gl.attachShader(prog, compiler(gl, gl.FRAGMENT_SHADER, sourceFragment(avecGradients)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("Programme : " + gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  // Un rectangle couvrant tout le canvas (2 triangles).
  const tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

  const loc = {};
  for (const nom of ["Hinv", "hauteur", "n", "marge", "alignerBas", "tourne", "crop", "joint", "tex"]) {
    loc[nom] = gl.getUniformLocation(prog, nom);
  }
  etat = { canvas, gl, prog, loc, textures: new WeakMap(), avecGradients };
  return etat;
}

/** Texture GL (512×512, puissance de 2 pour les mipmaps), en cache par image. */
function texture(gl, textures, image) {
  let t = textures.get(image);
  if (t) return t;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const cctx = c.getContext("2d");
  cctx.imageSmoothingQuality = "high";
  cctx.drawImage(image, 0, 0, 512, 512);
  t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  textures.set(image, t);
  return t;
}

/** Inverse d'une homographie [a,b,c,d,e,f,g,h] (i = 1), en 3×3 ligne par ligne. */
function inverser(H) {
  const [a, b, c, d, e, f, g, h] = H;
  const i = 1;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (!det) return null;
  return [
    A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
    B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
    C / det, -(a * h - b * g) / det, (a * e - b * d) / det,
  ];
}

function couleurRGB(css) {
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = css;
  const v = c.fillStyle; // normalisé en #rrggbb ou rgba(...)
  if (v.startsWith("#")) return [1, 3, 5].map((k) => parseInt(v.slice(k, k + 2), 16) / 255);
  const m = v.match(/[\d.]+/g) ?? [255, 255, 255];
  return m.slice(0, 3).map((x) => Number(x) / 255);
}

/**
 * Dessine le carrelage d'une surface (joint + carreaux, sans masque) et
 * renvoie le canvas WebGL, à composer ensuite par l'appelant ; null si
 * WebGL est indisponible ou en échec.
 */
export function carrelageGL({ tileImage, width, height, H, cellU, cellV, nu, nv, margeU, margeV, tourne, alignerBas, jointColor, ratio }) {
  let e;
  try {
    e = initialiser();
  } catch {
    etat = null;
    return null;
  }
  if (!e) return null;
  const { canvas, gl, loc, textures } = e;
  const Hinv = inverser(H);
  if (!Hinv) return null;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Recadrage centré de la texture au format du carreau (comme en 2D).
  const tw = tileImage.naturalWidth || tileImage.width;
  const th = tileImage.naturalHeight || tileImage.height;
  const cropW = tw / th > ratio ? th * ratio : tw;
  const cropH = tw / th > ratio ? th : tw / ratio;

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture(gl, textures, tileImage));
  gl.uniform1i(loc.tex, 0);
  // GLSL attend les matrices colonne par colonne : on transpose.
  gl.uniformMatrix3fv(loc.Hinv, false, [Hinv[0], Hinv[3], Hinv[6], Hinv[1], Hinv[4], Hinv[7], Hinv[2], Hinv[5], Hinv[8]]);
  gl.uniform1f(loc.hauteur, height);
  gl.uniform2f(loc.n, nu, nv);
  gl.uniform2f(loc.marge, margeU, margeV);
  gl.uniform1f(loc.alignerBas, alignerBas ? 1 : 0);
  gl.uniform1f(loc.tourne, tourne ? 1 : 0);
  gl.uniform4f(loc.crop, (tw - cropW) / 2 / tw, (th - cropH) / 2 / th, cropW / tw, cropH / th);
  gl.uniform3f(loc.joint, ...couleurRGB(jointColor));
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) return null;
  return canvas;
}
