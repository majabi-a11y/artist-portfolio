import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import type { Artwork } from '../data/defaultData';
import { Search } from 'lucide-react';

const categories = ['Tout', 'toile', 'fresque', 'graphisme', 'serigraphie', 'objets'];
const categoryLabels: Record<string, string> = {
  Tout: 'Tout',
  toile: 'Toiles',
  fresque: 'Fresques',
  graphisme: 'Graphisme',
  serigraphie: 'Sérigraphies',
  objets: 'Objets',
};

const artworkImages: Record<string, string> = {
  '1': '/artwork-1.png',
  '3': '/artwork-3.png',
  '4': '/artwork-4.png',
};

export default function CataloguePage() {
  const navigate = useNavigate();
  const { data } = useSiteData();
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = data.artworks.filter((artwork: Artwork) => {
    const matchesCategory = activeCategory === 'Tout' || artwork.category === activeCategory;
    const matchesSearch = !searchQuery ||
      artwork.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artwork.technique.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page" id="catalogue-page">
      <div className="page-header">
        <h1>Catalogue</h1>
        <p>{data.artworks.length} œuvres</p>
      </div>

      <div style={{ padding: '0 24px 20px' }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          marginBottom: '14px',
        }}>
          <Search size={15} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="catalogue-search"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              flex: 1,
              fontSize: '0.82rem',
              color: 'var(--color-white)',
              fontWeight: 300,
              letterSpacing: '0.02em',
            }}
          />
        </div>

        {/* Category filters */}
        <div className="filter-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              id={`chip-${cat}`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '14px' }}>
          <span style={{
            fontSize: '0.6rem',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 400,
          }}>
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Editorial feed layout */}
      <div className="artwork-feed stagger-children">
        {filtered.map((artwork) => (
          <div
            key={artwork.id}
            className="artwork-feed-item"
            onClick={() => navigate(`/catalogue/${artwork.id}`)}
            id={`artwork-card-${artwork.id}`}
          >
            {artwork.images?.[0] || artworkImages[artwork.id] ? (
              <img
                src={artwork.images?.[0] || artworkImages[artwork.id]}
                alt={artwork.title}
                className="artwork-image"
              />
            ) : (
              <div className={`artwork-image artwork-placeholder variant-${(parseInt(artwork.id) % 4) + 1}`}>
                {artwork.title.charAt(0)}
              </div>
            )}
            <div className="artwork-caption">
              <div>
                <div className="artwork-title">{artwork.title}</div>
                <div className="artwork-meta" style={{ marginTop: '2px' }}>
                  {artwork.technique.split('—')[0].trim()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="artwork-meta">{artwork.year}</div>
                {artwork.price && (
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 400,
                    marginTop: '2px',
                    color: 'var(--color-accent)',
                    fontFamily: 'var(--font-body)',
                  }}>
                    {artwork.price}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
