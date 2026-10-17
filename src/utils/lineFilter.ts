/**
 * Filtre « Lignes » — d'après les toiles d'Adrien Da Silva.
 *
 * Ce que font ses toiles, et donc ce filtre :
 *   - le sujet est dessiné par des tirets épais à bouts ronds, sur une trame de lignes régulières ;
 *   - les zones claires restent vides : le fond respire ;
 *   - deux tons d'une même encre (foncé, moyen) sur un fond clair, parfois une touche fluo ;
 *   - les lignes sont horizontales (« Lignes de vies ») ou verticales (« Hors ligne »).
 * Les palettes sont mesurées sur ses œuvres du catalogue 2026.
 *
 * Réglage automatique : le seuil clair / foncé est calculé pour chaque photo (méthode d'Otsu),
 * et le contraste local est renforcé, si bien qu'une photo sombre, surexposée ou terne
 * donne un dessin lisible sans toucher à rien. Le visiteur ne règle que le détail et la lumière.
 */

export interface LinePalette {
  id: string;
  label: string;
  /** Œuvre d'où vient la palette */
  source: string;
  ink: string;
  mid: string;
  ground: string;
  accent: string;
}

export const LINE_PALETTES: LinePalette[] = [
  { id: 'outremer', label: 'Outremer', source: 'Lignes de vies', ink: '#16139e', mid: '#5a5cb0', ground: '#ede5d2', accent: '#ff3d8b' },
  { id: 'aubergine', label: 'Aubergine', source: 'Temps libre 3', ink: '#452843', mid: '#8a6878', ground: '#e1dbd2', accent: '#ff4fa3' },
  { id: 'sud', label: 'Sud', source: 'On dirait le sud', ink: '#52204b', mid: '#a26271', ground: '#e8cdbf', accent: '#ff5a36' },
  { id: 'vita', label: 'Vita lenta', source: 'Vita lenta', ink: '#3b2f54', mid: '#7c5c77', ground: '#dcaea2', accent: '#ff4f6d' },
  { id: 'encre', label: 'Encre', source: 'Temps libre 1.618', ink: '#241c1f', mid: '#6b5d5f', ground: '#ebe5d9', accent: '#ff4fa3' },
  { id: 'nuit', label: 'Violet nuit', source: 'Temps libre 2.0', ink: '#40275f', mid: '#8e819a', ground: '#d2d3ca', accent: '#ff4fa3' },
];

export interface LineOptions {
  palette: string;
  /** Détail : nombre de lignes sur la hauteur (ou la largeur en vertical) */
  lines: number;
  /** Lumière : -1 (plus d'encre) … +1 (plus de vide) autour du réglage automatique */
  light: number;
  /** Touches fluo sur les couleurs vives de la photo */
  accent: boolean;
  vertical: boolean;
  /** Réservé aux essais : mélange ton général / contraste local */
  tone?: { general: number; local: number };
}

export const DEFAULT_LINE_OPTIONS: LineOptions = {
  palette: 'outremer',
  lines: 90,
  light: 0,
  accent: true,
  vertical: false,
};

// Constantes de style (réglées sur ses toiles, plus exposées au visiteur)
const WEIGHT = 0.78;   // épaisseur d'un tiret plein, en part de l'écart entre lignes
const DASH = 9;        // longueur moyenne d'un tiret, en épaisseurs
// Ton : part du ton général (le reste vient du contraste local, qui allège les grandes zones
// uniformes comme un ciel et fait ressortir les contours du sujet)
const TONE = { general: 0.4, local: 1.8 }; // choisi sur banc d'essai (10 photos, 3 expositions)

/** Générateur pseudo-aléatoire stable : le même réglage donne toujours la même image. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

function capsule(ctx: CanvasRenderingContext2D, x0: number, x1: number, cy: number, t: number, vertical: boolean) {
  const r = t / 2;
  const len = Math.max(x1 - x0, t);
  ctx.beginPath();
  if (vertical) ctx.roundRect(cy - r, x0, t, len, r);
  else ctx.roundRect(x0, cy - r, len, t, r);
  ctx.fill();
}

/** Table de sommes cumulées : moyenne de n'importe quel rectangle en 4 lectures. */
function integral(values: Float32Array, w: number, h: number): Float64Array {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) {
    let row = 0;
    for (let x = 1; x <= w; x++) {
      row += values[(y - 1) * w + (x - 1)];
      I[y * (w + 1) + x] = I[(y - 1) * (w + 1) + x] + row;
    }
  }
  return I;
}

function boxMean(I: Float64Array, w: number, h: number, x0: number, y0: number, x1: number, y1: number): number {
  x0 = Math.max(0, Math.min(w, Math.floor(x0))); x1 = Math.max(0, Math.min(w, Math.ceil(x1)));
  y0 = Math.max(0, Math.min(h, Math.floor(y0))); y1 = Math.max(0, Math.min(h, Math.ceil(y1)));
  const area = (x1 - x0) * (y1 - y0);
  if (area <= 0) return 0;
  const W = w + 1;
  return (I[y1 * W + x1] - I[y0 * W + x1] - I[y1 * W + x0] + I[y0 * W + x0]) / area;
}

/** Seuil d'Otsu sur la « sombreur » (0–1) : sépare au mieux le sujet du fond pour CETTE photo. */
function otsu(dark: Float32Array): number {
  const hist = new Float64Array(64);
  for (const d of dark) hist[Math.min(63, Math.floor(d * 64))]++;
  const total = dark.length;
  let sum = 0;
  for (let i = 0; i < 64; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, t = 32;
  for (let i = 0; i < 64; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; t = i; }
  }
  return (t + 0.5) / 64;
}

/** L'analyse ne dépend que de la photo : calculée une fois, réutilisée à chaque mouvement de curseur. */
const analyses = new WeakMap<ImageData, ReturnType<typeof analyseOnce>>();
const analyse = (img: ImageData) => {
  let a = analyses.get(img);
  if (!a) { a = analyseOnce(img); analyses.set(img, a); }
  return a;
};

/** Photo → sombreur (niveaux automatiques 1–99 %) et vivacité des couleurs, avec leurs tables cumulées. */
function analyseOnce(img: ImageData) {
  const { width: w, height: h, data } = img;
  const n = w * h;
  const lum = new Float32Array(n);
  const vivid = new Float32Array(n);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[p] = l;
    hist[l | 0]++;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    // Fluo seulement sur les roses, rouges et orangés vifs (comme ses soleils), jamais sur un bleu
    const warm = max === r && r - Math.min(g, b) > 110 && (g < r * 0.75 || b > g);
    vivid[p] = warm && max > 120 ? (max - min) / 255 : 0;
  }
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.01) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.01) { hi = v; break; } }
  const span = Math.max(1, hi - lo);
  const dark = new Float32Array(n);
  for (let p = 0; p < n; p++) dark[p] = 1 - Math.min(1, Math.max(0, (lum[p] - lo) / span));
  return { w, h, dark, D: integral(dark, w, h), V: integral(vivid, w, h), split: otsu(dark) };
}

// ─── Premier plan : végétation et bâtiments ───────────────────────────────────

/**
 * Masque « premier plan » (0–1 par pixel) sans intelligence artificielle :
 *   - végétation : excès de vert (2V − R − B), même à l'ombre ;
 *   - bâtiments : densité d'arêtes droites, horizontales ou verticales, sur des tons peu saturés ;
 *   - ciel et grands aplats clairs : zones lisses et lumineuses, écartées.
 * Le masque est lissé à l'échelle d'une dizaine de lignes pour donner des silhouettes nettes.
 */
function subjectMask(img: ImageData): Float32Array {
  const { width: w, height: h, data } = img;
  const n = w * h;
  const lum = new Float32Array(n), veg = new Float32Array(n), sat = new Float32Array(n);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    lum[p] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const exg = (2 * g - r - b) / (r + g + b + 30);
    veg[p] = Math.min(1, Math.max(0, exg * 4.5)) * (lum[p] > 0.04 ? 1 : 0);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    sat[p] = max ? (max - min) / max : 0;
  }
  // Arêtes (Sobel) : force × caractère horizontal ou vertical, sur tons peu saturés
  const edge = new Float32Array(n), anyEdge = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = (lum[p - w + 1] + 2 * lum[p + 1] + lum[p + w + 1]) - (lum[p - w - 1] + 2 * lum[p - 1] + lum[p + w - 1]);
      const gy = (lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1]) - (lum[p - w - 1] + 2 * lum[p - w] + lum[p - w + 1]);
      const ax = Math.abs(gx), ay = Math.abs(gy), m = ax + ay;
      anyEdge[p] = m;
      const axis = m > 0 ? Math.abs(ax - ay) / m : 0; // 1 = arête droite, 0 = diagonale
      edge[p] = m * axis * (1 - 0.6 * sat[p]);
    }
  }
  const E = integral(edge, w, h), A = integral(anyEdge, w, h), G = integral(veg, w, h), L = integral(lum, w, h);
  const r = Math.max(3, Math.round(Math.max(w, h) / 45)); // voisinage proche
  const R = r * 4;                                          // voisinage large : remplit les murs lisses
  const near = new Float32Array(n), far = new Float32Array(n);
  const nearVals: number[] = [], farVals: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      near[p] = boxMean(E, w, h, x - r, y - r, x + r + 1, y + r + 1);
      far[p] = boxMean(E, w, h, x - R, y - R, x + R + 1, y + R + 1);
      if ((x + y) % 7 === 0) { nearVals.push(near[p]); farVals.push(far[p]); }
    }
  }
  const pct = (v: number[]) => { v.sort((a, b) => a - b); return v[Math.floor(v.length * 0.9)] || 1; };
  const refNear = pct(nearVals), refFar = pct(farVals); // 90e centile = « très bâti »
  const mask = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      // Bâtiment : arêtes droites proches, ou mur lisse entouré d'arêtes droites
      const building = Math.min(1, Math.max(near[p] / refNear, 0.95 * far[p] / refFar));
      const green = boxMean(G, w, h, x - r, y - r, x + r + 1, y + r + 1);
      const texture = boxMean(A, w, h, x - R, y - R, x + R + 1, y + R + 1);
      const bright = boxMean(L, w, h, x - r, y - r, x + r + 1, y + r + 1);
      const tex = boxMean(A, w, h, x - r, y - r, x + r + 1, y + r + 1);
      // Ciel / aplat lointain : lisse de près ET de loin, clair, plutôt en haut de l'image
      const smooth = Math.max(0, 1 - tex / (refNear * 1.2)) * Math.max(0, 1 - texture / (refFar * 1.6));
      const sky = smooth * Math.min(1, Math.max(0, (bright - 0.35) * 2.2)) * (0.55 + 0.45 * (1 - y / h));
      mask[p] = Math.min(1, Math.max(0, Math.max(building, Math.min(1, green * 2.2)) - 1.1 * sky));
    }
  }
  return mask;
}

/**
 * Masque « peinture » (préréglages tirés de ses toiles) : on garde l'encre d'Adrien,
 * c'est-à-dire ce qui est nettement plus sombre que le fond de la toile.
 */
function paintingMask(img: ImageData): Float32Array {
  const a = analyse(img);
  const { w, h } = a;
  const r = Math.max(2, Math.round(Math.max(w, h) / 150));
  const mask = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = boxMean(a.D, w, h, x - r, y - r, x + r + 1, y + r + 1);
      mask[y * w + x] = Math.min(1, Math.max(0, (d - a.split) * 3 + 0.5));
    }
  }
  return mask;
}

export type FrontKind = 'photo' | 'peinture';
const masks = new WeakMap<ImageData, Float64Array>();
function maskIntegral(img: ImageData, kind: FrontKind): Float64Array {
  let M = masks.get(img);
  if (!M) {
    M = integral(kind === 'peinture' ? paintingMask(img) : subjectMask(img), img.width, img.height);
    masks.set(img, M);
  }
  return M;
}

/** Aperçu du masque premier plan (gris : blanc = gardé), pour vérifier la détection. */
export function drawSubjectMask(img: ImageData, out: HTMLCanvasElement) {
  const m = subjectMask(img);
  out.width = img.width; out.height = img.height;
  const ctx = out.getContext('2d')!;
  const id = ctx.createImageData(img.width, img.height);
  for (let p = 0; p < m.length; p++) {
    const v = Math.round(m[p] * 255);
    id.data[p * 4] = id.data[p * 4 + 1] = id.data[p * 4 + 2] = v; id.data[p * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
}

// ─── Dessin d'une couche de lignes ───────────────────────────────────────────

interface Layer {
  ink: string;      // tirets pleins
  mid: string;      // tirets moyens et trame
  accent: string | null;
  /** Premier plan : seules les zones du masque sont dessinées, et le fond y est effacé */
  mask?: { M: Float64Array; cut: number; ground: string };
}

function drawLayer(ctx: CanvasRenderingContext2D, img: ImageData, opts: LineOptions, scale: number, layer: Layer) {
  const a = analyse(img);
  const across = opts.vertical ? a.w : a.h;
  const along = opts.vertical ? a.h : a.w;
  const gap = across / opts.lines;
  const full = gap * WEIGHT;
  const step = Math.max(1, full / 2);
  const ctxWin = gap * 6; // voisinage du contraste local
  const rand = seeded(opts.lines * 31 + Math.round(opts.light * 100) + (opts.vertical ? 7 : 0));
  const tone = opts.tone ?? TONE;

  // Seuils : automatiques (Otsu), décalés par le curseur « lumière / sensibilité »
  const t1 = Math.min(0.8, Math.max(0.2, a.split + opts.light * 0.18));
  const t2 = t1 + (1 - t1) * 0.42;

  const box = (s: number, cy: number) => opts.vertical
    ? [cy - gap / 2, s, cy + gap / 2, s + step] as const
    : [s, cy - gap / 2, s + step, cy + gap / 2] as const;

  type Level = 0 | 1 | 2 | 3; // vide, ton moyen, encre, fluo
  const color = [null, layer.mid, layer.ink, layer.accent ?? layer.ink];
  const trame = Math.max(0.6, full * 0.14) * scale;
  const line = (x0: number, x1: number, cy: number, t: number) =>
    opts.vertical ? ctx.fillRect(cy - t / 2, x0, t, x1 - x0) : ctx.fillRect(x0, cy - t / 2, x1 - x0, t);

  for (let li = 0; li < opts.lines; li++) {
    const cy = (li + 0.5) * gap;
    const levels: Level[] = [];
    const inside: boolean[] = [];
    for (let s = 0; s < along; s += step) {
      const [x0, y0, x1, y1] = box(s, cy);
      const d = boxMean(a.D, a.w, a.h, x0, y0, x1, y1);
      const cx = (x0 + x1) / 2, cyy = (y0 + y1) / 2;
      const local = boxMean(a.D, a.w, a.h, cx - ctxWin, cyy - ctxWin, cx + ctxWin, cyy + ctxWin);
      let dark = Math.min(1, Math.max(0, tone.general * d + (1 - tone.general) * (0.5 + tone.local * (d - local))));
      const vivid = boxMean(a.V, a.w, a.h, x0, y0, x1, y1);
      let keep = true;
      if (layer.mask) {
        const m = boxMean(layer.mask.M, a.w, a.h, x0, y0, x1, y1);
        keep = m >= layer.mask.cut;
        dark = Math.min(1, dark * (0.75 + 0.5 * m)); // le sujet ressort un peu plus
      }
      let lv: Level = !keep || dark < t1 ? 0 : dark < t2 ? 1 : 2;
      if (keep && layer.accent && vivid > 0.32 && dark > t1 * 0.6) lv = 3;
      levels.push(lv);
      inside.push(keep);
    }

    // Premier plan : effacer le fond sous la silhouette, puis trame verticale à l'intérieur seulement
    if (layer.mask) {
      let i = 0;
      while (i < inside.length) {
        if (!inside[i]) { i++; continue; }
        let j = i;
        while (j < inside.length && inside[j]) j++;
        ctx.fillStyle = layer.mask.ground;
        line(i * step * scale, Math.min(along, j * step) * scale, cy * scale, gap * scale + 0.5);
        ctx.fillStyle = layer.mid; ctx.globalAlpha = 0.35;
        line(i * step * scale, Math.min(along, j * step) * scale, cy * scale, trame);
        ctx.globalAlpha = 1;
        i = j;
      }
    } else {
      // Trame fine sous les tirets, comme le fond tramé de ses toiles
      ctx.fillStyle = layer.mid; ctx.globalAlpha = 0.35;
      line(0, along * scale, cy * scale, trame);
      ctx.globalAlpha = 1;
    }

    let i = 0;
    while (i < levels.length) {
      const lv = levels[i];
      let j = i;
      while (j < levels.length && levels[j] === lv) j++;
      // Un ton moyen isolé sur une seule case n'est que du bruit : on le laisse vide
      if (lv !== 0 && !(lv === 1 && j - i < 2)) {
        const thick = (lv === 1 ? full * 0.62 : full) * scale;
        let x = i * step;
        const end = j * step;
        ctx.fillStyle = color[lv]!;
        while (x < end) {
          const x1 = Math.min(end, x + full * DASH * (0.55 + rand() * 0.9));
          capsule(ctx, x * scale, x1 * scale, cy * scale, thick, opts.vertical);
          x = x1 + full * (0.35 + rand() * 0.5);
        }
      }
      i = j;
    }
  }
}

/**
 * Dessine le filtre sur `out` à la taille de `img` multipliée par `scale`
 * (on analyse une image réduite, on dessine en grand : l'export reste net).
 */
export function applyLineFilter(img: ImageData, out: HTMLCanvasElement, opts: LineOptions = DEFAULT_LINE_OPTIONS, scale = 1) {
  const pal = LINE_PALETTES.find(p => p.id === opts.palette) ?? LINE_PALETTES[0];
  out.width = Math.round(img.width * scale);
  out.height = Math.round(img.height * scale);
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, out.width, out.height);
  drawLayer(ctx, img, opts, scale, { ink: pal.ink, mid: pal.mid, accent: opts.accent ? pal.accent : null });
}

// ─── Deux photos superposées ─────────────────────────────────────────────────

export interface OverlayOptions {
  palette: string;
  lines: number;
  accent: boolean;
  /** Fond : lignes horizontales (true = verticales) */
  backVertical: boolean;
  backLight: number;
  /** Premier plan : sensibilité (-1 … +1) et seuil de détection (0 = tout, 1 = presque rien) */
  frontLight: number;
  frontReach: number;
  /** « photo » : végétation et bâtiments détectés ; « peinture » : préréglage tiré d'une toile */
  frontKind: FrontKind;
}

export const DEFAULT_OVERLAY_OPTIONS: OverlayOptions = {
  palette: 'outremer',
  lines: 90,
  accent: true,
  backVertical: false,
  backLight: 0.2,
  frontLight: 0,
  frontReach: 0.45,
  frontKind: 'photo',
};

/**
 * Fond en lignes horizontales (ton moyen, plus léger), premier plan en lignes verticales
 * (encre) limité à la végétation et aux bâtiments. Les deux images doivent avoir la même taille
 * (voir `fitTo`).
 */
export function applyOverlay(back: ImageData, front: ImageData, out: HTMLCanvasElement, o: OverlayOptions = DEFAULT_OVERLAY_OPTIONS, scale = 1) {
  const pal = LINE_PALETTES.find(p => p.id === o.palette) ?? LINE_PALETTES[0];
  out.width = Math.round(back.width * scale);
  out.height = Math.round(back.height * scale);
  const ctx = out.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, out.width, out.height);
  const base = { palette: o.palette, lines: o.lines, accent: o.accent };
  // Fond : le ton moyen sert d'encre, pour laisser la vedette au premier plan
  drawLayer(ctx, back, { ...base, vertical: o.backVertical, light: o.backLight }, scale,
    { ink: pal.mid, mid: mix(pal.mid, pal.ground, 0.45), accent: o.accent ? pal.accent : null });
  drawLayer(ctx, front, { ...base, vertical: !o.backVertical, light: o.frontLight }, scale,
    { ink: pal.ink, mid: pal.mid, accent: o.accent ? pal.accent : null,
      mask: { M: maskIntegral(front, o.frontKind), cut: 0.08 + o.frontReach * 0.84, ground: pal.ground } });
}

/** Mélange de deux couleurs hexadécimales (t = part de b). */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, k) => Math.round(v + (pb[k] - v) * t).toString(16).padStart(2, '0')).join('');
}

// ─── Préréglages : végétations peintes par Adrien ───────────────────────────────

export interface FrontPreset { id: string; label: string; source: string; src: string; layout: 'frise' | 'centre' | 'gauche' }

export const FRONT_PRESETS: FrontPreset[] = [
  { id: 'roseaux', label: 'Roseaux', source: 'Monotype série', src: '/filtre/roseaux.webp', layout: 'frise' },
  { id: 'bord-de-mer', label: 'Bord de mer', source: 'Temps libre 1.618', src: '/filtre/bord-de-mer.webp', layout: 'gauche' },
  { id: 'plante', label: 'Plante', source: 'Lignes de vies 2', src: '/filtre/plante.webp', layout: 'centre' },
];

/**
 * Place une végétation peinte sur un fond clair aux dimensions voulues :
 * « frise » = répétée sur toute la largeur, posée en bas ; « centre » = au milieu, posée en bas ;
 * « gauche » = un massif sur le bord gauche, comme dans « Temps libre 1.618 ».
 */
export function placePreset(img: HTMLImageElement, layout: FrontPreset['layout'], width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  if (layout === 'frise') {
    const h = height * 0.78;
    const w = img.naturalWidth * (h / img.naturalHeight);
    for (let x = 0, k = 0; x < width; x += w * 0.92, k++) {
      ctx.save();
      // une copie sur deux en miroir : la frise ne se répète pas à l'identique
      if (k % 2) { ctx.translate(x + w, 0); ctx.scale(-1, 1); ctx.drawImage(img, 0, height - h, w, h); }
      else ctx.drawImage(img, x, height - h, w, h);
      ctx.restore();
    }
  } else if (layout === 'gauche') {
    const h = height * 0.92;
    const w = Math.min(width * 0.55, img.naturalWidth * (h / img.naturalHeight));
    ctx.drawImage(img, 0, height - h, w, h);
  } else {
    const s = Math.min(width * 0.8 / img.naturalWidth, height * 0.85 / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (width - w) / 2, height - h, w, h);
  }
  return ctx.getImageData(0, 0, width, height);
}

/** Recadre une image (centrée, sans déformation) aux dimensions d'une autre. */
export function fitTo(img: HTMLImageElement, width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const s = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  return ctx.getImageData(0, 0, width, height);
}

// ─── Chargement et export ────────────────────────────────────────────────────

/** Côté long de l'image analysée (le dessin, lui, est fait à l'échelle voulue). */
export const ANALYSIS_SIZE = 600;
/** Côté long de l'image enregistrée, en pixels. */
export const EXPORT_SIZE = 3000;

export function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve({ img, url });
    img.onerror = reject;
    img.src = url;
  });
}

export function extractImageData(img: HTMLImageElement, maxSide = ANALYSIS_SIZE): ImageData {
  const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * ratio));
  const height = Math.max(1, Math.round(img.naturalHeight * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/** Enregistre le canvas en PNG (sans perte). */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve();
    }, 'image/png');
  });
}
