import { useState } from 'react';
import { FolderSync, Check, AlertCircle } from 'lucide-react';
import type { Artwork, NewsPost, SiteData } from '../data/defaultData';
import { importFromDrive, missingFields, folderIdFromUrl, type ImportReport } from '../utils/driveImport';

interface Props {
  data: SiteData;
  replaceData: (next: SiteData) => void;
  save: (override?: SiteData) => Promise<void>;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
  updateNews: (id: string, updates: Partial<NewsPost>) => void;
}

const RUBRIQUES: Record<string, string> = {
  toile: 'Toile', papier: 'Papier', serigraphie: 'Sérigraphie', fresque: 'Fresque', graphisme: 'Graphisme', objets: 'Objet',
};

/**
 * Admin : lien du Drive partagé, import des nouvelles photos, et fiches brouillon à compléter.
 * Une fiche n'est publiée sur le site qu'une fois ses champs obligatoires remplis.
 */
export default function DrivePanel({ data, replaceData, save, updateArtwork, updateNews }: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');

  const draftArtworks = data.artworks.filter(a => a.draft);
  const draftNews = data.news.filter(n => n.draft);
  const todo = draftArtworks.length + draftNews.length;

  const runImport = async () => {
    setBusy(true); setError(''); setReport(null);
    try {
      const { data: next, report } = await importFromDrive(data, setProgress);
      await save(next); // les photos sont déjà en ligne : on enregistre tout de suite les brouillons
      replaceData(next);
      setReport(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import impossible.');
    } finally {
      setBusy(false); setProgress('');
    }
  };

  const publishArtwork = async (a: Artwork) => {
    const next = { ...data, artworks: data.artworks.map(x => x.id === a.id ? { ...x, draft: false } : x) };
    await save(next);
  };
  const publishNews = async (n: NewsPost) => {
    const next = { ...data, news: data.news.map(x => x.id === n.id ? { ...x, draft: false } : x) };
    await save(next);
  };

  return (
    <section className="drive-panel">
      <div className="drive-head">
        <FolderSync size={16} strokeWidth={1.5} />
        <h2>Drive partagé</h2>
        {todo > 0 && <span className="drive-badge">{todo} à compléter</span>}
      </div>

      <label className="drive-label">Lien du dossier partagé</label>
      <input
        className="admin-input"
        placeholder="https://drive.google.com/drive/folders/…"
        value={data.driveFolderUrl ?? ''}
        onChange={e => replaceData({ ...data, driveFolderUrl: e.target.value.trim() })}
      />
      {data.driveFolderUrl && !folderIdFromUrl(data.driveFolderUrl) && (
        <p className="drive-error">Ce lien ne ressemble pas à un dossier Drive.</p>
      )}
      <p className="drive-hint">
        Un dossier par rubrique (Toiles, Papiers, Sérigraphies, Fresques, Journal), puis un dossier par œuvre
        avec ses photos. Les photos HEIC de l'iPhone doivent être en JPEG.
      </p>

      <button className="btn btn-primary btn-sm" onClick={runImport} disabled={busy || !data.driveFolderUrl}>
        <FolderSync size={13} /> {busy ? (progress || 'Import…') : 'Importer les nouvelles photos'}
      </button>

      {error && <p className="drive-error"><AlertCircle size={13} /> {error}</p>}
      {report && (
        <p className="drive-ok">
          <Check size={13} /> {report.photos} photo{report.photos > 1 ? 's' : ''} importée{report.photos > 1 ? 's' : ''},
          {' '}{report.created} nouvelle{report.created > 1 ? 's' : ''} fiche{report.created > 1 ? 's' : ''}
          {report.updated > 0 && `, ${report.updated} complétée${report.updated > 1 ? 's' : ''} de photos`}.
          {report.skipped.length > 0 && ` Non importées (format à convertir en JPEG) : ${report.skipped.join(', ')}.`}
        </p>
      )}

      {todo > 0 && (
        <div className="drive-todo">
          <h3>À compléter avant publication</h3>
          {draftArtworks.map(a => {
            const missing = missingFields(a);
            return (
              <div key={a.id} className="drive-card">
                {a.images[0] && <img src={a.images[0]} alt="" />}
                <div className="drive-fields">
                  <span className="drive-tag">{RUBRIQUES[a.category] ?? a.category}</span>
                  <input className="admin-input" placeholder="Titre" value={a.title} onChange={e => updateArtwork(a.id, { title: e.target.value })} />
                  {a.category === 'fresque' ? (
                    <>
                      <input className="admin-input" placeholder="Lieu (ville, bâtiment)" value={a.lieu ?? ''} onChange={e => updateArtwork(a.id, { lieu: e.target.value })} />
                      <input className="admin-input" placeholder="Dimensions (ex. 18 x 11 m)" value={a.dimensions} onChange={e => updateArtwork(a.id, { dimensions: e.target.value })} />
                      <input className="admin-input" placeholder="Année (facultatif)" inputMode="numeric" value={a.year ?? ''} onChange={e => updateArtwork(a.id, { year: parseInt(e.target.value) || undefined })} />
                    </>
                  ) : (
                    <>
                      <input className="admin-input" placeholder="Technique (ex. Acrylique sur toile)" value={a.technique} onChange={e => updateArtwork(a.id, { technique: e.target.value })} />
                      <input className="admin-input" placeholder="Dimensions (ex. 100 x 81 cm)" value={a.dimensions} onChange={e => updateArtwork(a.id, { dimensions: e.target.value })} />
                      <div className="drive-row">
                        <input className="admin-input" placeholder="Année" inputMode="numeric" value={a.year ?? ''} onChange={e => updateArtwork(a.id, { year: parseInt(e.target.value) || undefined })} />
                        <input className="admin-input" placeholder="Prix (€)" inputMode="numeric" value={a.price ?? ''} onChange={e => updateArtwork(a.id, { price: e.target.value || undefined })} />
                      </div>
                      <input className="admin-input" placeholder="Signature (ex. Signée au dos)" value={a.signature ?? ''} onChange={e => updateArtwork(a.id, { signature: e.target.value || undefined })} />
                    </>
                  )}
                  <textarea className="admin-input" rows={2} placeholder="Description (facultatif)" value={a.description} onChange={e => updateArtwork(a.id, { description: e.target.value })} />
                  {missing.length > 0
                    ? <p className="drive-missing">Manque : {missing.join(', ')}</p>
                    : <button className="btn btn-primary btn-sm" onClick={() => publishArtwork(a)}>Publier sur le site</button>}
                </div>
              </div>
            );
          })}
          {draftNews.map(n => {
            const missing = missingFields(n);
            return (
              <div key={n.id} className="drive-card">
                {n.images[0] && <img src={n.images[0]} alt="" />}
                <div className="drive-fields">
                  <span className="drive-tag">Journal</span>
                  <input className="admin-input" placeholder="Titre" value={n.title} onChange={e => updateNews(n.id, { title: e.target.value })} />
                  <textarea className="admin-input" rows={4} placeholder="Texte de l'actu" value={n.content} onChange={e => updateNews(n.id, { content: e.target.value })} />
                  {missing.length > 0
                    ? <p className="drive-missing">Manque : {missing.join(', ')}</p>
                    : <button className="btn btn-primary btn-sm" onClick={() => publishNews(n)}>Publier sur le site</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
