/**
 * PDF à jour, générés dans le navigateur depuis le contenu du site :
 *   - catalogue : une œuvre par page, mise en page choisie par Adrien
 *     (en-tête artiste / catalogue, légende sur une ligne : titre italique · technique · format · année · prix) ;
 *   - portfolio : le PDF d'Adrien à l'identique (public/portfolio), avec ses couleurs et ses pages ajoutées dans l'admin.
 * Polices libres (OFL) servies par le site : Cormorant Garamond italique, Outfit.
 */
import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { SiteData, Artwork, PortfolioPage } from '../data/defaultData';
import { formatPrice, isPublished } from '../data/defaultData';

const A4: [number, number] = [595.28, 841.89];
const M = 50;
const BG = rgb(0.988, 0.984, 0.976);
const GREY = rgb(0.48, 0.45, 0.43);
const LIGHT = rgb(0.9, 0.89, 0.87);
const SEP = rgb(0.7, 0.68, 0.66);
const INK = rgb(0.1, 0.1, 0.1);
const MID = rgb(0.36, 0.34, 0.33);
const DOT = rgb(0.9, 0.26, 0.21);

interface Fonts { serif: PDFFont; sans: PDFFont; light: PDFFont }

async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  doc.registerFontkit(fontkit);
  const get = (f: string) => fetch(`/fonts/${f}`).then(r => r.arrayBuffer());
  const [serif, sans, light] = await Promise.all([
    get('cormorant-garamond-600-italic.ttf'), get('outfit-400.ttf'), get('outfit-300.ttf'),
  ]);
  return {
    serif: await doc.embedFont(serif, { subset: true }),
    sans: await doc.embedFont(sans, { subset: true }),
    light: await doc.embedFont(light, { subset: true }),
  };
}

/** Image du site (WebP, PNG, JPEG) → JPEG haute qualité, 2000 px au plus, pour pdf-lib. */
async function embedImage(doc: PDFDocument, src: string): Promise<PDFImage | null> {
  try {
    const blob = await (await fetch(src)).blob();
    const bitmap = await createImageBitmap(blob);
    const ratio = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const jpeg = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.88));
    return jpeg ? doc.embedJpg(await jpeg.arrayBuffer()) : null;
  } catch {
    return null; // image introuvable : la page sort sans elle plutôt que d'échouer
  }
}

/** Capitales espacées (letter-spacing) ; `align` right = x est le bord droit. */
function spaced(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color = GREY, track = 1.6, align: 'left' | 'right' | 'center' = 'left') {
  const width = [...text].reduce((w, c) => w + font.widthOfTextAtSize(c, size), 0) + track * (text.length - 1);
  let cx = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x;
  for (const c of text) {
    page.drawText(c, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(c, size) + track;
  }
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) { lines.push(line); line = word; }
      else line = next;
    }
    lines.push(line);
  }
  return lines;
}

function newPage(doc: PDFDocument) {
  const page = doc.addPage(A4);
  page.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: BG });
  return page;
}

function frame(page: PDFPage, f: Fonts, right: string, footer: string, n: number) {
  const [W, H] = A4;
  spaced(page, 'ADRIEN DA SILVA', M, H - 60, f.sans, 7.5);
  spaced(page, right, W - M, H - 60, f.sans, 7.5, GREY, 1.6, 'right');
  page.drawLine({ start: { x: M, y: H - 72 }, end: { x: W - M, y: H - 72 }, thickness: 0.6, color: LIGHT });
  if (footer) spaced(page, footer, M, 42, f.sans, 7, GREY, 1.4);
  spaced(page, String(n).padStart(2, '0'), W - M, 42, f.sans, 7, GREY, 1.4, 'right');
}

function drawFitted(page: PDFPage, img: PDFImage, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  page.drawImage(img, { x: x + (w - dw) / 2, y: y + (h - dh) / 2, width: dw, height: dh });
}

function cover(doc: PDFDocument, f: Fonts, kind: string, year: number, img: PDFImage | null) {
  const [W, H] = A4;
  const page = newPage(doc);
  if (img) drawFitted(page, img, M + 30, 250, W - 2 * (M + 30), H - 250 - 120);
  spaced(page, 'ADRIEN DA SILVA', W / 2, 170, f.sans, 13, INK, 4, 'center');
  spaced(page, `${kind} ${year}`, W / 2, 140, f.sans, 8.5, GREY, 2.4, 'center');
}

const isStore = (a: Artwork) => a.category !== 'fresque' && isPublished(a);

export async function buildCataloguePdf(data: SiteData): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Adrien Da Silva — Catalogue d'œuvres`);
  doc.setAuthor('Adrien Da Silva');
  const f = await loadFonts(doc);
  const year = new Date().getFullYear();
  const works = data.artworks.filter(isStore);
  const [W, H] = A4;

  const featured = works.find(a => a.isFeatured && a.images?.[0]) ?? works.find(a => a.images?.[0]);
  const coverSrc = data.pdfCovers?.catalogue || featured?.images[0];
  cover(doc, f, "CATALOGUE D'ŒUVRES", year, coverSrc ? await embedImage(doc, coverSrc) : null);

  for (const [i, a] of works.entries()) {
    const page = newPage(doc);
    frame(page, f, "CATALOGUE D'ŒUVRES", '', i + 1);
    const img = a.images?.[0] ? await embedImage(doc, a.images[0]) : null;
    if (img) drawFitted(page, img, M + 20, 150, W - 2 * (M + 20), H - 110 - 150);

    // Légende sur une ligne, centrée
    const parts: { t: string; font: PDFFont; size: number; color: typeof INK }[] = [{ t: a.title.trim(), font: f.serif, size: 15, color: INK }];
    const price = a.status === 'sold' ? 'Vendue' : a.price ? formatPrice(a.price) : '';
    for (const [t, color] of [[a.technique, MID], [a.dimensions, MID], [a.year ? String(a.year) : '', MID], [price, INK]] as const) {
      if (!t) continue;
      parts.push({ t: '   ·   ', font: f.light, size: 8.5, color: SEP }, { t, font: f.sans, size: 8.5, color });
    }
    const dotW = a.status === 'sold' ? 12 : 0;
    const total = parts.reduce((w, p) => w + p.font.widthOfTextAtSize(p.t, p.size), 0) + dotW;
    let x = (W - Math.min(total, W - 2 * M)) / 2;
    const y = 112;
    for (const p of parts) {
      page.drawText(p.t, { x, y, size: p.size, font: p.font, color: p.color });
      x += p.font.widthOfTextAtSize(p.t, p.size);
    }
    if (a.status === 'sold') page.drawCircle({ x: x + 8, y: y + 3, size: 3.2, color: DOT });
    if (a.signature) spaced(page, a.signature.toUpperCase(), W / 2, y - 17, f.sans, 6.5, GREY, 1.2, 'center');
  }
  return new Blob([(await doc.save()).slice()], { type: 'application/pdf' });
}

// ─── Portfolio : le PDF d'Adrien tel quel, ses couleurs et ses pages ajoutées ───

const PORTFOLIO_SRC = '/portfolio/original.pdf';
const AP = [40, 28, 66];     // violet de ses aplats (pages 2 et 4)
const KRAFT = [205, 172, 127]; // kraft de la couverture et du dos (pages 1 et 20)
const SHEET: [number, number] = [1190.55, 841.89];

const hexRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const lum = (c: number[]) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

/** Remplace le violet dans un rectangle ; le texte clair garde ses nuances, et passe au sombre sur une couleur claire. */
function recolorAplat(px: Uint8ClampedArray, width: number, x1: number, y1: number, hex: string) {
  const to = hexRgb(hex);
  const text = lum(to) > 150 ? [20, 18, 26] : [245, 243, 240];
  const base = lum(AP);
  for (let y = 0; y < y1; y++) {
    for (let x = 0; x < x1; x++) {
      const i = (y * width + x) * 4;
      const t = Math.min(1, Math.max(0, (lum([px[i], px[i + 1], px[i + 2]]) - base) / (205 - base)));
      for (let c = 0; c < 3; c++) px[i + c] = to[c] + (text[c] - to[c]) * t;
    }
  }
}

/** Teinte le kraft sans perdre son grain ; le reste (blanc, image, QR, texte) ne bouge pas. */
function recolorKraft(px: Uint8ClampedArray, hex: string) {
  const to = hexRgb(hex);
  const sum = KRAFT[0] + KRAFT[1] + KRAFT[2];
  for (let i = 0; i < px.length; i += 4) {
    const l = px[i] + px[i + 1] + px[i + 2];
    if (l < sum * 0.5) continue;
    const d = Math.abs(px[i] / l - KRAFT[0] / sum) + Math.abs(px[i + 2] / l - KRAFT[2] / sum);
    const w = Math.min(1, Math.max(0, (0.09 - d) / 0.04));
    if (!w) continue;
    for (let c = 0; c < 3; c++) px[i + c] += (to[c] * (l / sum) - px[i + c]) * w;
  }
}

async function bitmapOf(src: string): Promise<ImageBitmap> {
  return createImageBitmap(await (await fetch(src)).blob());
}

/** Dessine une image recadrée sans déformation, centrée dans le rectangle. */
function drawCover(ctx: CanvasRenderingContext2D, b: ImageBitmap, x: number, y: number, w: number, h: number) {
  let sw = b.width, sh = b.height;
  if (sw / sh > w / h) sw = sh * (w / h); else sh = sw / (w / h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b, (b.width - sw) / 2, (b.height - sh) / 2, sw, sh, x, y, w, h);
}

async function canvasJpeg(doc: PDFDocument, canvas: HTMLCanvasElement): Promise<PDFImage> {
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Image impossible à préparer');
  return doc.embedJpg(await blob.arrayBuffer());
}

/** Une de ses pages, repeinte. Seules les pages 1, 2, 4 et 20 ont des aplats. */
async function repaint(doc: PDFDocument, n: number, size: [number, number], data: SiteData) {
  const { aplat, kraft } = data.portfolioPdf ?? {};
  const b = await bitmapOf(`/portfolio/p${String(n).padStart(2, '0')}.jpg`);
  const canvas = document.createElement('canvas');
  canvas.width = b.width; canvas.height = b.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(b, 0, 0);
  const shot = ctx.getImageData(0, 0, b.width, b.height);
  if (kraft && (n === 1 || n === 20)) recolorKraft(shot.data, kraft);
  if (aplat && n === 2) recolorAplat(shot.data, b.width, Math.round(b.width * 0.4996), b.height, aplat);
  if (aplat && n === 4) recolorAplat(shot.data, b.width, b.width, Math.round(b.height * 0.6864), aplat);
  ctx.putImageData(shot, 0, 0);
  if (n === 1 && data.pdfCovers?.portfolio) {
    const w = b.width, h = b.height;
    drawCover(ctx, await bitmapOf(data.pdfCovers.portfolio), w * 0.2846, h * 0.4985, w * 0.2054, h * 0.2499);
  }
  const page = doc.addPage(size);
  page.drawImage(await canvasJpeg(doc, canvas), { x: 0, y: 0, width: size[0], height: size[1] });
}

/** Image dans un rectangle de page (origine en bas à gauche, comme le PDF). */
async function placeImage(doc: PDFDocument, page: PDFPage, src: string | undefined, x: number, y: number, w: number, h: number) {
  if (!src) return;
  const canvas = document.createElement('canvas');
  const scale = Math.min(2400 / w, 2400 / h);
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  drawCover(canvas.getContext('2d')!, await bitmapOf(src), 0, 0, canvas.width, canvas.height);
  page.drawImage(await canvasJpeg(doc, canvas), { x, y, width: w, height: h });
}

/** Page ajoutée dans l'admin, sur le modèle des siennes : fond blanc, petite légende. */
async function addedPage(doc: PDFDocument, f: Fonts, p: PortfolioPage) {
  const [W, H] = SHEET;
  const page = doc.addPage(SHEET);
  const size = 9.5, lead = 13;
  const legend = (x: number, y: number, width: number) => {
    const lines = [p.title.trim(), ...wrap(p.text.trim(), f.light, size, width)].filter(Boolean);
    lines.forEach((line, i) => page.drawText(line, { x, y: y + (lines.length - 1 - i) * lead, size, font: f.light, color: INK }));
  };
  if (p.layout === 'pleine') {
    await placeImage(doc, page, p.images[0], 0, 110, W, H - 110);
    legend(56, 30, W * 0.5);
  } else if (p.layout === 'moitie') {
    await placeImage(doc, page, p.images[0], 0, 0, W / 2, H);
    legend(W / 2 + 56, 56, W / 2 - 112);
  } else {
    await placeImage(doc, page, p.images[0], 0, 0, W * 0.66, H);
    await placeImage(doc, page, p.images[1], W * 0.7, H * 0.36, W * 0.26, H * 0.5);
    legend(W * 0.7, H * 0.2, W * 0.26);
  }
}

export async function buildPortfolioPdf(data: SiteData): Promise<Blob> {
  const source = await PDFDocument.load(await (await fetch(PORTFOLIO_SRC)).arrayBuffer());
  const doc = await PDFDocument.create();
  doc.setTitle('Adrien Da Silva — Portfolio');
  doc.setAuthor('Adrien Da Silva');
  const added = data.portfolioPdf?.pages ?? [];
  const f = added.length ? await loadFonts(doc) : null;
  const { aplat, kraft } = data.portfolioPdf ?? {};
  const painted = new Set<number>([
    ...(aplat ? [2, 4] : []), ...(kraft ? [1, 20] : []), ...(data.pdfCovers?.portfolio ? [1] : []),
  ]);

  const copies = await doc.copyPages(source, source.getPageIndices());
  for (let n = 1; n <= copies.length; n++) {
    const { width, height } = copies[n - 1].getSize();
    if (painted.has(n)) await repaint(doc, n, [width, height], data);
    else doc.addPage(copies[n - 1]);
    for (const p of added.filter(a => a.after === n)) await addedPage(doc, f!, p);
  }

  return new Blob([(await doc.save()).slice()], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
