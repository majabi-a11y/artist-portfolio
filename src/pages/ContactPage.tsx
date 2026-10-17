import { useSiteData } from '../contexts/SiteDataContext';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import ContactForm, { type ContactSubject } from '../components/ContactForm';

export default function ContactPage() {
  const { data } = useSiteData();
  const { profile } = data;
  const [searchParams] = useSearchParams();

  // Build preset from URL params
  const getPreset = (): ContactSubject | undefined => {
    const type = searchParams.get('type');
    if (type === 'buy') return { type: 'buy', artworkTitle: searchParams.get('title') || '' };
    if (type === 'quote') return { type: 'quote', fresqueTitle: searchParams.get('title') || '' };
    if (type === 'collaboration') return { type: 'collaboration' };
    return { type: 'free' };
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        <h1 className="page-title" style={{ marginBottom: '32px' }}>Contact</h1>

        {/* Artist card */}
        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>{profile.name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{profile.tagline}</p>
        </div>

        {/* Contact details */}
        {profile.contact && profile.contact.length > 0 && (
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--color-accent)', marginBottom: '16px' }}>
              Liens & Coordonnées
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {profile.contact.map((item, i) => {
                const href = item.value.includes('@') ? `mailto:${item.value}` :
                  item.value.startsWith('http') ? item.value :
                  item.value.startsWith('+') ? `tel:${item.value}` :
                  `https://${item.value}`;
                const isExternal = item.value.startsWith('http') || 
                  (!item.value.includes('@') && !item.value.startsWith('+'));

                return (
                  <a key={i} href={href}
                    target={isExternal ? '_blank' : undefined} rel="noopener noreferrer"
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: i < profile.contact.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      textDecoration: 'none', color: 'inherit', transition: 'opacity 0.2s',
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.value}
                      <ArrowUpRight size={14} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact form */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--color-accent)', marginBottom: '20px' }}>
            Écrire un message
          </h3>

          {/* Artwork preview when ordering */}
          {searchParams.get('type') === 'buy' && searchParams.get('image') && (
            <div style={{
              display: 'flex', gap: '14px', alignItems: 'center',
              padding: '12px', marginBottom: '20px',
              background: 'var(--color-dark-card)', borderRadius: '8px',
              border: '1px solid var(--color-dark-border)',
            }}>
              <img
                src={decodeURIComponent(searchParams.get('image') || '')}
                alt={searchParams.get('title') || ''}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
              />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text)' }}>
                  {searchParams.get('title')}
                </div>
                {searchParams.get('price') && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-accent)', marginTop: '4px' }}>
                    {searchParams.get('price')} € TTC
                  </div>
                )}
              </div>
            </div>
          )}

          <ContactForm preset={getPreset()} contactEmail={data.contactEmail || 'adrien.enaer@gmail.com'} />
        </div>
      </div>
    </div>
  );
}
