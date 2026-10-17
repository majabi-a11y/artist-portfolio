/**
 * La toile que ce visiteur regarde le plus, et ses couleurs (pour le menu).
 * Tout reste dans le navigateur du visiteur (localStorage) : rien n'est envoyé.
 */
import type { Artwork } from '../data/defaultData';
import { thumb } from '../data/defaultData';

const VIEWS = 'ads-vues';
const PALETTES = 'ads-palettes-v2';

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* navigation privée : tant pis */ }
}

/** Une visite de la fiche ; chaque tranche de 15 s passée dessus compte en plus. */
export function recordView(id: string, weight = 1) {
  const views = read<Record<string, number>>(VIEWS, {});
  views[id] = (views[id] ?? 0) + weight;
  write(VIEWS, views);
  window.dispatchEvent(new Event('ads-taste'));
}

export function favouriteArtwork(artworks: Artwork[]): Artwork | null {
  const views = read<Record<string, number>>(VIEWS, {});
  let best: Artwork | null = null;
  let max = 0;
  for (const a of artworks) {
    const n = views[a.id] ?? 0;
    if (n > max && a.images?.[0] && !a.draft) { max = n; best = a; }
  }
  return best;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

/**
 * 4 couleurs dominantes d'une œuvre, lisibles sur le fond sombre du menu.
 * Le papier, les murs et les cadres (couleurs ternes) sont écartés ; les encres trop sombres
 * sont éclaircies en gardant leur teinte (un violet nuit reste violet).
 */
export async function artworkPalette(src: string): Promise<string[]> {
  const cache = read<Record<string, string[]>>(PALETTES, {});
  if (cache[src]) return cache[src];

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = thumb(src);
  await img.decode();
  const size = 56;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  // Centre de l'image seulement : écarte le cadre et le mur des photos d'atelier
  const mx = img.naturalWidth * 0.18, my = img.naturalHeight * 0.18;
  ctx.drawImage(img, mx, my, img.naturalWidth - 2 * mx, img.naturalHeight - 2 * my, 0, 0, size, size);
  const px = ctx.getImageData(0, 0, size, size).data;

  // Teinte (12 parts) × clarté (3 niveaux), pondérée par la saturation
  const buckets = new Map<string, { w: number; h: number; s: number; l: number }>();
  for (let i = 0; i < px.length; i += 4) {
    const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
    if (s < 0.18 || l > 0.9 || l < 0.06) continue;
    const key = `${Math.round(h / 30) % 12}-${l < 0.35 ? 0 : l < 0.65 ? 1 : 2}`;
    const b = buckets.get(key) ?? { w: 0, h: 0, s: 0, l: 0 };
    const w = 0.4 + s;
    b.w += w; b.h += h * w; b.s += s * w; b.l += l * w;
    buckets.set(key, b);
  }
  const colours = [...buckets.values()]
    .sort((a, b) => b.w - a.w)
    .slice(0, 4)
    .map(b => hsl(b.h / b.w, Math.min(0.85, b.s / b.w + 0.1), Math.min(0.72, Math.max(0.45, b.l / b.w))));

  if (colours.length) { cache[src] = colours; write(PALETTES, cache); }
  return colours;
}
