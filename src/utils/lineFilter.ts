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

/**
 * Dessine le filtre sur `out` à la taille de `img` multipliée par `scale`
 * (on analyse une image réduite, on dessine en grand : l'export reste net).
 */
export function applyLineFilter(img: ImageData, out: HTMLCanvasElement, opts: LineOptions = DEFAULT_LINE_OPTIONS, scale = 1) {
  const pal = LINE_PALETTES.find(p => p.id === opts.palette) ?? LINE_PALETTES[0];
  const a = analyse(img);
  out.width = Math.round(a.w * scale);
  out.height = Math.round(a.h * scale);
  const ctx = out.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, out.width, out.height);

  const across = opts.vertical ? a.w : a.h;
  const along = opts.vertical ? a.h : a.w;
  const gap = across / opts.lines;
  const full = gap * WEIGHT;
  const step = Math.max(1, full / 2);
  const ctxWin = gap * 6; // voisinage du contraste local
  const rand = seeded(opts.lines * 31 + Math.round(opts.light * 100));

  // Seuils : automatiques (Otsu), décalés par le curseur « lumière »
  const t1 = Math.min(0.8, Math.max(0.2, a.split + opts.light * 0.18));
  const t2 = t1 + (1 - t1) * 0.42;

  const cell = (s: number, cy: number) => {
    const [x0, x1, y0, y1] = opts.vertical
      ? [cy - gap / 2, cy + gap / 2, s, s + step]
      : [s, s + step, cy - gap / 2, cy + gap / 2];
    const d = boxMean(a.D, a.w, a.h, x0, y0, x1, y1);
    const cx = (x0 + x1) / 2, cyy = (y0 + y1) / 2;
    const local = boxMean(a.D, a.w, a.h, cx - ctxWin, cyy - ctxWin, cx + ctxWin, cyy + ctxWin);
    const tone = opts.tone ?? TONE;
    return {
      dark: Math.min(1, Math.max(0, tone.general * d + (1 - tone.general) * (0.5 + tone.local * (d - local)))),
      vivid: boxMean(a.V, a.w, a.h, x0, y0, x1, y1),
    };
  };

  type Level = 0 | 1 | 2 | 3; // vide, ton moyen, encre, fluo
  const color = [pal.ground, pal.mid, pal.ink, pal.accent];
  const trame = Math.max(0.6, full * 0.14) * scale;

  for (let li = 0; li < opts.lines; li++) {
    const cy = (li + 0.5) * gap;

    const levels: Level[] = [];
    for (let s = 0; s < along; s += step) {
      const c = cell(s, cy);
      let lv: Level = c.dark < t1 ? 0 : c.dark < t2 ? 1 : 2;
      if (opts.accent && c.vivid > 0.32 && c.dark > t1 * 0.6) lv = 3;
      levels.push(lv);
    }

    // Trame fine sous les tirets, comme le fond tramé de ses toiles
    ctx.fillStyle = pal.mid;
    ctx.globalAlpha = 0.35;
    if (opts.vertical) ctx.fillRect(cy * scale - trame / 2, 0, trame, out.height);
    else ctx.fillRect(0, cy * scale - trame / 2, out.width, trame);
    ctx.globalAlpha = 1;

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
        ctx.fillStyle = color[lv];
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
