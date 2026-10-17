import { useState, useRef, useCallback, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, type User } from 'firebase/auth';
import { auth, ADMIN_EMAILS } from '../firebase';
import { useSiteData } from '../contexts/SiteDataContext';
import { Save, Plus, Trash2, Download, Upload, RotateCcw, ChevronDown, ChevronUp, ChevronRight, Bell, Send, Loader2 } from 'lucide-react';
import type { Artwork, NewsPost, PortfolioItem } from '../data/defaultData';
import { TEXT_PALETTES } from '../App';
import MultiImageUpload from '../components/MultiImageUpload';

type Section = 'home' | 'profile' | 'artworks' | 'fresques' | 'news' | 'portfolio' | 'menu' | 'notifications' | 'theme' | 'tools';

export default function AdminPage() {
  const {
    data, uploadImage, updateProfile,
    addArtwork, updateArtwork, deleteArtwork,
    addNews, updateNews, deleteNews,
    setExhibitions, addExhibition, deleteExhibition,
    addPress, updatePress, deletePress,
    addPortfolio, updatePortfolio, deletePortfolio,
    updateTheme,
    updateHomeNav,
    reorderHomeNav,
    updateMenuConfig,
    updateContactEmail,
    exportData, importData, resetData,
    save, hasUnsaved, saving,
  } = useSiteData();

  const [uploading, setUploading] = useState<string | null>(null);
  const [editingTile, setEditingTile] = useState<string | null>(null);

  const handleImageUpload = useCallback(async (file: File, folder: string, onUrl: (url: string) => void) => {
    setUploading(folder);
    try {
      const url = await uploadImage(file, folder);
      onUrl(url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert(`La photo n'a pas pu être envoyée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setUploading(null);
    }
  }, [uploadImage]);

  const [activeSection, setActiveSection] = useState<Section>('profile');

  // ── PDF à jour ──
  const [pdfBusy, setPdfBusy] = useState<'catalogue' | 'portfolio' | null>(null);
  const exportPdf = async (kind: 'catalogue' | 'portfolio') => {
    setPdfBusy(kind);
    try {
      const { buildCataloguePdf, buildPortfolioPdf, downloadBlob } = await import('../utils/pdfExport');
      const blob = kind === 'catalogue' ? await buildCataloguePdf(data) : await buildPortfolioPdf(data);
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `adrien-da-silva-${kind}-${date}.pdf`);
    } catch (err) {
      alert(`Le PDF n'a pas pu être créé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setPdfBusy(null);
    }
  };
  const [editingArtwork, setEditingArtwork] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<string | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const fresquesCount = data.artworks.filter(a => a.category === 'fresque').length;
  const storeCount = data.artworks.filter(a => a.category !== 'fresque').length;
  const sections: { id: Section; label: string; count?: number }[] = [
    { id: 'home', label: 'Accueil' },
    { id: 'profile', label: 'Profil' },
    { id: 'artworks', label: 'Store', count: storeCount },
    { id: 'fresques', label: 'Fresques', count: fresquesCount },
    { id: 'news', label: 'Journal', count: data.news.length },
    { id: 'portfolio', label: 'Atelier', count: (data.portfolio || []).length },
    { id: 'menu', label: 'Menu' },
    { id: 'notifications', label: 'Notifs' },
    { id: 'theme', label: 'Thème' },
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
      images: [],
      category: 'event',
    };
    addNews(post);
    setEditingNews(id);
  };

  // ── Accès : compte Google autorisé (les règles Firestore vérifient la même liste) ──
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); }), []);
  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const handleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setAuthError('Connexion impossible. Réessayez.');
    }
  };

  if (!authReady) {
    return <div className="page-loader"><div className="page-loader-bar" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', width: '300px' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Admin</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            {user
              ? `Le compte ${user.email} n'a pas accès à l'administration.`
              : 'Connectez-vous avec le compte Google autorisé.'}
          </p>
          {authError && (
            <p style={{ fontSize: '0.7rem', color: '#e53e3e', marginBottom: '8px' }}>{authError}</p>
          )}
          {user ? (
            <button type="button" className="btn btn-outline btn-block" onClick={() => signOut(auth)}>
              Changer de compte
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={handleLogin}>
              Se connecter avec Google
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page" id="admin-page" style={{ paddingBottom: '100px' }}>
      <div className="page-header">
        <h1>Administration</h1>
        <p>Gérez tout le contenu de votre site</p>
      </div>

      {/* PDF générés à partir du contenu actuel (enregistré ou non) */}
      <div className="admin-pdf-bar">
        <button className="btn btn-outline btn-sm" disabled={pdfBusy !== null} onClick={() => exportPdf('catalogue')}>
          <Download size={13} /> {pdfBusy === 'catalogue' ? 'Préparation…' : 'Catalogue PDF à jour'}
        </button>
        <button className="btn btn-outline btn-sm" disabled={pdfBusy !== null} onClick={() => exportPdf('portfolio')}>
          <Download size={13} /> {pdfBusy === 'portfolio' ? 'Préparation…' : 'Portfolio PDF à jour'}
        </button>
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

        {/* ── Floating Save Bar ── */}
        {hasUnsaved && (
          <div style={{
            position: 'sticky', top: '60px', zIndex: 100,
            padding: '10px 16px',
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(201,160,144,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '12px',
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-accent)', fontWeight: 500 }}>
              ● Modifications non sauvegardées
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={save}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                minWidth: '140px', justifyContent: 'center',
              }}
            >
              {saving ? (
                <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sauvegarde...</>
              ) : (
                <><Save size={14} /> Sauvegarder</>
              )}
            </button>
          </div>
        )}

      <div className="page-content" style={{ padding: '0 16px' }}>

        {/* ════════ HOME NAV — REORDERABLE TILES ════════ */}
        {activeSection === 'home' && (
          <div className="admin-section animate-in">
            <h2 className="admin-section-title">Tiles de l'accueil</h2>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '20px', fontWeight: 300 }}>
              Gérez l'ordre et l'apparence des slides du carousel. L'ordre ici correspond à l'ordre de navigation sur la home.
            </p>

            {(data.homeNav || []).map((item, i) => {
              const isBio = item.direction === 'bio';
              const isOpen = editingTile === `tile-${i}`;
              return (
                <div key={`tile-${i}`} className="admin-card" style={{ padding: '0', marginBottom: '10px', overflow: 'hidden' }}>
                  {/* Tile header — always visible */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                    cursor: 'pointer', background: isOpen ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }} onClick={() => setEditingTile(isOpen ? null : `tile-${i}`)}>
                    {/* Reorder buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button disabled={i === 0} onClick={e => { e.stopPropagation(); reorderHomeNav(i, i - 1); }}
                        style={{ opacity: i === 0 ? 0.15 : 0.5, padding: '2px', lineHeight: 0 }}>
                        <ChevronUp size={14} />
                      </button>
                      <button disabled={i === (data.homeNav || []).length - 1}
                        onClick={e => { e.stopPropagation(); reorderHomeNav(i, i + 1); }}
                        style={{ opacity: i === (data.homeNav || []).length - 1 ? 0.15 : 0.5, padding: '2px', lineHeight: 0 }}>
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div style={{
                      width: '44px', height: '44px', flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)',
                      background: 'var(--color-dark-surface)',
                    }}>
                      {(item.image || (isBio && data.profile.heroBanner)) && (
                        <img src={item.image || data.profile.heroBanner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>

                    {/* Title + badge */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.label}
                        {isBio && <span style={{ fontSize: '0.5rem', background: 'var(--color-accent-subtle)', color: 'var(--color-accent)', padding: '1px 6px', borderRadius: '2px' }}>Bio</span>}
                      </div>
                      <div style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)' }}>{item.route}</div>
                    </div>

                    {/* Color swatch */}
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
                      background: item.textColor || '#f2ede8',
                    }} />

                    <ChevronRight size={14} style={{
                      opacity: 0.3, transition: 'transform 0.2s',
                      transform: isOpen ? 'rotate(90deg)' : 'none',
                    }} />
                  </div>

                  {/* Expanded editor */}
                  {isOpen && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      {/* Image */}
                      <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                        <label className="admin-label">Image de fond</label>
                        {(item.image || (isBio && data.profile.heroBanner)) ? (
                          <div style={{ position: 'relative' }}>
                            <img src={item.image || (isBio ? data.profile.heroBanner : '')} alt=""
                              style={{ width: '100%', height: '120px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }} />
                            <button onClick={() => {
                              if (isBio && !item.image) updateProfile({ heroBanner: '' });
                              else updateHomeNav(i, { image: '' });
                            }}
                              style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', padding: '4px 8px', fontSize: '0.65rem', cursor: 'pointer' }}>
                              <Trash2 size={12} /> Retirer
                            </button>
                          </div>
                        ) : (
                          <label style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            height: '80px', border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--color-text-muted)',
                          }}>
                            {uploading === `tile-${i}` ? (
                              <><Loader2 size={16} style={{ marginBottom: '6px', animation: 'spin 1s linear infinite' }} /> Upload...</>
                            ) : (
                              <><Upload size={16} style={{ marginBottom: '6px', opacity: 0.4 }} /> Ajouter une image</>
                            )}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              handleImageUpload(file, `homeNav/tile-${i}`, url => updateHomeNav(i, { image: url }));
                              e.target.value = '';
                            }} />
                          </label>
                        )}
                      </div>

                      <AdminField label="Titre" value={item.label} onChange={v => updateHomeNav(i, { label: v })} />
                      <AdminField label="Sous-titre" value={item.subtitle} onChange={v => updateHomeNav(i, { subtitle: v })} />
                      <AdminField label="Route" value={item.route} onChange={v => updateHomeNav(i, { route: v })} />

                      {/* Text color */}
                      <div style={{ marginBottom: '10px' }}>
                        <label className="admin-label">Couleur du texte</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={item.textColor || '#f2ede8'}
                            onChange={e => updateHomeNav(i, { textColor: e.target.value })}
                            style={{ width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', padding: 0 }} />
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {['#f2ede8', '#ffffff', '#000000', '#c9a090', '#a0c9b0', '#90a0c9'].map(c => (
                              <button key={c} onClick={() => updateHomeNav(i, { textColor: c })}
                                style={{
                                  width: '20px', height: '20px', borderRadius: '50%', background: c, border: item.textColor === c ? '2px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', padding: 0,
                                }} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Background color */}
                      <div style={{ marginBottom: '10px' }}>
                        <label className="admin-label">Couleur de fond</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="color" value={item.bgColor || '#0a0a0a'}
                            onChange={e => updateHomeNav(i, { bgColor: e.target.value })}
                            style={{ width: '32px', height: '32px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer', padding: 0 }} />
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {['#0a0a0a', '#1a1a2e', '#2d0a2e', '#0e1a0e', '#1a0e0e', '#ffffff'].map(c => (
                              <button key={c} onClick={() => updateHomeNav(i, { bgColor: c })}
                                style={{
                                  width: '20px', height: '20px', borderRadius: '50%', background: c, border: item.bgColor === c ? '2px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', padding: 0,
                                }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
                  {uploading === 'hero' ? (
                    <Loader2 size={20} style={{ marginBottom: '8px', opacity: 0.6, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Upload size={20} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  )}
                  {uploading === 'hero' ? 'Upload en cours...' : 'Cliquez pour uploader une image'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      handleImageUpload(file, 'hero', url => updateProfile({ heroBanner: url }));
                      e.target.value = '';
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
                  {uploading === 'icon' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : '+'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    handleImageUpload(file, 'icon', url => updateProfile({ appIcon: url }));
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
            {/* CV / Parcours */}
            <h3 className="admin-subsection">Parcours (CV)</h3>
            {(data.profile.cvSections || []).map((section, si) => (
              <div key={si} className="admin-card" style={{ padding: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <input className="admin-input" value={section.title} style={{ flex: 1, fontWeight: 600, fontSize: '0.78rem' }}
                    placeholder="Titre de la section"
                    onChange={e => {
                      const cvSections = [...(data.profile.cvSections || [])];
                      cvSections[si] = { ...section, title: e.target.value };
                      updateProfile({ cvSections });
                    }} />
                  <button onClick={() => {
                    const cvSections = (data.profile.cvSections || []).filter((_: any, i: number) => i !== si);
                    updateProfile({ cvSections });
                  }} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                {section.items.map((item: string, ii: number) => (
                  <div key={ii} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                    <input className="admin-input" value={item} style={{ flex: 1, fontSize: '0.72rem' }}
                      onChange={e => {
                        const cvSections = [...(data.profile.cvSections || [])];
                        const items = [...section.items];
                        items[ii] = e.target.value;
                        cvSections[si] = { ...section, items };
                        updateProfile({ cvSections });
                      }} />
                    <button onClick={() => {
                      const cvSections = [...(data.profile.cvSections || [])];
                      cvSections[si] = { ...section, items: section.items.filter((_: any, i: number) => i !== ii) };
                      updateProfile({ cvSections });
                    }} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                <button className="btn btn-sm" style={{ fontSize: '0.6rem', marginTop: '4px' }}
                  onClick={() => {
                    const cvSections = [...(data.profile.cvSections || [])];
                    cvSections[si] = { ...section, items: [...section.items, ''] };
                    updateProfile({ cvSections });
                  }}>
                  <Plus size={10} /> Ajouter un item
                </button>
              </div>
            ))}
            <button className="btn btn-sm btn-primary" style={{ fontSize: '0.65rem', marginTop: '4px' }}
              onClick={() => {
                const cvSections = [...(data.profile.cvSections || []), { title: 'Nouvelle section', items: [] as string[] }];
                updateProfile({ cvSections });
              }}>
              <Plus size={10} /> Ajouter une section CV
            </button>
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
                      <AdminField label="Année" value={artwork.year ? String(artwork.year) : ''} style={{ width: '80px' }}
                        onChange={v => updateArtwork(artwork.id, { year: parseInt(v) || undefined })} />
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
                          { value: 'papier', label: 'Papier' },
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
                    <AdminField label="Prix (€)" value={artwork.price || ''}
                      onChange={v => updateArtwork(artwork.id, { price: v || undefined })} />
                    <AdminField label="Signature" value={artwork.signature || ''}
                      onChange={v => updateArtwork(artwork.id, { signature: v || undefined })} />

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
                          {uploading === `artworks/${artwork.id}` ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : '+'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleImageUpload(file, `artworks/${artwork.id}`, url => {
                              const imgs = [...(artwork.images || []), url];
                              updateArtwork(artwork.id, { images: imgs });
                            });
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

                    {/* News images (multi) */}
                    <h3 className="admin-subsection" style={{ marginTop: '8px' }}>Images</h3>
                    <MultiImageUpload
                      images={post.images || ((post as any).image ? [(post as any).image] : [])}
                      max={5}
                      folder={`news/${post.id}`}
                      onUpload={(file, folder) => uploadImage(file, folder)}
                      onChange={imgs => updateNews(post.id, { images: imgs })}
                    />

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

        {/* ════════ FRESQUES ════════ */}
        {activeSection === 'fresques' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Fresques</h2>
              <button className="btn btn-primary btn-sm"
                onClick={() => {
                  const id = String(Date.now());
                  addArtwork({
                    id, title: 'Nouvelle fresque', year: new Date().getFullYear(),
                    technique: '', dimensions: '', description: '', images: [],
                    category: 'fresque', isFeatured: false, status: 'available',
                  });
                }}>
                <Plus size={14} /> Ajouter
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '16px', fontWeight: 300 }}>
              Œuvres murales — gérées comme des œuvres du Store avec la catégorie «&nbsp;fresque&nbsp;».
            </p>

            {data.artworks.filter(a => a.category === 'fresque').map(artwork => (
              <div key={artwork.id} className="admin-card" style={{ padding: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={() => setEditingTile(editingTile === `fresque-${artwork.id}` ? null : `fresque-${artwork.id}`)}>
                  <div style={{ width: '50px', height: '50px', flexShrink: 0, overflow: 'hidden', background: 'var(--color-dark-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {artwork.images?.[0] && <img src={artwork.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{artwork.title}</div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--color-text-muted)' }}>{artwork.year ?? 'Année ?'} — {artwork.dimensions || 'Dimensions non définies'}</div>
                  </div>
                  <ChevronRight size={14} style={{ opacity: 0.3, transition: 'transform 0.2s', transform: editingTile === `fresque-${artwork.id}` ? 'rotate(90deg)' : 'none' }} />
                </div>

                {editingTile === `fresque-${artwork.id}` && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <AdminField label="Titre" value={artwork.title} onChange={v => updateArtwork(artwork.id, { title: v })} />
                    <AdminField label="Année" value={artwork.year ? String(artwork.year) : ''} onChange={v => updateArtwork(artwork.id, { year: parseInt(v) || undefined })} />
                    <AdminField label="Lieu" value={artwork.lieu || ''} onChange={v => updateArtwork(artwork.id, { lieu: v })} />
                    <AdminField label="Dimensions" value={artwork.dimensions} onChange={v => updateArtwork(artwork.id, { dimensions: v })} />
                    <AdminField label="Description" value={artwork.description} onChange={v => updateArtwork(artwork.id, { description: v })} />

                    {/* Images (multi) */}
                    <h3 className="admin-subsection" style={{ marginTop: '8px' }}>Images</h3>
                    <MultiImageUpload
                      images={artwork.images || []}
                      max={5}
                      folder={`fresques/${artwork.id}`}
                      onUpload={(file, folder) => uploadImage(file, folder)}
                      onChange={imgs => updateArtwork(artwork.id, { images: imgs })}
                    />

                    <button onClick={() => deleteArtwork(artwork.id)}
                      className="btn btn-sm" style={{ color: '#e53e3e', fontSize: '0.7rem', marginTop: '4px' }}>
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            ))}

            {fresquesCount === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                Aucune fresque. Créez une œuvre avec la catégorie «&nbsp;fresque&nbsp;».
              </div>
            )}
          </div>
        )}

        {/* ════════ PORTFOLIO ════════ */}
        {activeSection === 'portfolio' && (
          <div className="admin-section animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="admin-section-title" style={{ margin: 0 }}>Portfolio</h2>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const id = String(Date.now());
                addPortfolio({ id, title: 'Nouveau projet', description: '', images: [], link: '', category: '' });
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

                    {/* Portfolio images (multi) */}
                    <h3 className="admin-subsection" style={{ marginTop: '8px' }}>Images</h3>
                    <MultiImageUpload
                      images={item.images || ((item as any).image ? [(item as any).image] : [])}
                      max={5}
                      folder={`portfolio/${item.id}`}
                      onUpload={(file, folder) => uploadImage(file, folder)}
                      onChange={imgs => updatePortfolio(item.id, { images: imgs })}
                    />

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

        {activeSection === 'menu' && (
          <div className="admin-section animate-in">
            <h2 className="admin-section-title">Configuration du menu</h2>

            {/* Contact email */}
            <AdminField label="Email de contact (formulaire)"
              value={data.contactEmail || ''} onChange={v => updateContactEmail(v)} />

            {/* PWA Install Icon */}
            <h3 className="admin-subsection">Icône PWA (installation)</h3>
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
                    handleImageUpload(file, 'icon', url => updateProfile({ appIcon: url }));
                    e.target.value = '';
                  }} />
                </label>
              )}
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>512×512 px recommandé</span>
            </div>

            {/* Menu items */}
            <h3 className="admin-subsection">Items du menu</h3>
            {(data.menuConfig?.items || []).map((item, i) => (
              <div key={item.route} className="admin-card" style={{ padding: '10px 12px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
                  <input className="admin-input" value={item.label} style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600 }}
                    onChange={e => {
                      const items = [...(data.menuConfig?.items || [])];
                      items[i] = { ...item, label: e.target.value };
                      updateMenuConfig({ items });
                    }} />
                  <input type="color" value={item.textColor || '#f2ede8'}
                    onChange={e => {
                      const items = [...(data.menuConfig?.items || [])];
                      items[i] = { ...item, textColor: e.target.value };
                      updateMenuConfig({ items });
                    }}
                    style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
                    title="Couleur du texte" />
                </div>
              </div>
            ))}

            {/* Per-line decorative config */}
            <h3 className="admin-subsection" style={{ marginTop: '16px' }}>Lignes décoratives</h3>
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Chaque ligne entre les items du menu est configurable individuellement.
            </p>
            {(() => {
              const items = data.menuConfig?.items || [];
              const lineCount = Math.max(items.length - 1, 0);
              const lines = data.menuConfig?.lines || [];
              return Array.from({ length: lineCount }, (_, li) => {
                const line = lines[li] || { color: data.menuConfig?.lineColor || '#c9a090', thickness: 4, offsetX: 10, width: 30 };
                const updateLine = (updates: Partial<typeof line>) => {
                  const newLines = [...lines];
                  while (newLines.length <= li) newLines.push({ color: data.menuConfig?.lineColor || '#c9a090', thickness: 4, offsetX: 10, width: 30 });
                  newLines[li] = { ...newLines[li], ...updates };
                  updateMenuConfig({ lines: newLines });
                };
                return (
                  <div key={li} className="admin-card" style={{ padding: '10px 12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                      Ligne {li + 1} — entre «{items[li]?.label}» et «{items[li + 1]?.label}»
                    </div>
                    {/* Preview */}
                    <div style={{ padding: '4px 0', marginBottom: '8px', position: 'relative', height: '12px' }}>
                      <div style={{
                        position: 'absolute',
                        left: `${line.offsetX}%`,
                        width: `${line.width}%`,
                        height: `${line.thickness}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: line.color,
                        borderRadius: '99px',
                      }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label className="admin-label">Couleur</label>
                        <input type="color" value={line.color}
                          onChange={e => updateLine({ color: e.target.value })}
                          style={{ width: '100%', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }} />
                      </div>
                      <div>
                        <label className="admin-label">Épaisseur ({line.thickness}px)</label>
                        <input type="range" min="1" max="16" value={line.thickness}
                          onChange={e => updateLine({ thickness: parseInt(e.target.value) })}
                          style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label className="admin-label">Position ({line.offsetX}%)</label>
                        <input type="range" min="0" max="80" value={line.offsetX}
                          onChange={e => updateLine({ offsetX: parseInt(e.target.value) })}
                          style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label className="admin-label">Largeur ({line.width}%)</label>
                        <input type="range" min="5" max="80" value={line.width}
                          onChange={e => updateLine({ width: parseInt(e.target.value) })}
                          style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ════════ NOTIFICATIONS ════════ */}
        {activeSection === 'notifications' && <NotificationsSection />}

        {/* ════════ THEME ════════ */}
        {activeSection === 'theme' && (
          <div className="admin-section animate-in">
            <h2 className="admin-section-title">Thème</h2>

            {/* Background color */}
            <h3 className="admin-subsection">Couleur de fond</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ position: 'relative', cursor: 'pointer' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '10px',
                  background: data.theme?.bgColor || '#0a0a0a',
                  border: '2px solid rgba(255,255,255,0.12)',
                }} />
                <input type="color" value={data.theme?.bgColor || '#0a0a0a'}
                  onChange={e => updateTheme({ bgColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </label>
              <div>
                <input className="admin-input" value={data.theme?.bgColor || '#0a0a0a'}
                  onChange={e => updateTheme({ bgColor: e.target.value })}
                  style={{ width: '100px', marginBottom: 0, fontFamily: 'monospace', fontSize: '0.7rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['#0a0a0a', '#0d1117', '#1a1a2e', '#0f0f0f', '#141414', '#0a0e17', '#1a0e0e', '#0e1a15'].map(c => (
                  <button key={c} onClick={() => updateTheme({ bgColor: c })}
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px', background: c,
                      border: (data.theme?.bgColor || '#0a0a0a') === c ? '2px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                    }} />
                ))}
              </div>
            </div>

            {/* Text palettes */}
            <h3 className="admin-subsection">Palette de couleurs</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {Object.entries(TEXT_PALETTES).map(([id, p]) => {
                const isActive = (data.theme?.paletteId || 'warm') === id;
                return (
                  <button key={id}
                    onClick={() => updateTheme({ paletteId: id })}
                    style={{
                      background: data.theme?.bgColor || '#0a0a0a',
                      border: isActive ? `2px solid ${p.accent}` : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '14px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: p.accent }} />
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: p.text }} />
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: p.textSecondary }} />
                    </div>
                    <div style={{ color: p.text, fontSize: '0.8rem', fontWeight: 600, marginBottom: '2px' }}>
                      {p.name}
                    </div>
                    <div style={{ color: p.accent, fontSize: '0.65rem' }}>
                      Titre d'exemple
                    </div>
                    <div style={{ color: p.textSecondary, fontSize: '0.6rem' }}>
                      Sous-titre secondaire
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
            placeholder="ex : Découvrez « On dirait le sud », ma dernière toile…"
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
