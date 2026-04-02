import { useParams, useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { ArrowLeft, Share2, MapPin } from 'lucide-react';

const artworkImages: Record<string, string> = {
  '1': '/artwork-1.png',
  '3': '/artwork-3.png',
  '4': '/artwork-4.png',
};

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useSiteData();
  const artwork = data.artworks.find((a) => a.id === id);

  if (!artwork) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Œuvre introuvable</h2>
          <button className="btn btn-primary" onClick={() => navigate('/catalogue')} style={{ marginTop: '16px' }}>
            Retour au catalogue
          </button>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    sold: 'Vendu',
    exhibition: 'En exposition',
    private: 'Collection privée',
  };

  return (
    <div className="page" id="artwork-detail-page">
      {/* Hero Image(s) */}
      <div className="detail-hero">
        <button className="detail-back" onClick={() => navigate(-1)} id="detail-back-btn">
          <ArrowLeft size={20} />
        </button>

        {(artwork.images?.length || artworkImages[artwork.id]) ? (
          <div style={{ overflowX: artwork.images?.length > 1 ? 'auto' : 'hidden', display: 'flex', scrollSnapType: 'x mandatory' }}>
            {(artwork.images?.length ? artwork.images : [artworkImages[artwork.id]]).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${artwork.title} ${i + 1}`}
                className="detail-image"
                style={{ scrollSnapAlign: 'start', minWidth: '100%', flexShrink: 0 }}
              />
            ))}
          </div>
        ) : (
          <div className={`detail-image artwork-placeholder variant-${(parseInt(artwork.id) % 4) + 1}`}
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            {artwork.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        <div className="detail-header">
          <div>
            <h1 className="detail-title">{artwork.title}</h1>
            <span className="detail-year">{artwork.year}</span>
          </div>
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-dark-card)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
            }}
            id="share-btn"
          >
            <Share2 size={18} />
          </button>
        </div>

        <span className={`badge badge-${artwork.status}`}>
          {statusLabels[artwork.status]}
        </span>

        {/* Details grid */}
        <div className="detail-info-grid" style={{ marginTop: '24px' }}>
          <div className="detail-info-item">
            <div className="detail-info-label">Technique</div>
            <div className="detail-info-value">{artwork.technique}</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">Dimensions</div>
            <div className="detail-info-value">{artwork.dimensions}</div>
          </div>
          <div className="detail-info-item">
            <div className="detail-info-label">Catégorie</div>
            <div className="detail-info-value" style={{ textTransform: 'capitalize' }}>{artwork.category}</div>
          </div>
          {artwork.price && (
            <div className="detail-info-item">
              <div className="detail-info-label">Prix</div>
              <div className="detail-info-value" style={{ color: 'var(--color-magenta)', fontWeight: 600 }}>
                {artwork.price}
              </div>
            </div>
          )}
        </div>

        {artwork.exhibition && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'rgba(139,92,246,0.1)',
            borderRadius: 'var(--radius-md)',
            marginTop: '8px',
            fontSize: '0.85rem',
            color: '#a78bfa',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <MapPin size={16} />
            {artwork.exhibition}
          </div>
        )}

        {/* Description */}
        <p className="detail-description">{artwork.description}</p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {artwork.status === 'available' && (
            <button className="btn btn-primary btn-block" id="contact-btn">
              Contacter pour achat
            </button>
          )}
          <button className="btn btn-outline btn-block" id="inquiry-btn">
            Demande d'information
          </button>
        </div>
      </div>
    </div>
  );
}
