/**
 * Halftone Lines Filter — Adrien Da Silva Style
 * 
 * Transforms a photo into horizontal lines with two thicknesses:
 *   - "Trame" (thin) for bright areas — single uniform color
 *   - "Pleine" (thick) for darker areas — colored from image or palette
 * 
 * Supports multiple color palettes and adjustable parameters.
 */

// ─── Color palette system ────────────────────────────────────────────────────

export type ColorPalette = 'realColors' | 'roseFluo' | 'grisFluo' | 'sunset' | 'speciale';

export interface PaletteConfig {
  label: string;
  trameColor: string;
  background: string;
  /** Map image darkness+hue to a line color. Null = use real quantized color */
  mapColor: ((r: number, g: number, b: number, darkness: number) => string) | null;
  /** Override default darkness threshold (0.18). Higher = more trame, less pleine */
  darknessThreshold?: number;
}

const PALETTE_CONFIGS: Record<ColorPalette, PaletteConfig> = {
  realColors: {
    label: 'Couleurs réelles',
    trameColor: 'auto', // computed from image complementary
    background: 'auto',
    mapColor: null, // use quantized image colors
  },
  roseFluo: {
    label: 'Rose Fluo / Ciel',
    trameColor: '#ff00ff',
    background: '#fdf0f8',
    mapColor: (r, g, b, darkness) => {
      const [h, s] = rgbToHsl(r, g, b);
      if (s < 0.15) return darkness > 0.6 ? '#2d0a3e' : '#6a4c7a';
      if (darkness > 0.7) return '#1a0033';
      // Remap to turquoise/violet/coral
      if (h >= 150 && h < 270) return darkness > 0.45 ? '#6a1b9a' : '#00bcd4'; // violet / turquoise
      return darkness > 0.45 ? '#e91e63' : '#ff6090'; // coral
    },
  },
  grisFluo: {
    label: 'Noir & Blanc',
    trameColor: '#ff00ff',
    background: '#f0ece4', // blanc cassé chaud
    darknessThreshold: 0.15,
    mapColor: (_r, _g, _b, darkness) => {
      // Rich grayscale with more steps
      if (darkness > 0.80) return '#000000';
      if (darkness > 0.65) return '#1a1a1a';
      if (darkness > 0.50) return '#3a3a3a';
      if (darkness > 0.40) return '#5a5a5a';
      if (darkness > 0.30) return '#7a7a7a';
      if (darkness > 0.22) return '#999999';
      return '#b8b8b8';
    },
  },
  sunset: {
    label: 'Coucher de soleil',
    trameColor: '#5b8abf',
    background: '#f0eee8',
    mapColor: (r, g, b, darkness) => {
      const [h, s] = rgbToHsl(r, g, b);
      if (s < 0.15) return darkness > 0.5 ? '#3d2b1f' : '#8b7355';
      if (darkness > 0.7) return '#3d1308';
      if (darkness > 0.5) return '#8b4513'; // brun
      // Remap to sunset tones
      if (h >= 0 && h < 60) return '#e87040'; // orange
      if (h >= 300 || h >= 0 && h < 30) return '#e06050'; // corail
      return '#cc7040'; // orange chaud
    },
  },
  speciale: {
    label: 'Spéciale',
    trameColor: '#e8706a', // corail pour la trame
    background: '#f5e0d8', // beige rosé
    darknessThreshold: 0.45, // élevé → plus de trame visible
    mapColor: (r, g, b, darkness) => {
      const [, s] = rgbToHsl(r, g, b);
      // Zones très sombres → bleu outre-mer profond
      if (darkness > 0.70) return '#1a237e';
      // Zones sombres → bleu outre-mer
      if (darkness > 0.58) return '#283593';
      // Zones moyennes-sombres saturées → rose fluo
      if (darkness > 0.50 && s > 0.30) return '#ff1493';
      // Zones moyennes → corail foncé
      if (darkness > 0.48) return '#c0504a';
      // Juste au-dessus du seuil → corail moyen
      return '#d4655f';
    },
  },
};

// ─── Filter options ──────────────────────────────────────────────────────────

export interface FilterOptions {
  lineSpacing: number;
  maxThickness: number;
  segmentWidth: number;
  colorMode: string;
  backgroundColor: string;
  intensity: number;
  palette: ColorPalette;
  trameRatio: number;
  mergeTolerance: number;
  /** Number of color buckets for hue quantization (2-24, default 12) */
  colorCount: number;
}

export const DEFAULT_OPTIONS: FilterOptions = {
  lineSpacing: 8,
  maxThickness: 7,
  segmentWidth: 5,
  colorMode: 'classic',
  backgroundColor: '#f5e6e0',
  intensity: 0.80,
  palette: 'realColors',
  trameRatio: 0.25,
  mergeTolerance: 45,
  colorCount: 12,
};

// ─── Drawing utilities ───────────────────────────────────────────────────────

function drawCapsule(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number
): void {
  if (w <= 0 || h <= 0) return;
  const r = h / 2;
  if (w <= h) {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + r, w / 2, r, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, Math.PI * 0.5, Math.PI * 1.5);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.fill();
}

// ─── Color utilities ─────────────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

// ─── Sampling utilities ──────────────────────────────────────────────────────

function sampleLuminance(
  px: Uint8ClampedArray, imgW: number, imgH: number,
  startX: number, startY: number, blockW: number, blockH: number
): number {
  let sum = 0, n = 0;
  const endX = Math.min(startX + blockW, imgW);
  const endY = Math.min(startY + blockH, imgH);
  for (let sy = startY; sy < endY; sy += 2) {
    for (let sx = startX; sx < endX; sx += 2) {
      const i = (sy * imgW + sx) * 4;
      sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      n++;
    }
  }
  return n > 0 ? sum / n : 255;
}

function sampleRGB(
  px: Uint8ClampedArray, imgW: number, imgH: number,
  startX: number, startY: number, blockW: number, blockH: number
): { r: number; g: number; b: number } {
  let rSum = 0, gSum = 0, bSum = 0, n = 0;
  const endX = Math.min(startX + blockW, imgW);
  const endY = Math.min(startY + blockH, imgH);
  for (let sy = startY; sy < endY; sy += 2) {
    for (let sx = startX; sx < endX; sx += 2) {
      const i = (sy * imgW + sx) * 4;
      rSum += px[i]; gSum += px[i + 1]; bSum += px[i + 2];
      n++;
    }
  }
  return n > 0 ? { r: rSum / n, g: gSum / n, b: bSum / n } : { r: 255, g: 255, b: 255 };
}

// ─── Quantization & similarity ───────────────────────────────────────────────

function quantizeColor(r: number, g: number, b: number, hueBuckets: number): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (s < 0.18) {
    if (l < 0.40) return rgbToHex(50, 50, 50);
    return rgbToHex(150, 150, 150);
  }
  const bucketSize = 360 / hueBuckets;
  const hBucket = Math.round(h / bucketSize) * bucketSize % 360;
  const qL = l < 0.40 ? 0.28 : 0.50;
  const qS = Math.min(0.80, s * 1.1);
  const [qr, qg, qb] = hslToRgb(hBucket, qS, qL);
  return rgbToHex(qr, qg, qb);
}

function colorsAreSimilar(hex1: string, hex2: string, toleranceDeg: number): boolean {
  if (hex1 === hex2) return true;
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ] as [number, number, number];
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const [h1, s1, l1] = rgbToHsl(r1, g1, b1);
  const [h2, s2, l2] = rgbToHsl(r2, g2, b2);
  if (s1 < 0.18 && s2 < 0.18) return Math.abs(l1 - l2) < 0.30;
  if (s1 < 0.18 || s2 < 0.18) return false;
  let hueDiff = Math.abs(h1 - h2);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  return hueDiff <= toleranceDeg && Math.abs(l1 - l2) < 0.25;
}

// ─── Dominant color analysis ─────────────────────────────────────────────────

function findComplementary(px: Uint8ClampedArray, w: number, h: number) {
  const hueCounts = new Array(12).fill(0);
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * 4;
      const [hue, sat] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
      if (sat > 0.12) hueCounts[Math.floor(hue / 30) % 12]++;
    }
  }
  let maxC = 0, domBucket = 0;
  for (let i = 0; i < 12; i++) { if (hueCounts[i] > maxC) { maxC = hueCounts[i]; domBucket = i; } }
  const compHue = (domBucket * 30 + 180) % 360;
  const [cr, cg, cb] = hslToRgb(compHue, 0.45, 0.55);
  const [bgr, bgg, bgb] = hslToRgb(compHue, 0.15, 0.94);
  return { trameColor: rgbToHex(cr, cg, cb), bgColor: rgbToHex(bgr, bgg, bgb) };
}

// ─── Main filter ─────────────────────────────────────────────────────────────

type LineClass = { color: string; thick: boolean };

export function applyDaSilvaFilter(
  imageData: ImageData,
  outputCanvas: HTMLCanvasElement,
  options: FilterOptions = DEFAULT_OPTIONS
): void {
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) return;

  const w = imageData.width;
  const h = imageData.height;
  const px = imageData.data;
  if (w === 0 || h === 0) return;

  outputCanvas.width = w;
  outputCanvas.height = h;

  const { lineSpacing, maxThickness, segmentWidth, palette, trameRatio, mergeTolerance, colorCount } = options;
  const paletteConfig = PALETTE_CONFIGS[palette];

  // Resolve trame color and background
  let trameColor: string;
  let bgColor: string;
  if (paletteConfig.trameColor === 'auto' || paletteConfig.background === 'auto') {
    const comp = findComplementary(px, w, h);
    trameColor = paletteConfig.trameColor === 'auto' ? comp.trameColor : paletteConfig.trameColor;
    bgColor = paletteConfig.background === 'auto' ? comp.bgColor : paletteConfig.background;
  } else {
    trameColor = paletteConfig.trameColor;
    bgColor = paletteConfig.background;
  }

  // Two fixed thicknesses
  const trameThickness = Math.max(1, maxThickness * trameRatio);
  const pleineThickness = maxThickness;

  // Darkness threshold — palette can override
  const darknessThreshold = paletteConfig.darknessThreshold ?? 0.18;
  
  // Sampling step
  const sampleStep = Math.max(4, segmentWidth * 2);

  // Fill background
  outCtx.fillStyle = bgColor;
  outCtx.fillRect(0, 0, w, h);

  let totalSegments = 0;
  let rowIdx = 0;

  for (let rowY = 0; rowY < h; rowY += lineSpacing) {
    const rowCenterY = rowY + lineSpacing / 2;

    // Classify each sample column
    const samples: LineClass[] = [];
    const sampleCount = Math.ceil(w / sampleStep);

    for (let i = 0; i < sampleCount; i++) {
      const sx = i * sampleStep;
      const sw = Math.min(sampleStep, w - sx);
      if (sw <= 0) continue;

      const lum = sampleLuminance(px, w, h, sx, rowY, sw, lineSpacing);
      const darkness = 1 - lum / 255;
      const thick = darkness > darknessThreshold;

      let color: string;
      if (!thick) {
        color = trameColor;
      } else if (paletteConfig.mapColor) {
        const { r, g, b } = sampleRGB(px, w, h, sx, rowY, sw, lineSpacing);
        // Quantize darkness to reduce distinct values (based on colorCount)
        const dSteps = Math.max(2, Math.round(colorCount / 2));
        const qDarkness = Math.round(darkness * dSteps) / dSteps;
        color = paletteConfig.mapColor(r, g, b, qDarkness);
      } else {
        const { r, g, b } = sampleRGB(px, w, h, sx, rowY, sw, lineSpacing);
        color = quantizeColor(r, g, b, colorCount);
      }

      samples.push({ color, thick });
    }

    // Merge runs with similar color + same thickness, averaging colors
    let runStart = -1;
    let runColor = '';
    let runThick = false;
    let runR = 0, runG = 0, runB = 0, runCount = 0;

    const parseHex = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];

    const flushRun = (endIdx: number) => {
      if (runStart < 0) return;
      const x0 = runStart * sampleStep;
      const x1 = Math.min(w, endIdx * sampleStep);
      const runWidth = x1 - x0;
      if (runWidth <= 1) return;

      const thickness = runThick ? pleineThickness : trameThickness;
      const segY = rowCenterY - thickness / 2;

      // Use average color of all merged samples
      const avgColor = runCount > 1
        ? rgbToHex(Math.round(runR / runCount), Math.round(runG / runCount), Math.round(runB / runCount))
        : runColor;

      outCtx.globalAlpha = 1;
      outCtx.fillStyle = avgColor;
      drawCapsule(outCtx, x0, segY, runWidth, thickness);
      totalSegments++;
      runStart = -1;
      runR = 0; runG = 0; runB = 0; runCount = 0;
    };

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (runStart >= 0 && (s.thick !== runThick || !colorsAreSimilar(s.color, runColor, mergeTolerance))) {
        flushRun(i);
      }
      if (runStart < 0) {
        runStart = i;
        runColor = s.color;
        runThick = s.thick;
        const [sr, sg, sb] = parseHex(s.color);
        runR = sr; runG = sg; runB = sb; runCount = 1;
      } else {
        // Accumulate color for averaging
        const [sr, sg, sb] = parseHex(s.color);
        runR += sr; runG += sg; runB += sb; runCount++;
      }
    }
    flushRun(samples.length);
    rowIdx++;
  }

  console.log(`[Halftone] ${w}x${h}: ${totalSegments} segments, ${Math.floor(h / lineSpacing)} rows, palette=${palette}`);
}

// ─── Utility exports ─────────────────────────────────────────────────────────

export function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve({ img, url });
    img.onerror = reject;
    img.src = url;
  });
}

export function extractImageData(
  img: HTMLImageElement,
  maxWidth: number = 800,
  maxHeight: number = 800
): ImageData {
  let { width, height } = img;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export function downloadFilteredImage(
  canvas: HTMLCanvasElement,
  filename: string = 'halftone-lines'
): void {
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
