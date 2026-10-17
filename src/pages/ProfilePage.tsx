import { useSiteData } from '../contexts/SiteDataContext';
import BackButton from '../components/BackButton';

export default function ProfilePage() {
  const { data } = useSiteData();
  const { profile } = data;

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />
        {/* Hero */}
        {profile.heroBanner && (
          <div style={{ margin: '-80px -24px 32px', height: '300px', position: 'relative' }}>
            <img src={profile.heroBanner} alt={profile.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(0deg, var(--color-black) 0%, transparent 60%)',
            }} />
            <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
              <h1 className="page-title" style={{ fontSize: '2.4rem' }}>{profile.name}</h1>
              <p className="page-subtitle" style={{ marginTop: '6px' }}>
                {profile.tagline}
              </p>
            </div>
          </div>
        )}

        {!profile.heroBanner && (
          <>
            <h1 className="page-title" style={{ marginBottom: '6px' }}>{profile.name}</h1>
            <p className="page-subtitle" style={{ marginBottom: '32px' }}>
              {profile.tagline}
            </p>
          </>
        )}

        {/* Bio */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-white)', marginBottom: '16px' }}>
            Biographie
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(profile.bio || []).map((p, i) => (
              <p key={i} style={{ fontSize: '0.78rem', lineHeight: 1.8, color: 'var(--color-text-secondary)', fontWeight: 300 }}>
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Stats */}
        {profile.stats?.length > 0 && (
          <section style={{ marginBottom: '40px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
            {profile.stats.map((s, i) => (
              <div key={i} style={{ background: 'var(--color-surface)', padding: '20px 16px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-white)', marginBottom: '4px' }}>{s.value}</div>
                <div style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* CV Sections */}
        {(profile.cvSections || []).length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-white)', marginBottom: '20px' }}>
              Parcours
            </h2>
            {(profile.cvSections || []).map((section, si) => (
              <div key={si} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '10px' }}>
                  {section.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.items.map((item, ii) => (
                    <div key={ii} style={{
                      fontSize: '0.72rem', color: 'var(--color-text-secondary)',
                      paddingLeft: '12px', borderLeft: '2px solid rgba(255,255,255,0.06)',
                      lineHeight: 1.5, fontWeight: 300,
                    }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Technique */}
        {profile.technique?.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-white)', marginBottom: '16px' }}>
              Technique
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profile.technique.map((t, i) => (
                <div key={i} style={{ background: 'var(--color-dark-card)', border: '1px solid rgba(255,255,255,0.04)', padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-accent)', marginBottom: '4px', letterSpacing: '0.05em' }}>{t.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 300, lineHeight: 1.5 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {(profile.galleryImages || []).length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-white)', marginBottom: '16px' }}>
              Galerie
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3px' }}>
              {profile.galleryImages.map((img, i) => (
                <div key={i} style={{ aspectRatio: '1', overflow: 'hidden' }}>
                  <img src={img} alt={`Galerie ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact info */}
        {profile.contact?.length > 0 && (
          <section>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.2rem', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-white)', marginBottom: '16px' }}>
              Contact
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profile.contact.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{c.label}</span>
                  <span style={{ color: 'var(--color-text-secondary)', fontWeight: 300 }}>{c.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
