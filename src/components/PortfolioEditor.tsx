import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pipette, Plus, Trash2, Upload } from 'lucide-react';
import type { PfBlock, PfSheet, SiteData } from '../data/defaultData';
import { APLAT, DEFAULT_SHEETS } from '../data/portfolioPages';

interface Props {
  data: SiteData;
  replaceData: (next: SiteData) => void;
  uploadImage: (file: File, path: string) => Promise<string>;
}

const APLATS = ['#281c42', '#1d1aa8', '#ff5c9d', '#14121a'];
const BACKGROUNDS = ['#ffffff', '#f4f1ea', '#1d1aa8', '#14121a'];
const TEXTS = ['#1a1a1a', '#ffffff', '#1c2a6e', '#f06a9b'];

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

/** Admin : le portfolio page par page. Chaque image et chaque texte se déplace, se redimensionne, se remplace. */
export default function PortfolioEditor({ data, replaceData, uploadImage }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState('s1');
  const [selected, setSelected] = useState<string | null>(null);
  const [live, setLive] = useState<PfBlock | null>(null); // bloc en cours de déplacement
  const [busy, setBusy] = useState(false);

  const settings = data.portfolioPdf ?? {};
  const aplat = settings.aplat ?? APLAT;
  const sheets = settings.sheets ?? DEFAULT_SHEETS;
  const sheet = sheets.find(s => s.id === current) ?? sheets[0];
  const block = sheet?.blocks.find(b => b.id === selected) ?? null;
  const works = data.artworks.filter(a => !a.draft && a.images?.[0]);

  const save = (next: Partial<NonNullable<SiteData['portfolioPdf']>>) =>
    replaceData({ ...data, portfolioPdf: JSON.parse(JSON.stringify({ ...settings, ...next })) }); // Firestore refuse les undefined
  const setSheets = (next: PfSheet[]) => save({ sheets: next });
  const patchSheet = (patch: Partial<PfSheet>) => setSheets(sheets.map(s => (s.id === sheet.id ? { ...s, ...patch } : s)));
  const patchBlock = (id: string, patch: Partial<PfBlock>) =>
    patchSheet({ blocks: sheet.blocks.map(b => (b.id === id ? { ...b, ...patch } : b)) });
  const addBlock = (b: Omit<PfBlock, 'id'>) => {
    const id = crypto.randomUUID();
    patchSheet({ blocks: [...sheet.blocks, { ...b, id }] });
    setSelected(id);
  };

  const move = (i: number, by: number) => {
    const next = [...sheets];
    next.splice(i + by, 0, ...next.splice(i, 1));
    setSheets(next);
  };
  const addSheet = () => {
    const id = crypto.randomUUID();
    const at = sheets.indexOf(sheet) + 1;
    setSheets([...sheets.slice(0, at), { id, name: 'Nouvelle page', blocks: [] }, ...sheets.slice(at)]);
    setCurrent(id);
    setSelected(null);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const src = await uploadImage(file, 'portfolio');
      if (block?.kind === 'image') patchBlock(block.id, { src });
      else addBlock({ kind: 'image', src, x: 10, y: 10, w: 50, h: 60 });
    } catch (err) {
      alert(`L'image n'a pas pu être envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setBusy(false);
    }
  };

  /** Déplace (ou redimensionne, depuis la poignée) ; n'enregistre qu'au lâcher. */
  const drag = (e: React.PointerEvent, b: PfBlock, resize: boolean) => {
    e.stopPropagation();
    if (selected !== b.id) {
      setSelected(b.id);
      if (e.pointerType !== 'mouse') return; // au doigt : un premier toucher sélectionne, la page reste défilable
    }
    const box = sheetRef.current!.getBoundingClientRect();
    const [sx, sy] = [e.clientX, e.clientY];
    const snap = (v: number) => ([0, 100].find(edge => Math.abs(v - edge) < 1) ?? Math.round(v * 10) / 10);
    let next = b;
    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - sx) / box.width) * 100, dy = ((ev.clientY - sy) / box.height) * 100;
      next = resize
        ? { ...b, w: Math.max(3, snap(b.x + b.w + dx) - b.x), h: Math.max(3, snap(b.y + b.h + dy) - b.y) }
        : { ...b, x: snap(b.x + dx), y: snap(b.y + dy) };
      setLive(next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setLive(null);
      if (next !== b) patchBlock(b.id, next);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  if (!sheet) return null;
  const bg = sheet.bg === 'aplat' ? aplat : sheet.bg ?? '#ffffff';
  const light = parseInt(bg.slice(1, 3), 16) * 0.3 + parseInt(bg.slice(3, 5), 16) * 0.59 + parseInt(bg.slice(5, 7), 16) * 0.11 > 150;

  return (
    <div className="pdf-covers">
      <input ref={input} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      <span className="drive-label">Portfolio PDF, page par page</span>

      <div className="pf-list">
        {sheets.map((s, i) => (
          <div key={s.id} className={`pf-row${s.id === sheet.id ? ' is-on' : ''}${s.hidden ? ' is-hidden' : ''}`}
            onClick={() => { setCurrent(s.id); setSelected(null); }}>
            <span>{i + 1}. {s.name}</span>
            <span className="pf-row-actions" onClick={e => e.stopPropagation()}>
              <button type="button" aria-label="Monter" disabled={!i} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
              <button type="button" aria-label="Descendre" disabled={i === sheets.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
              <button type="button" aria-label={s.hidden ? 'Remettre dans le PDF' : 'Retirer du PDF'}
                onClick={() => setSheets(sheets.map(x => (x.id === s.id ? { ...x, hidden: !x.hidden } : x)))}>
                {s.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="pf-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={addSheet}><Plus size={13} /> Nouvelle page</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => {
          if (confirm('Supprimer cette page ?')) { setSheets(sheets.filter(s => s.id !== sheet.id)); setSelected(null); }
        }}><Trash2 size={13} /> Supprimer la page</button>
      </div>

      <div ref={sheetRef} className="pf-sheet" style={{ background: bg }} onPointerDown={() => setSelected(null)}>
        {sheet.blocks.map(original => {
          const b = live?.id === original.id ? live : original;
          const on = b.id === selected;
          return (
            <div key={b.id} className={`pf-block${on ? ' is-on' : ''}`} onPointerDown={e => drag(e, original, false)}
              style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: b.kind === 'image' ? `${b.h}%` : undefined }}>
              {b.kind === 'image'
                ? <img src={b.src} alt="" draggable={false} />
                : <div className="pf-block-text" style={{
                    fontSize: `${((b.size ?? 10.5) / 1190.55) * 100}cqw`, textAlign: b.align ?? 'left', lineHeight: b.lead,
                    color: b.color ?? (light ? '#1a1a1a' : '#f5f3f0'),
                  }}>{b.text}</div>}
              {on && <span className="pf-handle" onPointerDown={e => drag(e, original, true)} />}
            </div>
          );
        })}
      </div>

      <div className="pf-actions">
        <button type="button" className="btn btn-outline btn-sm"
          onClick={() => addBlock({ kind: 'text', text: 'Titre\nLégende', x: 10, y: 80, w: 30, h: 0, size: 10.5 })}>
          <Plus size={13} /> Texte
        </button>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy}
          onClick={() => { setSelected(null); input.current?.click(); }}>
          <Upload size={13} /> {busy ? 'Envoi…' : 'Ajouter une image'}
        </button>
      </div>

      {block?.kind === 'text' && (
        <div className="pf-form">
          <textarea className="admin-input" rows={6} aria-label="Texte" value={block.text ?? ''}
            onChange={e => patchBlock(block.id, { text: e.target.value })} />
          <div className="pf-actions">
            <input className="admin-input pf-hex" type="number" min={5} max={80} step={0.5} aria-label="Taille du texte"
              value={block.size ?? 10.5} onChange={e => patchBlock(block.id, { size: Number(e.target.value) || 10.5 })} />
            <select className="admin-input" aria-label="Alignement" value={block.align ?? 'left'}
              onChange={e => patchBlock(block.id, { align: e.target.value as PfBlock['align'] })}>
              <option value="left">À gauche</option>
              <option value="center">Centré</option>
              <option value="right">À droite</option>
            </select>
          </div>
          <ColorField label="Couleur du texte" swatches={TEXTS} value={block.color ?? (light ? '#1a1a1a' : '#ffffff')}
            onChange={color => patchBlock(block.id, { color })} />
        </div>
      )}

      {block?.kind === 'image' && (
        <div className="pf-form">
          <select className="admin-input" aria-label="Remplacer par une œuvre du site" value=""
            onChange={e => { if (e.target.value) patchBlock(block.id, { src: e.target.value }); }}>
            <option value="">Remplacer par une œuvre du site</option>
            {works.flatMap(a => a.images.map((src, k) => (
              <option key={src} value={src}>{a.title.trim()}{a.images.length > 1 ? ` (${k + 1})` : ''}</option>
            )))}
          </select>
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            <Upload size={13} /> {busy ? 'Envoi…' : 'Remplacer par une image importée'}
          </button>
        </div>
      )}

      {block && (
        <button type="button" className="btn btn-outline btn-sm" onClick={() => {
          patchSheet({ blocks: sheet.blocks.filter(b => b.id !== block.id) });
          setSelected(null);
        }}><Trash2 size={13} /> Retirer ce bloc</button>
      )}

      {!block && (
        <>
          <div>
            <label className="drive-label" htmlFor="pf-name">Nom de la page (seulement ici)</label>
            <input id="pf-name" className="admin-input" value={sheet.name} onChange={e => patchSheet({ name: e.target.value })} />
          </div>
          <ColorField label="Fond de cette page" swatches={[...new Set([...BACKGROUNDS, aplat])]} value={bg}
            onChange={c => patchSheet({ bg: c === aplat ? 'aplat' : c === '#ffffff' ? undefined : c })} />
          <ColorField label="Couleur des aplats (présentation et parcours)" swatches={APLATS} value={aplat}
            onChange={c => save({ aplat: c === APLATS[0] ? undefined : c })} />
        </>
      )}

      <p className="drive-hint">Cliquez sur un bloc pour le déplacer ; le carré rose l'agrandit. Le premier carré des aplats est la couleur d'origine. Pensez à « Enregistrer ».</p>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => {
        if (confirm('Revenir au portfolio d’origine ? Toutes les modifications de pages seront perdues.')) { save({ sheets: undefined, aplat: undefined }); setSelected(null); }
      }}>Revenir au portfolio d'origine</button>
    </div>
  );
}
