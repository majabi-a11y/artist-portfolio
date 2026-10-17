import { useSiteData } from '../contexts/SiteDataContext';
import { contactHref } from '../data/defaultData';
import BackButton from '../components/BackButton';

/** Profil, comme une page de son catalogue : le portrait entier, puis le texte, rien par-dessus l'image. */
export default function ProfilePage() {
  const { data } = useSiteData();
  const { profile } = data;
  const bio = (profile.bio || []).filter(p => p.trim());

  return (
    <div className="page-wrapper">
      <div className="page-content profile" style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        <BackButton />

        {profile.heroBanner && (
          <figure className="profile-portrait">
            <img src={profile.heroBanner} alt={profile.name} />
          </figure>
        )}

        <header className="profile-head">
          <h1 className="artwork-title">{profile.name}</h1>
          <p className="profile-tagline">{profile.tagline}</p>
        </header>

        {bio.length > 0 && (
          <section className="profile-section">
            <h2 className="profile-label">Biographie</h2>
            {bio.map((p, i) => <p key={i} className="profile-text">{p}</p>)}
          </section>
        )}

        {(profile.cvSections || []).length > 0 && (
          <section className="profile-section">
            <h2 className="profile-label">Parcours</h2>
            {profile.cvSections.map((section, si) => (
              <div key={si} className="profile-year">
                <h3 className="artwork-title">{section.title}</h3>
                <ul>
                  {section.items.map((item, ii) => <li key={ii}>{item}</li>)}
                </ul>
              </div>
            ))}
          </section>
        )}

        {(profile.galleryImages || []).length > 0 && (
          <section className="profile-section">
            <h2 className="profile-label">Galerie</h2>
            <div className="profile-gallery">
              {profile.galleryImages.map((img, i) => <img key={i} src={img} alt="" loading="lazy" />)}
            </div>
          </section>
        )}

        {profile.contact?.length > 0 && (
          <section className="profile-section">
            <h2 className="profile-label">Contact</h2>
            <dl className="profile-contact">
              {profile.contact.map((c, i) => (
                <div key={i}>
                  <dt>{c.label}</dt>
                  <dd>
                    {c.label.toLowerCase() === 'atelier'
                      ? c.value
                      : <a href={contactHref(c.label, c.value)} target={contactHref(c.label, c.value).startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{c.value}</a>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
