import { useRef, useState } from 'react';
import { ExternalLink, Trash2, Upload } from 'lucide-react';
import type { CatalogueFile, SiteData } from '../data/defaultData';
import { onlineCatalogue } from '../data/defaultData';
import { uploadPdf } from '../supabase';

interface Props {
  data: SiteData;
  save: (next: SiteData) => Promise<void>;
}

/** Admin : les catalogues d'expo ; celui qui est coché est téléchargeable sur le site. Chaque changement s'enregistre seul. */
export default function CataloguesPanel({ data, save }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const list = data.catalogues ?? [];
  const online = onlineCatalogue(data);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const added: CatalogueFile = {
        id: crypto.randomUUID(),
        title: title.trim() || file.name.replace(/\.pdf$/i, ''),
        url: await uploadPdf(file),
      };
      await save({ ...data, catalogues: [added, ...list] });
      setTitle('');
    } catch (err) {
      alert(`Le catalogue n'a pas pu être envoyé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = (c: CatalogueFile) => {
    if (confirm(`Retirer « ${c.title} » de la liste ?`)) save({ ...data, catalogues: list.filter(x => x.id !== c.id) });
  };

  return (
    <div className="pdf-covers">
      <input ref={input} type="file" accept="application/pdf" onChange={onFile} style={{ display: 'none' }} />
      <span className="drive-label">Catalogues d'expo : le catalogue coché est téléchargeable sur le site</span>
      <div className="catalogue-row">
        <input type="radio" name="catalogue-online" aria-label="Aucun catalogue en ligne" checked={!online}
          onChange={() => save({ ...data, catalogueOnline: '' })} />
        <span>Aucun (bouton masqué sur le site)</span>
      </div>
      {list.map(c => (
        <div key={c.id} className="catalogue-row">
          <input type="radio" name="catalogue-online" aria-label={`Mettre en ligne ${c.title}`} checked={online?.id === c.id}
            onChange={() => save({ ...data, catalogueOnline: c.id })} />
          <span>{c.title}</span>
          <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${c.title}`}><ExternalLink size={14} /></a>
          <button type="button" className="invite-remove" aria-label={`Retirer ${c.title}`} disabled={online?.id === c.id} onClick={() => remove(c)}><Trash2 size={14} /></button>
        </div>
      ))}
      <input className="admin-input" placeholder="Titre : Exposition, galerie, date" value={title} onChange={e => setTitle(e.target.value)} />
      <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => input.current?.click()}>
        <Upload size={13} /> {busy ? 'Envoi…' : 'Ajouter un catalogue PDF'}
      </button>
    </div>
  );
}
