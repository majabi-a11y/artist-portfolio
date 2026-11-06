import { useRef, useState } from 'react';
import { Pipette, Plus, Trash2, Upload } from 'lucide-react';
import type { PortfolioPage, SiteData } from '../data/defaultData';

interface Props {
  data: SiteData;
  replaceData: (next: SiteData) => void;
  uploadImage: (file: File, path: string) => Promise<string>;
}

const APLATS = ['#281c42', '#1d1aa8', '#ff5c9d', '#14121a', '#f4f1ea'];
const KRAFTS = ['#cdac7f', '#f4c9d6', '#bcd6ea', '#f4f1ea'];
const LAYOUTS: Record<PortfolioPage['layout'], string> = {
  pleine: 'Image pleine page, légende dessous',
  moitie: 'Moitié image, moitié texte',
  detail: 'Fresque entière et détail',
};
const PLACES: [number, string][] = [
  [4, 'Après le parcours'], [6, 'Après les œuvres'], [17, 'Après les fresques'], [19, 'À la fin, avant le dos'],
];
const EMPTY = { layout: 'pleine' as PortfolioPage['layout'], images: ['', ''], title: '', text: '', after: 17 };

/** « #abc », « abc » ou « #aabbcc » → « #aabbcc » ; null tant que le code n'est pas complet. */
function parseHex(text: string): string | null {
  const m = text.trim().toLowerCase().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!m) return null;
  return `#${m[1].length === 3 ? [...m[1]].map(c => c + c).join('') : m[1]}`;
}

/** Couleur du pixel cliqué sur l'image. */
function pixelAt(e: React.MouseEvent<HTMLImageElement>): string {
  const img = e.currentTarget;
  const box = img.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const x = Math.floor(((e.clientX - box.left) / box.width) * img.naturalWidth);
  const y = Math.floor(((e.clientY - box.top) / box.height) * img.naturalHeight);
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

interface ColorFieldProps {
  label: string;
  swatches: string[];
  value: string;
  onChange: (color: string) => void;
}

/** Une couleur : pastilles, nuancier, code à taper, ou pipette sur sa palette. */
function ColorField({ label, swatches, value, onChange }: ColorFieldProps) {
  const [typing, setTyping] = useState<string | null>(null);
  const [dropper, setDropper] = useState(false);
  return (
    <div>
      <span className="drive-label">{label}</span>
      <div className="pf-swatches">
        {swatches.map((c, i) => (
          <button key={c} type="button" className={`pf-swatch${value === c ? ' is-on' : ''}`}
            style={{ background: c }} aria-label={i ? c : "Couleur d'origine"} onClick={() => onChange(c)} />
        ))}
        <input type="color" aria-label="Nuancier" value={value} onChange={e => onChange(e.target.value)} />
        <input className="admin-input pf-hex" aria-label={`Code couleur : ${label}`} placeholder="#1d1aa8" spellCheck={false}
          value={typing ?? value} onBlur={() => setTyping(null)}
          onChange={e => {
            setTyping(e.target.value);
            const hex = parseHex(e.target.value);
            if (hex) onChange(hex);
          }} />
        <button type="button" className={`btn btn-outline btn-sm${dropper ? ' is-on' : ''}`} aria-pressed={dropper}
          onClick={() => setDropper(d => !d)}><Pipette size={13} /> Pipette</button>
      </div>
      {dropper && (
        <img className="pf-palette" src="/portfolio/palette.webp" alt="Sa palette : cliquer pour prélever une couleur"
          onClick={e => onChange(pixelAt(e))} />
      )}
    </div>
  );
}

/** Admin : le portfolio reste le PDF d'Adrien ; on change ses couleurs et on y ajoute des pages. */
export default function PortfolioEditor({ data, replaceData, uploadImage }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const slot = useRef(0);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const settings = data.portfolioPdf ?? {};
  const pages = settings.pages ?? [];
  const works = data.artworks.filter(a => !a.draft && a.images?.[0]);
  const save = (next: Partial<NonNullable<SiteData['portfolioPdf']>>) =>
    replaceData({ ...data, portfolioPdf: JSON.parse(JSON.stringify({ ...settings, ...next })) }); // Firestore refuse les undefined
  const setImage = (i: number, src: string) =>
    setDraft(d => ({ ...d, images: d.images.map((v, k) => (k === i ? src : v)) }));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      setImage(slot.current, await uploadImage(file, 'portfolio'));
    } catch (err) {
      alert(`L'image n'a pas pu être envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setBusy(false);
    }
  };

  const needed = draft.layout === 'detail' ? 2 : 1;
  const add = () => {
    save({ pages: [...pages, { ...draft, id: crypto.randomUUID(), images: draft.images.slice(0, needed) }] });
    setDraft(EMPTY);
  };

  const colors = (label: string, key: 'aplat' | 'kraft', swatches: string[]) => (
    <ColorField label={label} swatches={swatches} value={settings[key] ?? swatches[0]}
      onChange={c => save({ [key]: c === swatches[0] ? undefined : c })} />
  );

  const picker = (i: number, label: string) => (
    <div>
      <label className="drive-label" htmlFor={`pf-image-${i}`}>{label}</label>
      <select id={`pf-image-${i}`} className="admin-input" value={draft.images[i]} onChange={e => setImage(i, e.target.value)}>
        <option value="">Choisir une œuvre</option>
        {draft.images[i] && !works.some(a => a.images.includes(draft.images[i])) && <option value={draft.images[i]}>Image importée</option>}
        {works.flatMap(a => a.images.map((src, k) => (
          <option key={src} value={src}>{a.title}{a.images.length > 1 ? ` (${k + 1})` : ''}</option>
        )))}
      </select>
      <button type="button" className="btn btn-outline btn-sm" disabled={busy} style={{ marginTop: 8 }}
        onClick={() => { slot.current = i; input.current?.click(); }}>
        <Upload size={13} /> {busy ? 'Envoi…' : 'Importer une image'}
      </button>
    </div>
  );

  return (
    <div className="pdf-covers">
      <input ref={input} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <p className="drive-hint">Portfolio : ses pages restent identiques. Le premier carré de chaque couleur est celle d'origine.</p>
      {colors('Couleur des aplats (bio et parcours)', 'aplat', APLATS)}
      {colors("Couleur du kraft (couverture et dos d'origine)", 'kraft', KRAFTS)}

      {pages.map(p => (
        <div key={p.id} className="pf-row">
          <span>{p.title || 'Page sans titre'} · {PLACES.find(([n]) => n === p.after)?.[1]}</span>
          <button type="button" className="btn btn-outline btn-sm" aria-label="Retirer la page"
            onClick={() => save({ pages: pages.filter(x => x.id !== p.id) })}><Trash2 size={13} /></button>
        </div>
      ))}

      <div className="pf-form">
        <span className="drive-label">Ajouter une page</span>
        <select className="admin-input" aria-label="Mise en page" value={draft.layout}
          onChange={e => setDraft(d => ({ ...d, layout: e.target.value as PortfolioPage['layout'] }))}>
          {Object.entries(LAYOUTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {picker(0, draft.layout === 'detail' ? 'Fresque entière' : 'Image')}
        {draft.layout === 'detail' && picker(1, 'Détail')}
        <input className="admin-input" placeholder="Titre" value={draft.title}
          onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
        <textarea className="admin-input" rows={3} placeholder="Légende : lieu, format, texte" value={draft.text}
          onChange={e => setDraft(d => ({ ...d, text: e.target.value }))} />
        <select className="admin-input" aria-label="Emplacement" value={draft.after}
          onChange={e => setDraft(d => ({ ...d, after: Number(e.target.value) }))}>
          {PLACES.map(([n, label]) => <option key={n} value={n}>{label}</option>)}
        </select>
        <button type="button" className="btn btn-outline btn-sm" disabled={draft.images.slice(0, needed).some(i => !i)} onClick={add}>
          <Plus size={13} /> Ajouter au portfolio
        </button>
      </div>
    </div>
  );
}
