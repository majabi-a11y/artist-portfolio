import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { MapPin } from 'lucide-react';
import BackButton from '../components/BackButton';
import ImageCarousel from '../components/ImageCarousel';
import { isPublished } from '../data/defaultData';

export default function FresquesPage() {
  const { data } = useSiteData();
  const navigate = useNavigate();
  const fresques = data.artworks.filter(a => a.category === 'fresque' && isPublished(a));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = fresques.find(f => f.id === selectedId);

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Fresques</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>
          {fresques.length} œuvres murales
        </p>

        {fresques.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fresques.map(fresque => (
              <div key={fresque.id} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setSelectedId(fresque.id)}>
                {fresque.images?.length > 0 && (
                  <ImageCarousel images={fresque.images} alt={fresque.title} height="260px" />
                )}
                <div style={{ padding: '20px' }}>
                  <h3 className="artwork-title" style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{fresque.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    <span>{fresque.year}</span>
                    {fresque.lieu && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {fresque.lieu}
                      </span>
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

      {/* Detail overlay */}
      {selected && (
        <div className="detail-overlay" onClick={() => setSelectedId(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedId(null)} aria-label="Fermer">✕</button>
            {selected.images?.length > 0 && (
              <ImageCarousel images={selected.images} alt={selected.title} height="320px" fit="contain" />
            )}
            <div className="detail-body">
              <h2 className="detail-title artwork-title">{selected.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                <span>{selected.year}</span>
                {selected.lieu && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {selected.lieu}
                  </span>
                )}
                {selected.dimensions && <span>{selected.dimensions}</span>}
              </div>
              <p className="detail-desc">{selected.description}</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}
                onClick={() => navigate(`/contact?type=quote&title=${encodeURIComponent(selected.title)}`)}>
                Demander un devis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
