/**
 * PDF à jour, générés dans le navigateur depuis le contenu du site :
 *   - catalogue : une œuvre par page, mise en page choisie par Adrien
 *     (en-tête artiste / catalogue, légende sur une ligne : titre italique · technique · format · année · prix) ;
 *   - portfolio : son portfolio 2026 refait en pages modifiables dans l'admin (data/portfolioPages.ts).
 * Polices libres (OFL) servies par le site : Cormorant Garamond italique, Outfit.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { SiteData, Artwork } from '../data/defaultData';
import { formatPrice, isPublished } from '../data/defaultData';
import { APLAT, DEFAULT_SHEETS } from '../data/portfolioPages';

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

// ─── Portfolio : les pages de l'admin (DEFAULT_SHEETS tant qu'Adrien n'a rien changé) ───

const SHEET: [number, number] = [1190.55, 841.89];
const LEAD = 1.3;

const toRgb = (hex: string) => rgb(...([1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]));
const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.3 * r + 0.59 * g + 0.11 * b > 150;
};

/** Sans perte quand l'image a déjà le format du bloc ; sinon recadrée au centre, sans déformation. */
async function embedBlock(doc: PDFDocument, src: string, ratio: number): Promise<PDFImage> {
  const blob = await (await fetch(src)).blob();
  const b = await createImageBitmap(blob);
  if (blob.type === 'image/jpeg' && Math.abs(b.width / b.height / ratio - 1) < 0.015) return doc.embedJpg(await blob.arrayBuffer());
  let sw = b.width, sh = b.height;
  if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw); canvas.height = Math.round(sh);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b, (b.width - sw) / 2, (b.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
  const jpeg = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92));
  if (!jpeg) throw new Error('Image impossible à préparer');
  return doc.embedJpg(await jpeg.arrayBuffer());
}

export async function buildPortfolioPdf(data: SiteData): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.setTitle('Adrien Da Silva — Portfolio');
  doc.setAuthor('Adrien Da Silva');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const [W, H] = SHEET;
  const aplat = data.portfolioPdf?.aplat ?? APLAT;
  // Helvetica ne connaît pas tous les signes (émojis…) : on écarte ceux qu'elle ne peut pas écrire
  const safe = (t: string) => [...t].filter(c => {
    try { font.encodeText(c); return true; } catch { return false; }
  }).join('');

  for (const sheet of (data.portfolioPdf?.sheets ?? DEFAULT_SHEETS).filter(s => !s.hidden)) {
    const page = doc.addPage(SHEET);
    const bg = sheet.bg === 'aplat' ? aplat : sheet.bg ?? '#ffffff';
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: toRgb(bg) });
    for (const b of sheet.blocks) {
      const x = (b.x / 100) * W, w = (b.w / 100) * W, top = H - (b.y / 100) * H;
      if (b.kind === 'image') {
        if (!b.src) continue;
        const h = (b.h / 100) * H;
        page.drawImage(await embedBlock(doc, b.src, w / h), { x, y: top - h, width: w, height: h });
        continue;
      }
      const size = b.size ?? 10.5;
      const color = toRgb(b.color ?? (isLight(bg) ? '#1a1a1a' : '#f5f3f0'));
      const lines = (b.text ?? '').split('\n').map(safe).flatMap(l => (l.trim() ? wrap(l, font, size, w) : ['']));
      lines.forEach((line, i) => {
        const width = font.widthOfTextAtSize(line, size);
        const dx = b.align === 'center' ? (w - width) / 2 : b.align === 'right' ? w - width : 0;
        page.drawText(line, { x: x + dx, y: top - size - i * size * (b.lead ?? LEAD), size, font, color });
      });
    }
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
