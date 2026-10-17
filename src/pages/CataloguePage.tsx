import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import type { Artwork } from '../data/defaultData';
import { thumb, formatPrice, CATALOGUE_PDF, isPublished, SERIES } from '../data/defaultData';
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
  // Planches : toutes les œuvres, par série (de la plus ancienne à la plus récente) ou par année
  const [view, setView] = useState<'toutes' | 'serie' | 'annee'>('serie');

  const storeArtworks = useMemo(() => data.artworks.filter(a => a.category !== 'fresque' && isPublished(a)), [data.artworks]);

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

  const groups = useMemo(() => {
    type Group = { key: string; title: string; meta: string; text?: string; works: Artwork[] };
    const span = (ws: Artwork[]) => {
      const ys = ws.map(w => w.year).filter((y): y is number => !!y);
      if (!ys.length) return '';
      const lo = Math.min(...ys), hi = Math.max(...ys);
      return lo === hi ? String(lo) : `${lo} – ${hi}`;
    };
    const count = (n: number) => `${n} œuvre${n > 1 ? 's' : ''}`;
    const byYear = (a: Artwork, b: Artwork) => (a.year ?? 0) - (b.year ?? 0);
    if (view === 'toutes') return [{ key: 'toutes', title: '', meta: '', works: filtered }] as Group[];
    if (view === 'annee') {
      const years = [...new Set(filtered.map(w => w.year ?? 0))].sort((a, b) => a - b);
      return years.map(y => {
        const works = filtered.filter(w => (w.year ?? 0) === y);
        const names = [...new Set(works.map(w => SERIES.find(x => x.id === w.serie)?.titre).filter(Boolean))];
        return { key: String(y), title: y ? String(y) : 'Sans date', meta: [count(works.length), names.join(', ')].filter(Boolean).join(' · '), works };
      }) as Group[];
    }
    const out: Group[] = [];
    for (const serie of SERIES) {
      const works = filtered.filter(w => w.serie === serie.id).sort(byYear);
      if (works.length) out.push({ key: serie.id, title: serie.titre, meta: [span(works), count(works.length)].filter(Boolean).join(' · '), text: serie.texte, works });
    }
    const autres = filtered.filter(w => !w.serie || !SERIES.some(x => x.id === w.serie)).sort(byYear);
    if (autres.length) out.push({ key: 'autres', title: 'Autres œuvres', meta: [span(autres), count(autres.length)].filter(Boolean).join(' · '), works: autres });
    return out;
  }, [filtered, view]);

  const renderWork = (artwork: Artwork) => (
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
  );

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

      <div className="catalogue-views" role="tablist" aria-label="Présentation">
        {([['serie', 'Par série'], ['annee', 'Par année'], ['toutes', 'Toutes']] as const).map(([v, label]) => (
          <button key={v} role="tab" aria-selected={view === v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>{label}</button>
        ))}
      </div>

      {groups.map(g => (
        <section key={g.key} className="plate">
          {g.title && (
            <header className="plate-head">
              <h2 className="artwork-title">{g.title}</h2>
              <p className="plate-meta">{g.meta}</p>
              {g.text && <p className="plate-text">{g.text}</p>}
            </header>
          )}
          <div className="gallery-grid">{g.works.map(renderWork)}</div>
        </section>
      ))}

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
