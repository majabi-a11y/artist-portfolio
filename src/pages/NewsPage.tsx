import { useSiteData } from '../contexts/SiteDataContext';
import BackButton from '../components/BackButton';
import ImageCarousel from '../components/ImageCarousel';

export default function NewsPage() {
  const { data } = useSiteData();
  const news = data.news || [];

  const formatDate = (d: string) => {
    if (/^\d{4}$/.test(d.trim())) return d.trim(); // année seule
    try { return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  const categoryLabels: Record<string, string> = {
    exhibition: 'Exposition', press: 'Presse', event: 'Événement', studio: 'Atelier',
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        <h1 className="page-title" style={{ marginBottom: '8px' }}>Journal</h1>
        <p className="page-subtitle" style={{ marginBottom: '32px' }}>
          Actualités & nouveautés
        </p>

        {news.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {news.map(post => {
              // Support both old (image) and new (images) format
              const imgs = post.images?.length ? post.images : ((post as any).image ? [(post as any).image] : []);
              return (
                <article key={post.id} className="card" style={{ overflow: 'hidden' }}>
                  {imgs.length > 0 && (
                    <ImageCarousel images={imgs} alt={post.title} height="280px" />
                  )}
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.15em',
                        color: 'var(--color-accent)', fontWeight: 500,
                      }}>
                        {categoryLabels[post.category] || post.category}
                      </span>
                      <span style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)' }}>
                        {formatDate(post.date)}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3 }}>
                      {post.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', whiteSpace: 'pre-line' }}>
                      {post.content}
                    </p>
                    {post.link && (
                      <a href={post.link} className="news-link" {...(post.link.endsWith('.pdf') ? { download: true } : { target: '_blank', rel: 'noopener noreferrer' })}>
                        {post.linkLabel || 'En savoir plus'} →
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">Aucune actualité</div>
            <div className="empty-state-desc">Les nouvelles seront publiées ici.</div>
          </div>
        )}
      </div>
    </div>
  );
}
