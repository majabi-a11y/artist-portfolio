import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import type { SiteData } from '../data/defaultData';
import { thumb } from '../data/defaultData';

type Kind = 'catalogue' | 'portfolio';

interface Props {
  data: SiteData;
  replaceData: (next: SiteData) => void;
  uploadImage: (file: File, path: string) => Promise<string>;
}

const LABELS: Record<Kind, string> = { catalogue: 'Couverture du catalogue', portfolio: 'Couverture du portfolio' };

/** Admin : image de couverture de chaque PDF, choisie parmi les œuvres ou importée. */
export default function PdfCovers({ data, replaceData, uploadImage }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<Kind>('catalogue');
  const [busy, setBusy] = useState<Kind | null>(null);

  const works = data.artworks.filter(a => !a.draft && a.images?.[0]);
  const setCover = (kind: Kind, src: string) => {
    const pdfCovers = { ...data.pdfCovers };
    if (src) pdfCovers[kind] = src; else delete pdfCovers[kind];
    replaceData({ ...data, pdfCovers });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind = target.current;
    setBusy(kind);
    try {
      setCover(kind, await uploadImage(file, 'couvertures'));
    } catch (err) {
      alert(`L'image n'a pas pu être envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="pdf-covers">
      <input ref={input} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
      {(['catalogue', 'portfolio'] as Kind[]).map(kind => {
        const src = data.pdfCovers?.[kind] ?? '';
        const known = works.some(a => a.images[0] === src);
        return (
          <div key={kind} className="pdf-cover">
            <div className="pdf-cover-thumb">
              {src ? <img src={thumb(src)} alt="" /> : <span>Auto</span>}
            </div>
            <div className="pdf-cover-fields">
              <label className="drive-label" htmlFor={`cover-${kind}`}>{LABELS[kind]}</label>
              <select id={`cover-${kind}`} className="admin-input" value={known ? src : src ? 'import' : ''}
                onChange={e => { if (e.target.value !== 'import') setCover(kind, e.target.value); }}>
                <option value="">Automatique</option>
                {src && !known && <option value="import">Image importée</option>}
                {works.map(a => <option key={a.id} value={a.images[0]}>{a.title.trim()}{a.dimensions ? ` (${a.dimensions})` : ''}</option>)}
              </select>
              <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null}
                onClick={() => { target.current = kind; input.current?.click(); }}>
                <Upload size={13} /> {busy === kind ? 'Envoi…' : 'Importer une image'}
              </button>
            </div>
          </div>
        );
      })}
      <p className="drive-hint">Pensez à cliquer sur « Enregistrer » pour garder votre choix.</p>
    </div>
  );
}
