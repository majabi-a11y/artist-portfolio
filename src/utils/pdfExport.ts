/**
 * PDF à jour, générés dans le navigateur depuis le contenu du site :
 *   - catalogue : une œuvre par page, mise en page choisie par Adrien
 *     (en-tête artiste / catalogue, légende sur une ligne : titre italique · technique · format · année · prix) ;
 *   - portfolio : bio, parcours, fresques, contact.
 * Polices libres (OFL) servies par le site : Cormorant Garamond italique, Outfit.
 */
import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { SiteData, Artwork } from '../data/defaultData';
import { formatPrice, contactHref } from '../data/defaultData';

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
  spaced(page, footer, M, 42, f.sans, 7, GREY, 1.4);
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

const isStore = (a: Artwork) => a.category !== 'fresque';

export async function buildCataloguePdf(data: SiteData): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Adrien Da Silva — Catalogue d'œuvres`);
  doc.setAuthor('Adrien Da Silva');
  const f = await loadFonts(doc);
  const year = new Date().getFullYear();
  const works = data.artworks.filter(isStore);
  const [W, H] = A4;

  const featured = works.find(a => a.isFeatured && a.images?.[0]) ?? works.find(a => a.images?.[0]);
  cover(doc, f, "CATALOGUE D'ŒUVRES", year, featured ? await embedImage(doc, featured.images[0]) : null);

  for (const [i, a] of works.entries()) {
    const page = newPage(doc);
    frame(page, f, "CATALOGUE D'ŒUVRES", `COLLECTION ${year}`, i + 1);
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

export async function buildPortfolioPdf(data: SiteData): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.setTitle('Adrien Da Silva — Portfolio');
  doc.setAuthor('Adrien Da Silva');
  const f = await loadFonts(doc);
  const year = new Date().getFullYear();
  const [W, H] = A4;
  const fresques = data.artworks.filter(a => a.category === 'fresque');
  const footer = `PORTFOLIO ${year}`;
  let n = 0;

  const hero = data.profile.heroBanner || fresques[0]?.images?.[0];
  cover(doc, f, 'PORTFOLIO', year, hero ? await embedImage(doc, hero) : null);

  // Bio
  {
    const page = newPage(doc); frame(page, f, 'PORTFOLIO', footer, ++n);
    spaced(page, 'BIOGRAPHIE', M, H - 130, f.sans, 9, INK, 2.4);
    page.drawText(data.profile.tagline, { x: M, y: H - 152, size: 13, font: f.serif, color: MID });
    let y = H - 195;
    for (const para of data.profile.bio.filter(Boolean)) {
      for (const line of wrap(para, f.light, 10.5, W - 2 * M)) {
        page.drawText(line, { x: M, y, size: 10.5, font: f.light, color: INK }); y -= 17;
      }
      y -= 10;
    }
  }

  // Parcours (sur une ou plusieurs pages)
  if (data.profile.cvSections?.length) {
    let page = newPage(doc); frame(page, f, 'PORTFOLIO', footer, ++n);
    spaced(page, 'PARCOURS', M, H - 130, f.sans, 9, INK, 2.4);
    let y = H - 170;
    for (const s of data.profile.cvSections) {
      const need = 24 + s.items.length * 15;
      if (y - need < 80) { page = newPage(doc); frame(page, f, 'PORTFOLIO', footer, ++n); y = H - 130; }
      page.drawText(s.title, { x: M, y, size: 15, font: f.serif, color: INK });
      y -= 22;
      for (const item of s.items) {
        for (const line of wrap(item, f.light, 9.5, W - 2 * M - 14)) {
          page.drawText(line, { x: M + 14, y, size: 9.5, font: f.light, color: MID }); y -= 14;
        }
      }
      y -= 14;
    }
  }

  // Une fresque par page : photo, titre, lieu · format · année, texte
  for (const fr of fresques) {
    const page = newPage(doc); frame(page, f, 'FRESQUES', footer, ++n);
    const img = fr.images?.[0] ? await embedImage(doc, fr.images[0]) : null;
    if (img) drawFitted(page, img, M, 330, W - 2 * M, H - 110 - 330);
    page.drawText(fr.title.trim(), { x: M, y: 290, size: 18, font: f.serif, color: INK });
    const meta = [fr.lieu, fr.dimensions, fr.year ? String(fr.year) : ''].filter(Boolean).join('   ·   ');
    if (meta) page.drawText(meta, { x: M, y: 270, size: 8.5, font: f.sans, color: MID });
    let y = 240;
    for (const line of wrap(fr.description || '', f.light, 9.5, W - 2 * M)) {
      if (y < 70) break;
      page.drawText(line, { x: M, y, size: 9.5, font: f.light, color: INK }); y -= 15;
    }
  }

  // Contact
  {
    const page = newPage(doc); frame(page, f, 'CONTACT', footer, ++n);
    spaced(page, 'CONTACT', M, H - 130, f.sans, 9, INK, 2.4);
    let y = H - 175;
    const lines = [...data.profile.contact];
    for (const c of lines) {
      spaced(page, c.label.toUpperCase(), M, y, f.sans, 7, GREY, 1.4);
      page.drawText(c.value, { x: M + 120, y, size: 10.5, font: f.light, color: INK });
      const href = contactHref(c.label, c.value);
      if (href.startsWith('http')) page.drawText(href.replace(/^https?:\/\//, ''), { x: M + 120, y: y - 13, size: 7.5, font: f.light, color: GREY });
      y -= 40;
    }
    page.drawText(window.location.host, { x: M, y: y - 10, size: 10.5, font: f.serif, color: MID });
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
