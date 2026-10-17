import { useState } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { Palette } from 'lucide-react';
import BackButton from '../components/BackButton';
import ImageCarousel from '../components/ImageCarousel';

export default function PortfolioPage() {
  const { data } = useSiteData();
  const portfolio = data.portfolio || [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = portfolio.find(p => p.id === selectedId);

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Atelier</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>
          L'univers créatif
        </p>

        {portfolio.length > 0 ? (
          <div className="carousel-container">
            <div className="carousel-track">
              {portfolio.map((item) => {
                const imgs = item.images || ((item as any).image ? [(item as any).image] : []);
                return (
                  <div key={item.id} className="carousel-slide" onClick={() => setSelectedId(prev => prev === item.id ? null : item.id)}>
                    {imgs.length > 0 ? (
                      <ImageCarousel images={imgs} alt={item.title} height="100%" />
                    ) : (
                      <div className="carousel-placeholder">
                        <span>{item.title}</span>
                      </div>
                    )}
                    <div className="carousel-slide-info">
                      <p className="carousel-slide-title">{item.title}</p>
                      {item.category && (
                        <span className="carousel-slide-tag">{item.category}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Palette size={48} className="empty-state-icon" />
            <div className="empty-state-title">Contenu à venir</div>
            <div className="empty-state-desc">
              Les projets de l'atelier seront bientôt disponibles ici.
            </div>
          </div>
        )}
      </div>

      {/* Detail overlay with full description */}
      {selected && (
        <div className="detail-overlay" onClick={() => setSelectedId(null)}>
          <div className="detail-card" onClick={e => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedId(null)} aria-label="Fermer">✕</button>
            {(() => {
              const imgs = selected.images || ((selected as any).image ? [(selected as any).image] : []);
              return imgs.length > 0 ? (
                <ImageCarousel images={imgs} alt={selected.title} height="280px" />
              ) : null;
            })()}
            <div className="detail-body">
              {selected.category && (
                <span className="detail-tag">{selected.category}</span>
              )}
              <h2 className="detail-title">{selected.title}</h2>
              <p className="detail-desc">{selected.description}</p>
              {selected.link && (
                <a href={selected.link} target="_blank" rel="noopener noreferrer" className="detail-link">
                  Voir le projet →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
