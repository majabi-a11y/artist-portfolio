import { useParams, useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { formatPrice, isPublished } from '../data/defaultData';
import { ArrowLeft, Share2, MapPin } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';
import { useState } from 'react';

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useSiteData();
  const artwork = data.artworks.find((a) => a.id === id && isPublished(a));
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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

  const handleShare = async () => {
    const shareData = {
      title: artwork.title,
      text: `${artwork.title} — ${artwork.technique}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Could show a toast here
      }
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="page" id="artwork-detail-page">
      {/* Hero Image(s) */}
      <div className="detail-hero">
        <button className="detail-back" onClick={() => navigate(-1)} id="detail-back-btn">
          <ArrowLeft size={20} />
        </button>

        {artwork.images?.length ? (
          <div className="detail-gallery">
            {artwork.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${artwork.title} ${i + 1}`}
                className="detail-artwork"
                onClick={() => setViewerIndex(i)}
              />
            ))}
          </div>
        ) : (
          <div className="detail-image artwork-placeholder"
               style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            {artwork.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        <div className="detail-header">
          <div>
            <h1 className="artwork-title detail-artwork-title">{artwork.title}</h1>
            <p className="detail-caption">
              {[artwork.technique, artwork.dimensions, artwork.year].filter(Boolean).join(' · ')}
            </p>
            {artwork.signature && <p className="detail-signature">{artwork.signature}</p>}
          </div>
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--color-dark-card)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
            onClick={handleShare}
            id="share-btn"
            aria-label="Partager"
          >
            <Share2 size={18} />
          </button>
        </div>

        <p className={`detail-price ${artwork.status === 'sold' ? 'is-sold' : ''}`}>
          {artwork.status === 'sold' ? 'Vendue' : artwork.price ? formatPrice(artwork.price) : statusLabels[artwork.status]}
        </p>

        {artwork.exhibition && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--color-accent-subtle)',
            marginTop: '8px',
            fontSize: '0.85rem',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent-muted)',
          }}>
            <MapPin size={16} />
            {artwork.exhibition}
          </div>
        )}

        {/* Description */}
        {artwork.description && <p className="detail-description">{artwork.description}</p>}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {artwork.status === 'available' && (
            <button className="btn btn-primary btn-block" id="contact-btn"
              onClick={() => navigate(`/contact?type=buy&title=${encodeURIComponent(artwork.title)}&image=${encodeURIComponent(artwork.images?.[0] || '')}&price=${encodeURIComponent(artwork.price || '')}`)}>
              Commander
            </button>
          )}
          <button className="btn btn-outline btn-block" id="inquiry-btn"
            onClick={() => navigate(`/contact?type=free`)}>
            Demande d'information
          </button>
        </div>
      </div>

      {viewerIndex !== null && artwork.images?.length > 0 && (
        <ImageViewer images={artwork.images} startIndex={viewerIndex} alt={artwork.title} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
