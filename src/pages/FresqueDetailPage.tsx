import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import BackButton from '../components/BackButton';
import ImageViewer from '../components/ImageViewer';
import { useSiteData } from '../contexts/SiteDataContext';
import { isPublished } from '../data/defaultData';
import { recordView } from '../lib/taste';

/** Une fresque, comme une page de son catalogue : les photos entières, la légende dessous. */
export default function FresqueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useSiteData();
  const [viewer, setViewer] = useState<number | null>(null);
  const fresques = data.artworks.filter(a => a.category === 'fresque' && isPublished(a));
  const index = fresques.findIndex(f => f.id === id);
  const fresque = fresques[index];
  const next = fresques[(index + 1) % fresques.length];

  useEffect(() => {
    if (fresque) recordView(fresque.id);
    window.scrollTo(0, 0);
  }, [fresque?.id]);

  if (!fresque) {
    return (
      <div className="page-wrapper">
        <div className="page-content" style={{ paddingTop: '80px' }}>
          <BackButton />
          <div className="empty-state"><div className="empty-state-title">Fresque introuvable</div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        <div className="fresque-photos">
          {fresque.images.map((src, i) => (
            <button key={src} type="button" onClick={() => setViewer(i)} aria-label={`Agrandir la photo ${i + 1}`}>
              <img src={src} alt={`${fresque.title} ${i + 1}`} />
            </button>
          ))}
        </div>
        <h1 className="artwork-title" style={{ fontSize: '1.7rem' }}>{fresque.title}</h1>
        <div className="fresque-meta">
          {fresque.year && <span>{fresque.year}</span>}
          {fresque.lieu && <span>{fresque.lieu}</span>}
          {fresque.dimensions && <span>{fresque.dimensions}</span>}
        </div>
        {fresque.description && <p className="fresque-text">{fresque.description}</p>}
        {fresque.coords && (
          <button className="fresque-map-toggle" style={{ margin: '0 0 24px' }} onClick={() => navigate(`/fresques?carte=${fresque.id}`)}>
            <MapPin size={14} /> Voir sur la carte
          </button>
        )}
        <button className="btn btn-primary btn-block" style={{ padding: '14px', fontSize: '0.82rem' }}
          onClick={() => navigate(`/contact?type=quote&title=${encodeURIComponent(fresque.title)}`)}>
          Demander un devis
        </button>
        {fresques.length > 1 && (
          <button className="fresque-next" onClick={() => navigate(`/fresques/${next.id}`)}>Fresque suivante : {next.title}</button>
        )}
      </div>
      {viewer !== null && (
        <ImageViewer images={fresque.images} startIndex={viewer} alt={fresque.title} onClose={() => setViewer(null)} />
      )}
    </div>
  );
}
