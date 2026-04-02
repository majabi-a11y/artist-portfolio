import { useState, useRef } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import { Save, Plus, Trash2, Download, Upload, RotateCcw, ChevronDown, ChevronRight, Bell, Send } from 'lucide-react';
import type { Artwork, NewsPost, PortfolioItem } from '../data/defaultData';

type Section = 'profile' | 'artworks' | 'news' | 'exhibitions' | 'press' | 'portfolio' | 'notifications' | 'tools';

export default function AdminPage() {
  const {
    data, updateProfile,
    addArtwork, updateArtwork, deleteArtwork,
    addNews, updateNews, deleteNews,
    addExhibition, deleteExhibition,
    addPress, updatePress, deletePress,
    addPortfolio, updatePortfolio, deletePortfolio,
    exportData, importData, resetData,
  } = useSiteData();

  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [editingArtwork, setEditingArtwork] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<string | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const sections: { id: Section; label: string; count?: number }[] = [
    { id: 'profile', label: 'Profil' },
    { id: 'artworks', label: 'Catalogue', count: data.artworks.length },
    { id: 'news', label: 'Journal', count: data.news.length },
    { id: 'exhibitions', label: 'Expositions', count: data.exhibitions.length },
    { id: 'press', label: 'Presse', count: data.press.length },
    { id: 'portfolio', label: 'Portfolio', count: (data.portfolio || []).length },
    { id: 'notifications', label: 'Notifs' },
    { id: 'tools', label: 'Outils' },
  ];

  // ── Handlers ──
  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const success = importData(reader.result as string);
      alert(success ? 'Données importées !' : 'Erreur : fichier invalide');
    };
    reader.readAsText(file);
  };

  const handleAddArtwork = () => {
    const id = String(Date.now());
    const newArtwork: Artwork = {
      id,
      title: 'Nouvelle œuvre',
      year: new Date().getFullYear(),
      technique: '',
      dimensions: '',
      description: '',
      images: [],
      category: 'toile',
      isFeatured: false,
      status: 'available',
    };
    addArtwork(newArtwork);
    setEditingArtwork(id);
  };

  const handleAddNews = () => {
    const id = String(Date.now());
    const post: NewsPost = {
      id,
      title: 'Nouvelle actualité',
      date: new Date().toISOString().slice(0, 10),
      content: '',
      category: 'event',
    };
    addNews(post);
    setEditingNews(id);
  };

  // ── Password gate ──
  const ADMIN_PASSWORD = 'BabyLove';
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem('admin-auth') === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin-auth', 'true');
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 1500);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <form onSubmit={handleLogin} style={{ textAlign: 'center', width: '280px' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Admin</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Entrez le mot de passe pour accéder au panneau d'administration.
          </p>
          <input
            type="password"
            className="admin-input"
            placeholder="Mot de passe"
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
            style={{
              textAlign: 'center',
              marginBottom: '12px',
              borderColor: passwordError ? '#e53e3e' : undefined,
            }}
            autoFocus
          />
          {passwordError && (
            <p style={{ fontSize: '0.7rem', color: '#e53e3e', marginBottom: '8px' }}>Mot de passe incorrect</p>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            Connexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page" id="admin-page" style={{ paddingBottom: '100px' }}>
      <div className="page-header">
        <h1>Administration</h1>
        <p>Gérez tout le contenu de votre site</p>
      </div>

      {/* Section tabs */}
      <div style={{
        display: 'flex', gap: '6px', padding: '0 16px', overflowX: 'auto',
        marginBottom: '24px', flexWrap: 'nowrap',
      }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`btn btn-sm ${activeSection === s.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.72rem' }}
          >
            {s.label}
            {s.count !== undefined && (
              <span style={{
                marginLeft: '4px', fontSize: '0.6rem',
                opacity: 0.6,
              }}>
                {s.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ padding: '0 16px' }}>

        {/* ════════ PROFILE ════════ */}
        {activeSection === 'profile' && (
          <div className="admin-section animate-in">
            <h2 className="admin-section-title">Profil de l'artiste</h2>

            {/* Hero Banner Upload */}
            <h3 className="admin-subsection" style={{ marginTop: 0 }}>Bannière Hero</h3>
            <div style={{ marginBottom: '16px' }}>
              {data.profile.heroBanner ? (
                <div style={{ position: 'relative' }}>
                  <img src={data.profile.heroBanner} alt="Banner"
                    style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.06)' }} />
                  <button
                    onClick={() => updateProfile({ heroBanner: '' })}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.7)', color: '#fff',
                      border: 'none', padding: '4px 8px', fontSize: '0.65rem',
                      cursor: 'pointer',
                    }}>
                    <Trash2 size={12} /> Retirer
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: '120px', border: '1px dashed rgba(255,255,255,0.12)',
                  cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-muted)',
                  transition: 'border-color 0.2s',
                }}>
                  <Upload size={20} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  Cliquez pour uploader une image
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => updateProfile({ heroBanner: reader.result as string });
                      reader.readAsDataURL(file);
                    }} />
                </label>
              )}
            </div>

            {/* App icon */}
            <h3 className="admin-subsection">Icône de l'app</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              {data.profile.appIcon ? (
                <div style={{ position: 'relative' }}>
                  <img src={data.profile.appIcon} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <button onClick={() => updateProfile({ appIcon: '' })}
                    style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'rgba(0,0,0,0.8)', color: '#fff', border: 'none', width: '18px', height: '18px', borderRadius: '50%', fontSize: '0.5rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                </div>
              ) : (
                <label style={{ width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '12px', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                  +
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => updateProfile({ appIcon: reader.result as string });
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }} />
                </label>
              )}
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Image carrée recommandée (512×512 px)</span>
            </div>

            <AdminField label="Nom" value={data.profile.name}
              onChange={v => updateProfile({ name: v })} />
            <AdminField label="Tagline" value={data.profile.tagline}
              onChange={v => updateProfile({ tagline: v })} />
            <AdminField label="Technique" value={data.profile.techniqueTitle}
              onChange={v => updateProfile({ techniqueTitle: v })} />
            <AdminField label="Info naissance" value={data.profile.birthInfo}
              onChange={v => updateProfile({ birthInfo: v })} />

            <h3 className="admin-subsection">Biographie</h3>
            {data.profile.bio.map((para, i) => (
              <AdminTextarea key={i} label={`Paragraphe ${i + 1}`} value={para}
                onChange={v => {
                  const bio = [...data.profile.bio];
                  bio[i] = v;
                  updateProfile({ bio });
                }} />
            ))}

            <h3 className="admin-subsection">Contact</h3>
            {data.profile.contact.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <AdminField label="" value={c.label} style={{ width: '100px' }}
                  onChange={v => {
                    const contact = [...data.profile.contact];
                    contact[i] = { ...contact[i], label: v };
                    updateProfile({ contact });
                  }} />
                <AdminField label="" value={c.value} style={{ flex: 1 }}
                  onChange={v => {
                    const contact = [...data.profile.contact];
                    contact[i] = { ...contact[i], value: v };
                    updateProfile({ contact });
                  }} />
              </div>
            ))}
          </div>
        )}

        {/* ════════ ARTWORKS ════════ */}
        {activeSection === 'artworks' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Catalogue</h2>
              <button className="btn btn-primary btn-sm" onClick={handleAddArtwork}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {data.artworks.map(artwork => (
              <div key={artwork.id} className="admin-card">
                <div
                  className="admin-card-header"
                  onClick={() => setEditingArtwork(editingArtwork === artwork.id ? null : artwork.id)}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{artwork.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                      {artwork.year} — {artwork.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {artwork.isFeatured && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--color-accent)', fontWeight: 600 }}>★</span>
                    )}
                    {editingArtwork === artwork.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>

                {editingArtwork === artwork.id && (
                  <div className="admin-card-body">
                    <AdminField label="Titre" value={artwork.title}
                      onChange={v => updateArtwork(artwork.id, { title: v })} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <AdminField label="Année" value={String(artwork.year)} style={{ width: '80px' }}
                        onChange={v => updateArtwork(artwork.id, { year: parseInt(v) || 2024 })} />
                      <AdminField label="Dimensions" value={artwork.dimensions} style={{ flex: 1 }}
                        onChange={v => updateArtwork(artwork.id, { dimensions: v })} />
                    </div>
                    <AdminField label="Technique" value={artwork.technique}
                      onChange={v => updateArtwork(artwork.id, { technique: v })} />
                    <AdminTextarea label="Description" value={artwork.description}
                      onChange={v => updateArtwork(artwork.id, { description: v })} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <AdminSelect label="Catégorie" value={artwork.category}
                        options={[
                          { value: 'toile', label: 'Toile' },
                          { value: 'fresque', label: 'Fresque' },
                          { value: 'graphisme', label: 'Graphisme' },
                          { value: 'serigraphie', label: 'Sérigraphie' },
                          { value: 'objets', label: 'Objets' },
                        ]}
                        onChange={v => updateArtwork(artwork.id, { category: v as Artwork['category'] })} />
                      <AdminSelect label="Statut" value={artwork.status}
                        options={[
                          { value: 'available', label: 'Disponible' },
                          { value: 'sold', label: 'Vendu' },
                          { value: 'exhibition', label: 'En expo' },
                          { value: 'private', label: 'Privé' },
                        ]}
                        onChange={v => updateArtwork(artwork.id, { status: v as Artwork['status'] })} />
                    </div>
                    <AdminField label="Prix" value={artwork.price || ''}
                      onChange={v => updateArtwork(artwork.id, { price: v || undefined })} />

                    {/* ── Images (1 required, up to 5) ── */}
                    <h3 className="admin-subsection" style={{ marginTop: '12px' }}>
                      Photos ({(artwork.images || []).length}/5)
                      {(artwork.images || []).length === 0 && (
                        <span style={{ color: '#e53e3e', fontSize: '0.6rem', marginLeft: '8px' }}>— 1 photo minimum</span>
                      )}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {(artwork.images || []).map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '72px', height: '72px' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
                          {idx === 0 && (
                            <span style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '0.5rem', background: 'var(--color-accent)', color: '#000', padding: '1px 4px', fontWeight: 600 }}>COVER</span>
                          )}
                          <button onClick={() => {
                            const imgs = [...(artwork.images || [])];
                            imgs.splice(idx, 1);
                            updateArtwork(artwork.id, { images: imgs });
                          }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', fontSize: '0.6rem', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}>✕</button>
                        </div>
                      ))}
                      {(artwork.images || []).length < 5 && (
                        <label style={{ width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                          +
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const imgs = [...(artwork.images || []), reader.result as string];
                              updateArtwork(artwork.id, { images: imgs });
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }} />
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                        <input type="checkbox" checked={artwork.isFeatured}
                          onChange={e => updateArtwork(artwork.id, { isFeatured: e.target.checked })} />
                        Mis en avant
                      </label>
                      <div style={{ flex: 1 }} />
                      <button className="btn btn-sm" style={{ color: '#e53e3e', fontSize: '0.7rem' }}
                        onClick={() => { if (confirm('Supprimer cette œuvre ?')) deleteArtwork(artwork.id); }}>
                        <Trash2 size={12} /> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════ NEWS ════════ */}
        {activeSection === 'news' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Journal</h2>
              <button className="btn btn-primary btn-sm" onClick={handleAddNews}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {data.news.map(post => (
              <div key={post.id} className="admin-card">
                <div
                  className="admin-card-header"
                  onClick={() => setEditingNews(editingNews === post.id ? null : post.id)}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{post.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                      {post.date}
                    </span>
                  </div>
                  {editingNews === post.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                {editingNews === post.id && (
                  <div className="admin-card-body">
                    <AdminField label="Titre" value={post.title}
                      onChange={v => updateNews(post.id, { title: v })} />
                    <AdminField label="Date" value={post.date}
                      onChange={v => updateNews(post.id, { date: v })} />
                    <AdminSelect label="Catégorie" value={post.category}
                      options={[
                        { value: 'exhibition', label: 'Exposition' },
                        { value: 'press', label: 'Presse' },
                        { value: 'event', label: 'Événement' },
                        { value: 'studio', label: 'Atelier' },
                      ]}
                      onChange={v => updateNews(post.id, { category: v as NewsPost['category'] })} />
                    <AdminTextarea label="Contenu" value={post.content}
                      onChange={v => updateNews(post.id, { content: v })} />
                    <button className="btn btn-sm" style={{ color: '#e53e3e', fontSize: '0.7rem', marginTop: '8px' }}
                      onClick={() => { if (confirm('Supprimer ?')) deleteNews(post.id); }}>
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════ EXHIBITIONS ════════ */}
        {activeSection === 'exhibitions' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Expositions</h2>
              <button className="btn btn-primary btn-sm"
                onClick={() => addExhibition({ year: String(new Date().getFullYear()), title: '', venue: '', type: 'Solo' })}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {data.exhibitions.map((exh, i) => (
              <div key={i} className="admin-card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="admin-input" value={exh.year} style={{ width: '60px' }}
                    onChange={e => {
                      const exhibitions = [...data.exhibitions];
                      exhibitions[i] = { ...exh, year: e.target.value };
                      useSiteData.length; // just trigger
                    }}
                    placeholder="Année" readOnly />
                  <input className="admin-input" value={exh.title} style={{ flex: 1 }}
                    placeholder="Titre" readOnly />
                  <input className="admin-input" value={exh.venue} style={{ flex: 1 }}
                    placeholder="Lieu" readOnly />
                  <input className="admin-input" value={exh.type} style={{ width: '70px' }}
                    placeholder="Type" readOnly />
                  <button onClick={() => deleteExhibition(i)}
                    style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════ PRESS ════════ */}
        {activeSection === 'press' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Presse</h2>
              <button className="btn btn-primary btn-sm"
                onClick={() => addPress({ title: '', excerpt: '', link: '' })}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {data.press.map((item, i) => (
              <div key={i} className="admin-card" style={{ padding: '12px' }}>
                <AdminField label="Titre" value={item.title}
                  onChange={v => updatePress(i, { title: v })} />
                <AdminField label="Citation" value={item.excerpt}
                  onChange={v => updatePress(i, { excerpt: v })} />
                <AdminField label="Lien (URL)" value={item.link || ''}
                  onChange={v => updatePress(i, { link: v })} />
                <button onClick={() => deletePress(i)}
                  className="btn btn-sm" style={{ color: '#e53e3e', fontSize: '0.7rem', marginTop: '4px' }}>
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ════════ PORTFOLIO ════════ */}
        {activeSection === 'portfolio' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Portfolio</h2>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const id = String(Date.now());
                addPortfolio({ id, title: 'Nouveau projet', description: '', image: '', link: '', category: '' });
                setEditingPortfolio(id);
              }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>

            {(data.portfolio || []).map(item => (
              <div key={item.id} className="admin-card">
                <div className="admin-card-header"
                  onClick={() => setEditingPortfolio(editingPortfolio === item.id ? null : item.id)}>
                  <div style={{ flex: 1 }}>
                    <strong>{item.title}</strong>
                    {item.category && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                        {item.category}
                      </span>
                    )}
                  </div>
                  {editingPortfolio === item.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                {editingPortfolio === item.id && (
                  <div className="admin-card-body">
                    <AdminField label="Titre" value={item.title}
                      onChange={v => updatePortfolio(item.id, { title: v })} />
                    <AdminField label="Catégorie" value={item.category}
                      onChange={v => updatePortfolio(item.id, { category: v })} />
                    <AdminTextarea label="Description" value={item.description}
                      onChange={v => updatePortfolio(item.id, { description: v })} />
                    <AdminField label="Lien (URL)" value={item.link || ''}
                      onChange={v => updatePortfolio(item.id, { link: v })} />

                    {/* Portfolio image */}
                    <h3 className="admin-subsection" style={{ marginTop: '8px' }}>Image</h3>
                    {item.image ? (
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <img src={item.image} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }} />
                        <button onClick={() => updatePortfolio(item.id, { image: '' })}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', padding: '2px 6px', fontSize: '0.6rem', cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        <Upload size={16} style={{ marginRight: '6px', opacity: 0.4 }} /> Ajouter une image
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => updatePortfolio(item.id, { image: reader.result as string });
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    )}

                    <button className="btn btn-sm" style={{ color: '#e53e3e', fontSize: '0.7rem', marginTop: '4px' }}
                      onClick={() => { if (confirm('Supprimer ce projet ?')) deletePortfolio(item.id); }}>
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════ NOTIFICATIONS ════════ */}
        {activeSection === 'notifications' && <NotificationsSection />}

        {/* ════════ TOOLS ════════ */}
        {activeSection === 'tools' && (
          <div className="admin-section animate-in">
            <h2 className="admin-section-title">Outils</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-outline btn-block" onClick={handleExport}>
                <Download size={14} /> Exporter les données (JSON)
              </button>

              <button className="btn btn-outline btn-block" onClick={() => importRef.current?.click()}>
                <Upload size={14} /> Importer des données
              </button>
              <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }}
                onChange={handleImport} />

              <div style={{ borderTop: '1px solid var(--color-dark-border)', paddingTop: '16px', marginTop: '8px' }}>
                <button className="btn btn-block" onClick={() => {
                  if (confirm('Remettre toutes les données par défaut ? Cette action est irréversible.')) resetData();
                }} style={{ color: '#e53e3e', border: '1px solid rgba(229,62,62,0.3)' }}>
                  <RotateCcw size={14} /> Réinitialiser tout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Reusable admin form components ──

function AdminField({ label, value, onChange, style }: {
  label: string; value: string; onChange: (v: string) => void; style?: React.CSSProperties;
}) {
  return (
    <div style={{ marginBottom: '10px', ...style }}>
      {label && <label className="admin-label">{label}</label>}
      <input className="admin-input" value={value}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function AdminTextarea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      {label && <label className="admin-label">{label}</label>}
      <textarea className="admin-input" value={value} rows={3}
        onChange={e => onChange(e.target.value)}
        style={{ resize: 'vertical', minHeight: '60px' }} />
    </div>
  );
}

function AdminSelect({ label, value, options, onChange }: {
  label: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: '10px', flex: 1 }}>
      {label && <label className="admin-label">{label}</label>}
      <select className="admin-input" value={value}
        onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const ONESIGNAL_APP_ID = 'b224b657-b135-4fb7-b942-82277aebd8d6';

function NotificationsSection() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('onesignal-api-key') || '');
  const [showKey, setShowKey] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('onesignal-api-key', key);
  };

  const handleSend = async () => {
    if (!apiKey) { setErrorMsg('Ajoute ta REST API Key d\'abord'); setStatus('error'); return; }
    if (!title || !message) { setErrorMsg('Titre et message requis'); setStatus('error'); return; }

    setStatus('sending');
    try {
      const body: Record<string, unknown> = {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: title },
        contents: { en: message },
      };
      if (url) body.url = url;

      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setTitle('');
        setMessage('');
        setUrl('');
        setErrorMsg(`Notification envoyée à ${data.recipients || 0} abonné(s) !`);
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        const err = await res.json();
        setStatus('error');
        setErrorMsg(err.errors?.[0] || 'Erreur d\'envoi');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Erreur réseau');
    }
  };

  return (
    <div className="admin-section animate-in">
      <h2 className="admin-section-title">
        <Bell size={16} style={{ marginRight: '6px', verticalAlign: '-2px' }} />
        Notifications Push
      </h2>

      {/* API Key config */}
      <div className="admin-card" style={{ padding: '12px', marginBottom: '16px' }}>
        <label className="admin-label">REST API Key (OneSignal)</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="admin-input"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => saveKey(e.target.value)}
            placeholder="Colle ta clé ici (Settings → Keys & IDs)"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button className="btn btn-sm btn-outline" onClick={() => setShowKey(!showKey)}
            style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
            {showKey ? 'Masquer' : 'Voir'}
          </button>
        </div>
        <p style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Trouve la clé dans <a href="https://app.onesignal.com" target="_blank" rel="noopener" style={{ color: 'var(--color-accent)' }}>OneSignal</a> → Settings → Keys & IDs → REST API Key
        </p>
      </div>

      {/* Compose */}
      <div className="admin-card" style={{ padding: '16px' }}>
        <h3 className="admin-subsection" style={{ margin: '0 0 12px' }}>Composer une notification</h3>

        <div style={{ marginBottom: '10px' }}>
          <label className="admin-label">Titre</label>
          <input className="admin-input" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="ex: Nouvelle œuvre disponible !" style={{ marginBottom: 0 }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label className="admin-label">Message</label>
          <textarea className="admin-input" value={message} onChange={e => setMessage(e.target.value)}
            placeholder="ex: Découvrez 'Sunset Reflections', ma dernière toile..."
            rows={3} style={{ resize: 'vertical', minHeight: '60px' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label className="admin-label">URL (optionnel)</label>
          <input className="admin-input" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="ex: https://adriendasilva.vercel.app/catalogue/1" style={{ marginBottom: 0 }} />
        </div>

        {status === 'error' && (
          <p style={{ fontSize: '0.7rem', color: '#e53e3e', marginBottom: '8px' }}>{errorMsg}</p>
        )}
        {status === 'success' && (
          <p style={{ fontSize: '0.7rem', color: '#38a169', marginBottom: '8px' }}>{errorMsg}</p>
        )}

        <button
          className="btn btn-primary btn-block"
          onClick={handleSend}
          disabled={status === 'sending'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Send size={14} />
          {status === 'sending' ? 'Envoi...' : 'Envoyer la notification'}
        </button>
      </div>
    </div>
  );
}
