import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  images: string[];
  max?: number;
  folder: string;
  onUpload: (file: File, folder: string) => Promise<string>;
  onChange: (images: string[]) => void;
}

export default function MultiImageUpload({ images, max = 5, folder, onUpload, onChange }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleAdd = async (file: File) => {
    if (images.length >= max) return;
    setUploading(true);
    try {
      const url = await onUpload(file, folder);
      onChange([...images, url]);
    } catch (err) {
      alert(`La photo n'a pas pu être envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setUploading(false);
    }
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
            <div key={i} style={{ position: 'relative', width: '64px', height: '64px' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid rgba(var(--ink-rgb), 0.06)' }} />
              <button onClick={() => handleRemove(i)}
                style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                <Trash2 size={10} />
              </button>
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
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleAdd(file);
            e.target.value = '';
          }} />
        </label>
      )}
    </div>
  );
}
