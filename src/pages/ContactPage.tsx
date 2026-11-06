import { useSiteData } from '../contexts/SiteDataContext';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import ContactForm, { type ContactSubject } from '../components/ContactForm';
import { contactHref, whatsappLink } from '../data/defaultData';

export default function ContactPage() {
  const { data } = useSiteData();
  const { profile } = data;
  const coordonnees = profile.contact || [];
  const [searchParams] = useSearchParams();

  // Build preset from URL params
  const getPreset = (): ContactSubject | undefined => {
    const type = searchParams.get('type');
    if (type === 'buy') return { type: 'buy', artworkTitle: searchParams.get('title') || '' };
    if (type === 'quote') return { type: 'quote', fresqueTitle: searchParams.get('title') || '' };
    if (type === 'collaboration') return { type: 'collaboration' };
    return { type: 'free' };
  };

  const whatsappMessage = () => {
    const type = searchParams.get('type');
    const title = searchParams.get('title');
    if (type === 'buy' && title) return `Bonjour Adrien, je suis intéressé(e) par l'œuvre « ${title} ».`;
    if (type === 'quote') return title ? `Bonjour Adrien, je souhaite un devis pour une fresque, dans l'esprit de « ${title} ».` : 'Bonjour Adrien, je souhaite un devis pour une fresque.';
    return 'Bonjour Adrien, ';
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
        {coordonnees.length > 0 && (
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--color-accent)', marginBottom: '16px' }}>
              Liens & Coordonnées
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {coordonnees.map((item, i) => {
                const message = whatsappMessage();
                const base = contactHref(item.label, item.value);
                const href = /atelier/i.test(item.label) ? null
                  : base.startsWith('mailto:') ? '#ecrire'
                  : /whatsapp/i.test(item.label) && data.whatsapp ? whatsappLink(data.whatsapp, message)
                  : base;
                const isExternal = !!href && href.startsWith('http');
                if (!href) {
                  return (
                    <div key={i} className="contact-line">
                      <span className="contact-line-label">{item.label}</span>
                      <span className="contact-line-value">{item.value}</span>
                    </div>
                  );
                }

                return (
                  <a key={i} href={href}
                    target={isExternal ? '_blank' : undefined} rel="noopener noreferrer"
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: i < coordonnees.length - 1 ? '1px solid rgba(var(--ink-rgb), 0.06)' : 'none',
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
              </div>
            </div>
          )}

          <div id="ecrire" />
          <ContactForm preset={getPreset()} contactEmail={data.contactEmail || 'adrien.enaer@gmail.com'} />
        </div>
      </div>
    </div>
  );
}
