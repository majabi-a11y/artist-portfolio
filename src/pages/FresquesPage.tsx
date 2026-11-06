import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { MapPin } from 'lucide-react';
import BackButton from '../components/BackButton';
import ImageCarousel from '../components/ImageCarousel';
import FresqueMap from '../components/FresqueMap';
import { isPublished } from '../data/defaultData';

export default function FresquesPage() {
  const { data } = useSiteData();
  const navigate = useNavigate();
  const fresques = data.artworks.filter(a => a.category === 'fresque' && isPublished(a));
  // Carte de toutes les fresques ; l'icône de lieu d'une fresque l'ouvre centrée sur elle
  const [showMap, setShowMap] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const openMap = (id: string | null) => {
    setShowMap(true);
    setFocusId(id);
    requestAnimationFrame(() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const openFresque = useCallback((id: string) => navigate(`/fresques/${id}`), [navigate]);
  // Depuis la page d'une fresque : /fresques?carte=<id>
  const [params] = useSearchParams();
  const fromDetail = params.get('carte');
  useEffect(() => { if (fromDetail) openMap(fromDetail); }, [fromDetail]);

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Fresques</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>
          {fresques.length} œuvres murales
        </p>
        <button className="fresque-map-toggle" onClick={() => (showMap ? setShowMap(false) : openMap(null))}>
          <MapPin size={14} /> {showMap ? 'Masquer la carte' : 'Voir sur la carte'}
        </button>
        <div ref={mapRef}>
          {showMap && <FresqueMap fresques={fresques} focusId={focusId} onOpen={openFresque} />}
        </div>

        {fresques.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fresques.map(fresque => (
              <div key={fresque.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => openFresque(fresque.id)}>
                {fresque.images?.length > 0 && (
                  <ImageCarousel images={fresque.images} alt={fresque.title} height="260px" zoom={false} />
                )}
                <div style={{ padding: '20px' }}>
                  <h3 className="artwork-title" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{fresque.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    <span>{fresque.year}</span>
                    {fresque.lieu && (
                      <button className="fresque-lieu" onClick={(e) => { e.stopPropagation(); openMap(fresque.id); }} aria-label={`Voir ${fresque.lieu} sur la carte`}>
                        <MapPin size={12} /> {fresque.lieu}
                      </button>
                    )}
                    {fresque.dimensions && <span>{fresque.dimensions}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">Fresques à venir</div>
            <div className="empty-state-desc">Les œuvres murales seront bientôt présentées ici.</div>
          </div>
        )}

        {/* CTA devis */}
        <button className="btn btn-primary btn-block" style={{ marginTop: '32px', padding: '14px', fontSize: '0.82rem' }}
          onClick={() => navigate('/contact?type=quote')}>
          Demander un devis
        </button>
      </div>

    </div>
  );
}
