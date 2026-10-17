import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import type { Artwork } from '../data/defaultData';
import { thumb, formatPrice, CATALOGUE_PDF } from '../data/defaultData';
import BackButton from '../components/BackButton';
import { Search, Download } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  toile: 'Toiles',
  papier: 'Papiers',
  serigraphie: 'Sérigraphies',
  graphisme: 'Graphisme',
  objets: 'Objets',
};

export default function CataloguePage() {
  const navigate = useNavigate();
  const { data } = useSiteData();
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState('');

  const storeArtworks = useMemo(() => data.artworks.filter(a => a.category !== 'fresque'), [data.artworks]);

  // Seules les catégories présentes au catalogue deviennent des filtres.
  const categories = useMemo(() => {
    const present = new Set(storeArtworks.map(a => a.category));
    return ['Tout', ...Object.keys(categoryLabels).filter(c => present.has(c as Artwork['category']))];
  }, [storeArtworks]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return storeArtworks.filter((artwork: Artwork) => {
      const matchesCategory = activeCategory === 'Tout' || artwork.category === activeCategory;
      const matchesSearch = !q ||
        artwork.title.toLowerCase().includes(q) ||
        artwork.technique.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [storeArtworks, activeCategory, searchQuery]);

  return (
    <div className="page" id="catalogue-page">
      <div className="page-header">
        <BackButton />
        <h1>Catalogue</h1>
        <p>{storeArtworks.length} œuvres · 2026</p>
      </div>

      <div className="catalogue-tools">
        <a className="catalogue-pdf" href={CATALOGUE_PDF} download>
          <Download size={14} strokeWidth={1.5} />
          Catalogue PDF
        </a>

        <div className="catalogue-search">
          <Search size={15} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Rechercher une œuvre, une technique…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="catalogue-search"
          />
        </div>

        {categories.length > 2 && (
          <div className="filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                id={`chip-${cat}`}
              >
                {cat === 'Tout' ? 'Tout' : categoryLabels[cat]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="gallery-grid">
        {filtered.map((artwork) => (
          <button
            key={artwork.id}
            className="gallery-item"
            onClick={() => navigate(`/catalogue/${artwork.id}`)}
            id={`artwork-card-${artwork.id}`}
          >
            <div className="gallery-frame">
              {artwork.images?.[0] ? (
                <img src={thumb(artwork.images[0])} alt={artwork.title} loading="lazy" />
              ) : (
                <span className="gallery-empty">{artwork.title.charAt(0)}</span>
              )}
            </div>
            <div className="gallery-caption">
              <span className="artwork-title">{artwork.title}</span>
              <span className="gallery-meta">
                {[artwork.dimensions, artwork.year].filter(Boolean).join(' · ')}
              </span>
              <span className={`gallery-price ${artwork.status === 'sold' ? 'is-sold' : ''}`}>
                {artwork.status === 'sold' ? 'Vendue' : artwork.price ? formatPrice(artwork.price) : ''}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-title">Aucun résultat</div>
          <div className="empty-state-desc">
            Essayez une autre recherche ou modifiez les filtres.
          </div>
        </div>
      )}
    </div>
  );
}
