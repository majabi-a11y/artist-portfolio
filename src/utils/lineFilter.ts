/**
 * Filtre « Lignes » — d'après les toiles d'Adrien Da Silva.
 *
 * Ce que font ses toiles, et donc ce filtre :
 *   - le sujet est dessiné par des tirets épais à bouts ronds, sur une trame de lignes régulières ;
 *   - les zones claires restent vides : le fond respire ;
 *   - deux tons d'une même encre (foncé, moyen) sur un fond clair, parfois une touche fluo ;
 *   - les lignes sont horizontales (« Lignes de vies ») ou verticales (« Hors ligne »).
 * Les palettes sont mesurées sur ses œuvres du catalogue 2026.
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
  /** Nombre de lignes sur la hauteur (ou la largeur en vertical) */
  lines: number;
  /** Épaisseur des tirets, en part de l'écart entre lignes (0.3 – 1) */
  weight: number;
  /** Seuil de lumière : plus haut, plus de surfaces vides */
  threshold: number;
  /** Longueur moyenne d'un tiret, en épaisseurs (coupe les longues lignes) */
  dash: number;
  /** Fine trame dans les zones claires */
  trame: boolean;
  /** Touches fluo sur les couleurs vives de la photo */
  accent: boolean;
  vertical: boolean;
}

export const DEFAULT_LINE_OPTIONS: LineOptions = {
  palette: 'outremer',
  lines: 90,
  weight: 0.78,
  threshold: 0.42,
  dash: 9,
  trame: true,
  accent: true,
  vertical: false,
};

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

/**
 * Prépare la photo : luminance étirée (niveaux auto, 2 % – 98 %) et saturation par pixel.
 */
function analyse(img: ImageData) {
  const { width: w, height: h, data } = img;
  const lum = new Float32Array(w * h);
  const vivid = new Float32Array(w * h);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; p < w * h; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[p] = l;
    hist[Math.min(255, Math.round(l))]++;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    // Couleurs vives : saturées et ni trop sombres ni trop claires
    vivid[p] = max > 90 && max - min > 110 ? (max - min) / 255 : 0;
  }
  const total = w * h;
  let acc = 0, lo = 0, hi = 255;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.02) { hi = v; break; } }
  const span = Math.max(1, hi - lo);
  for (let p = 0; p < total; p++) lum[p] = Math.min(1, Math.max(0, (lum[p] - lo) / span));
  return { w, h, lum, vivid };
}

/** Moyenne d'une case (sombreur 0–1, vivacité 0–1) — lit l'image dans le sens des lignes. */
function cell(a: ReturnType<typeof analyse>, along: number, across: number, len: number, band: number, vertical: boolean) {
  let d = 0, v = 0, n = 0;
  for (let j = Math.floor(across - band / 2); j < across + band / 2; j++) {
    for (let i = Math.floor(along); i < along + len; i++) {
      const x = vertical ? j : i, y = vertical ? i : j;
      if (x < 0 || y < 0 || x >= a.w || y >= a.h) continue;
      const p = y * a.w + x;
      d += 1 - a.lum[p]; v += a.vivid[p]; n++;
    }
  }
  return n ? { dark: d / n, vivid: v / n } : { dark: 0, vivid: 0 };
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

  const across = opts.vertical ? a.w : a.h;   // dimension coupée par les lignes
  const along = opts.vertical ? a.h : a.w;    // dimension parcourue par une ligne
  const gap = across / opts.lines;             // écart entre deux lignes (pixels source)
  const full = gap * opts.weight;              // épaisseur d'un tiret plein
  const step = Math.max(1, full / 2);          // pas d'échantillonnage le long d'une ligne
  const rand = seeded(opts.lines * 31 + Math.round(opts.weight * 100));

  const t1 = opts.threshold;                   // en dessous : vide (ou trame)
  const t2 = t1 + (1 - t1) * 0.42;             // au-dessus : encre pleine

  type Level = 0 | 1 | 2 | 3;                  // vide, ton moyen, encre, fluo
  const color = [pal.ground, pal.mid, pal.ink, pal.accent];

  for (let li = 0; li < opts.lines; li++) {
    const cy = (li + 0.5) * gap;

    // Classement de chaque case de la ligne
    const levels: Level[] = [];
    for (let s = 0; s < along; s += step) {
      const c = cell(a, s, cy, step, gap, opts.vertical);
      let lv: Level = c.dark < t1 ? 0 : c.dark < t2 ? 1 : 2;
      if (opts.accent && c.vivid > 0.32 && c.dark > t1 * 0.6) lv = 3;
      levels.push(lv);
    }

    // Trame : fine ligne continue sous les tirets, comme le fond tramé de ses toiles
    if (opts.trame) {
      ctx.fillStyle = pal.mid;
      ctx.globalAlpha = 0.35;
      const tt = Math.max(0.6, full * 0.14) * scale;
      if (opts.vertical) ctx.fillRect(cy * scale - tt / 2, 0, tt, out.height);
      else ctx.fillRect(0, cy * scale - tt / 2, out.width, tt);
      ctx.globalAlpha = 1;
    }

    // Suites de même niveau → tirets, coupés à longueur variable
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
        while (x < end) {
          const len = full * opts.dash * (0.55 + rand() * 0.9);
          const x1 = Math.min(end, x + len);
          // Un petit bout isolé devient un point rond
          ctx.fillStyle = color[lv];
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
