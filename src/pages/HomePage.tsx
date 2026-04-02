import { useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { ArrowRight } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const artworkImages: Record<string, string> = {
  '1': '/artwork-1.png',
  '3': '/artwork-3.png',
  '4': '/artwork-4.png',
};

const categoryLabels: Record<string, string> = {
  exhibition: 'Exposition',
  press: 'Presse',
  event: 'Événement',
  studio: 'Atelier',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data } = useSiteData();
  const { profile, artworks, news, exhibitions, press } = data;

  const featured = artworks.filter((a) => a.isFeatured).slice(0, 4);
  const catalogueRef = useScrollReveal();
  const journalRef = useScrollReveal();
  const portfolioRef = useScrollReveal();
  const expoRef = useScrollReveal();
  const pressRef = useScrollReveal();
  const contactRef = useScrollReveal();

  return (
    <div className="page" id="home-page">

      {/* ═══════ SECTION 1: HERO ═══════ */}
      <section className="hero-section section" id="hero">
        {/* Banner image */}
        {profile.heroBanner && (
          <img src={profile.heroBanner} alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', opacity: 0.35,
          }} />
        )}
        {!profile.heroBanner && (
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.02,
          }}>
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: 0, top: `${i * 14}px`,
                height: '3px', background: 'white', borderRadius: '1.5px',
                transform: `translateX(${Math.sin(i * 0.35) * 30}px)`,
                opacity: 0.25 + (i % 5) * 0.15, width: `${15 + (i % 11) * 7}%`,
              }} />
            ))}
          </div>
        )}

        <div className="hero-content">
          <div className="hero-overline">
            {profile.tagline}
          </div>
          <h1>{profile.name.split(' ').slice(0, -1).join(' ')}<br />{profile.name.split(' ').slice(-1)}</h1>
          <p style={{ marginTop: '16px' }}>
            {profile.techniqueTitle}
          </p>
          <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
            <button
              className="text-link-accent"
              onClick={() => navigate('/filter')}
              style={{ fontSize: '0.7rem' }}
            >
              Essayer le filtre
            </button>
            <button
              className="text-link"
              onClick={() => {
                document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontSize: '0.7rem' }}
            >
              Voir les œuvres
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ SECTION 2: CATALOGUE / SÉLECTION ═══════ */}
      <section className="section" id="catalogue" ref={catalogueRef} style={{ paddingTop: '64px' }}>
        <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <span className="section-label reveal" style={{ margin: 0 }}>Sélection</span>
          <button
            onClick={() => navigate('/catalogue')}
            className="text-link reveal"
          >
            Tout le catalogue
          </button>
        </div>

        <div className="artwork-feed">
          {featured.map((artwork) => (
            <div
              key={artwork.id}
              className="artwork-feed-item reveal"
              onClick={() => navigate(`/catalogue/${artwork.id}`)}
              id={`featured-artwork-${artwork.id}`}
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
                    <div style={{ fontSize: '0.7rem', fontWeight: 400, marginTop: '2px', color: 'var(--color-accent)' }}>
                      {artwork.price}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════ SECTION 3: JOURNAL ═══════ */}
      <section className="section" id="journal" ref={journalRef} style={{ padding: '64px 24px' }}>
        <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="section-label" style={{ margin: 0 }}>Journal</span>
        </div>

        {news.map((post) => (
          <div key={post.id} className="news-item reveal">
            <div className="news-overline">
              <span className={`news-dot ${post.category}`} />
              {categoryLabels[post.category]}
            </div>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <div className="news-date">{formatDate(post.date)}</div>
          </div>
        ))}
      </section>

      <div className="section-divider" />

      {/* ═══════ SECTION 4: PORTFOLIO ═══════ */}
      <section className="section" id="portfolio">

        {/* Bio — light section */}
        <div className="section-light" ref={portfolioRef}>
          <span className="section-label reveal" style={{ marginBottom: '20px', display: 'block' }}>Biographie</span>
          {profile.bio.map((para, i) => (
            <p key={i} className="reveal" style={{ fontSize: '0.92rem', lineHeight: 2, marginBottom: '20px' }}>
              {i === 0 ? <>{para.split('trame matricielle horizontale')[0]}<em>trame matricielle horizontale</em>{para.split('trame matricielle horizontale')[1] || ''}</> : para}
            </p>
          ))}
        </div>

        <div className="section-divider" />

        {/* Expositions */}
        <div style={{ padding: '56px 24px' }} ref={pressRef}>
          <span className="section-label reveal">Expositions sélectionnées</span>
          {exhibitions.map((exh, i) => (
            <div key={i} className="reveal" style={{
              display: 'flex',
              gap: '14px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              alignItems: 'baseline',
            }}>
              <span style={{
                fontSize: '0.62rem',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.04em',
                minWidth: '32px',
                fontWeight: 300,
              }}>
                {exh.year}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.92rem',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  marginBottom: '1px',
                  letterSpacing: '-0.01em',
                }}>
                  {exh.title}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 300,
                }}>
                  {exh.venue}
                </div>
              </div>
              <span style={{
                fontSize: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-accent-muted)',
                fontWeight: 500,
              }}>
                {exh.type}
              </span>
            </div>
          ))}
        </div>

        {/* Press — light section */}
        <div className="section-light" ref={contactRef}>
          <span className="section-label reveal" style={{ marginBottom: '28px', display: 'block' }}>Presse</span>
          {press.map((item, i) => {
            const Wrapper = item.link ? 'a' : 'div';
            const linkProps = item.link ? { href: item.link, target: '_blank', rel: 'noopener noreferrer' } : {};
            return (
              <Wrapper key={i} {...linkProps} className="reveal" style={{
                display: 'block',
                paddingBottom: i < press.length - 1 ? '24px' : '0',
                marginBottom: i < press.length - 1 ? '24px' : '0',
                borderBottom: i < press.length - 1 ? '1px solid rgba(10,10,10,0.05)' : 'none',
                textDecoration: 'none',
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--color-black)',
                  marginBottom: '6px',
                  letterSpacing: '-0.02em',
                }}>
                  {item.title}
                  {item.link && <span style={{ fontSize: '0.6rem', marginLeft: '6px', opacity: 0.3 }}>↗</span>}
                </div>
                <p style={{
                  fontSize: '0.82rem',
                  color: 'rgba(10,10,10,0.4)',
                  fontStyle: 'italic',
                  lineHeight: 1.7,
                }}>
                  {item.excerpt}
                </p>
              </Wrapper>
            );
          })}
        </div>

        {/* Contact */}
        <div style={{ padding: '56px 24px 80px' }}>
          <span className="section-label">Contact</span>
          {profile.contact.map((item, i) => (
            <a key={i} href="#" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              fontSize: '0.82rem',
              color: 'var(--color-text-secondary)',
              fontWeight: 300,
              transition: 'color 0.25s',
            }}>
              <span style={{
                fontSize: '0.55rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--color-text-muted)',
                fontWeight: 500,
                minWidth: '76px',
              }}>
                {item.label}
              </span>
              <span>{item.value}</span>
              <ArrowRight size={12} style={{ color: 'var(--color-text-muted)' }} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
