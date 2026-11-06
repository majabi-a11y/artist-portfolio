import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { Artwork, NewsPost, SiteData } from '../data/defaultData';

type Rubrique = Artwork['category'] | 'journal';

const RUBRIQUES: { id: Rubrique; label: string }[] = [
  { id: 'toile', label: 'Toile' },
  { id: 'papier', label: 'Papier' },
  { id: 'serigraphie', label: 'Sérigraphie' },
  { id: 'fresque', label: 'Fresque' },
  { id: 'journal', label: 'Journal' },
];

interface Props {
  data: SiteData;
  save: (override?: SiteData) => Promise<void>;
  uploadImage: (file: File, path: string) => Promise<string>;
}

const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

/**
 * Admin : envoyer les photos d'une nouvelle œuvre, depuis l'ordinateur ou le téléphone.
 * Crée une fiche brouillon, que le panneau « À compléter » fait remplir avant publication.
 */
export default function AddWork({ data, save, uploadImage }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [rubrique, setRubrique] = useState<Rubrique>('toile');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!files.length) return;
    setError('');
    try {
      const folder = rubrique === 'journal' ? 'journal' : rubrique === 'fresque' ? 'fresques' : 'oeuvres';
      const images: string[] = [];
      for (const [i, file] of files.entries()) {
        setProgress(`Envoi de la photo ${i + 1} sur ${files.length}…`);
        images.push(await uploadImage(file, folder));
      }
      const id = `admin-${Date.now()}`;
      const title = files.length === 1 ? titleFromFile(files[0].name) : '';
      setProgress('Enregistrement…');
      if (rubrique === 'journal') {
        const post: NewsPost = { id, title, date: new Date().toISOString().slice(0, 10), content: '', images, category: 'studio', draft: true };
        await save({ ...data, news: [post, ...data.news] });
      } else {
        const art: Artwork = {
          id, title, technique: rubrique === 'fresque' ? 'Fresque' : '', dimensions: '', description: '', images,
          category: rubrique, isFeatured: false, status: rubrique === 'fresque' ? 'private' : 'available', draft: true,
        };
        await save({ ...data, artworks: [...data.artworks, art] });
      }
    } catch (err) {
      setError(`Les photos n'ont pas pu être envoyées : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setProgress('');
    }
  };

  return (
    <section className="drive-panel">
      <div className="drive-head">
        <ImagePlus size={16} strokeWidth={1.5} />
        <h2>Ajouter une œuvre</h2>
      </div>
      <div className="add-work-types">
        {RUBRIQUES.map(r => (
          <button key={r.id} type="button" className={rubrique === r.id ? 'active' : ''} onClick={() => setRubrique(r.id)}>{r.label}</button>
        ))}
      </div>
      <input ref={input} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
      <button type="button" className="btn btn-primary btn-sm" disabled={!!progress} onClick={() => input.current?.click()}>
        <ImagePlus size={13} /> {progress || 'Choisir les photos'}
      </button>
      <p className="drive-hint">Une œuvre à la fois, avec toutes ses photos. La fiche à compléter apparaît ensuite ci-dessous.</p>
      {error && <p className="drive-error">{error}</p>}
    </section>
  );
}
