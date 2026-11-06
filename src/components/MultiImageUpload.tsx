import { ArrowLeft, ArrowRight, Upload, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  images: string[];
  max?: number;
  folder: string;
  onUpload: (file: File, folder: string) => Promise<string>;
  onChange: (images: string[]) => void;
  /** Œuvres du site, à ajouter sans renvoyer de fichier */
  library?: { title: string; src: string }[];
}

export default function MultiImageUpload({ images, max = 5, folder, onUpload, onChange, library }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleAdd = async (files: File[]) => {
    setUploading(true);
    let next = images;
    try {
      // L'une après l'autre : l'ordre choisi est gardé
      for (const file of files.slice(0, max - images.length)) {
        next = [...next, await onUpload(file, folder)];
        onChange(next);
      }
    } catch (err) {
      alert(`La photo n'a pas pu être envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
  };

  const move = (idx: number, by: number) => {
    const next = [...images];
    next.splice(idx + by, 0, ...next.splice(idx, 1));
    onChange(next);
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {images.map((url, i) => (
            <div key={url} style={{ position: 'relative', width: '64px', height: '64px', marginBottom: images.length > 1 ? '22px' : 0 }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid rgba(var(--ink-rgb), 0.06)' }} />
              <button onClick={() => handleRemove(i)}
                style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                <Trash2 size={10} />
              </button>
              {images.length > 1 && (
                <div className="image-order">
                  <button type="button" aria-label="Avancer dans le carrousel" disabled={i === 0} onClick={() => move(i, -1)}><ArrowLeft size={12} /></button>
                  <button type="button" aria-label="Reculer dans le carrousel" disabled={i === images.length - 1} onClick={() => move(i, 1)}><ArrowRight size={12} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < max && (
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          height: '48px', border: '1px dashed rgba(var(--ink-rgb), 0.12)', cursor: 'pointer',
          fontSize: '0.68rem', color: 'var(--color-text-muted)',
        }}>
          {uploading ? (
            <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Upload...</>
          ) : (
            <><Upload size={14} style={{ opacity: 0.4 }} /> Ajouter ({images.length}/{max})</>
          )}
          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
            const files = [...(e.target.files ?? [])];
            if (files.length) handleAdd(files);
            e.target.value = '';
          }} />
        </label>
      )}

      {library && images.length < max && (
        <select className="admin-input" style={{ marginTop: '8px' }} aria-label="Ajouter une œuvre du site" value=""
          onChange={e => { if (e.target.value) onChange([...images, e.target.value]); }}>
          <option value="">Ajouter une œuvre du site</option>
          {library.filter(w => !images.includes(w.src)).map(w => <option key={w.src} value={w.src}>{w.title}</option>)}
        </select>
      )}
    </div>
  );
}
