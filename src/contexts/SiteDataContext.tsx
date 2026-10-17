import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToSupabase } from '../supabase';
import { defaultSiteData, CONTENT_VERSION, type SiteData, type Artwork, type NewsPost, type Exhibition, type PressItem, type PortfolioItem, type ThemeConfig, type ArtistProfile, type HomeNavItem, type MenuConfig } from '../data/defaultData';

const SITE_DOC = doc(db, 'site', 'data');

interface SiteDataContextType {
  data: SiteData;
  loading: boolean;
  hasUnsaved: boolean;
  saving: boolean;
  save: (override?: SiteData) => Promise<void>;
  replaceData: (next: SiteData) => void;
  uploadImage: (file: File, path: string) => Promise<string>;
  updateProfile: (profile: Partial<ArtistProfile>) => void;
  addArtwork: (artwork: Artwork) => void;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
  deleteArtwork: (id: string) => void;
  addNews: (post: NewsPost) => void;
  updateNews: (id: string, updates: Partial<NewsPost>) => void;
  deleteNews: (id: string) => void;
  setExhibitions: (exhibitions: Exhibition[]) => void;
  addExhibition: (exhibition: Exhibition) => void;
  deleteExhibition: (index: number) => void;
  setPress: (press: PressItem[]) => void;
  addPress: (item: PressItem) => void;
  updatePress: (index: number, updates: Partial<PressItem>) => void;
  deletePress: (index: number) => void;
  addPortfolio: (item: PortfolioItem) => void;
  updatePortfolio: (id: string, updates: Partial<PortfolioItem>) => void;
  deletePortfolio: (id: string) => void;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  updateHomeNav: (index: number, updates: Partial<HomeNavItem>) => void;
  reorderHomeNav: (fromIndex: number, toIndex: number) => void;
  updateMenuConfig: (updates: Partial<MenuConfig>) => void;
  updateContactEmail: (email: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

const SiteDataContext = createContext<SiteDataContextType | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(defaultSiteData);
  const [savedData, setSavedData] = useState<SiteData>(defaultSiteData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const isEditing = useRef(false);

  // ── Load from Firestore + listen for real-time updates ──
  // Merge loaded data with defaults — preserve user data but add missing defaults
  // Also migrates old data formats (single image → images array)
  const mergeWithDefaults = (firestore: SiteData): SiteData => {
    // Donnée d'une ancienne version (contenu de démonstration) : on repart du contenu actuel.
    if ((firestore.contentVersion ?? 0) < CONTENT_VERSION) return defaultSiteData;
    const merged = { ...defaultSiteData, ...firestore };
    // Merge profile sub-fields
    merged.profile = { ...defaultSiteData.profile, ...(firestore.profile || {}) };
    if (!merged.profile.cvSections?.length) merged.profile.cvSections = defaultSiteData.profile.cvSections;
    if (!merged.profile.galleryImages) merged.profile.galleryImages = defaultSiteData.profile.galleryImages;
    // Merge homeNav — append any default tiles whose route doesn't exist in loaded data
    if (firestore.homeNav?.length) {
      const existingRoutes = new Set(firestore.homeNav.map(n => n.route));
      const missingDefaults = defaultSiteData.homeNav.filter(d => !existingRoutes.has(d.route));
      const combined = [...firestore.homeNav.map(n => ({ ...n, textColor: n.textColor || '#1d1aa8' })), ...missingDefaults];
      const seen = new Set<string>();
      merged.homeNav = combined.filter(n => { if (seen.has(n.route)) return false; seen.add(n.route); return true; });
    }
    // Migrate portfolio: old single `image` → `images[]`
    if (merged.portfolio) {
      merged.portfolio = merged.portfolio.map((p: any) => ({
        ...p,
        images: p.images || (p.image ? [p.image] : []),
      }));
    }
    // Migrate news: old single `image` → `images[]`
    if (merged.news) {
      merged.news = merged.news.map((n: any) => ({
        ...n,
        images: n.images || (n.image ? [n.image] : []),
      }));
    }
    // Ensure menuConfig exists
    if (!merged.menuConfig) merged.menuConfig = defaultSiteData.menuConfig;
    // Ensure contactEmail exists
    if (!merged.contactEmail) merged.contactEmail = defaultSiteData.contactEmail;
    return merged;
  };

  useEffect(() => {
    // First load
    getDoc(SITE_DOC).then(snap => {
      if (snap.exists()) {
        const loaded = mergeWithDefaults(snap.data() as SiteData);
        setData(loaded);
        setSavedData(loaded);
      }
      // Document absent : le contenu par défaut s'affiche ; seul l'admin connecté écrit en base.
      setLoading(false);
    }).catch(() => setLoading(false));

    // Real-time listener — only update if we're NOT currently editing
    const unsub = onSnapshot(SITE_DOC, snap => {
      if (snap.exists() && !isEditing.current) {
        const loaded = mergeWithDefaults(snap.data() as SiteData);
        setData(loaded);
        setSavedData(loaded);
      }
    });
    return unsub;
  }, []);

  // ── Track unsaved changes ──
  useEffect(() => {
    const changed = JSON.stringify(data) !== JSON.stringify(savedData);
    setHasUnsaved(changed);
    if (changed) {
      isEditing.current = true;
    }
  }, [data, savedData]);

  // ── Save to Firestore (explicit) ──
  const save = useCallback(async (override?: SiteData) => {
    setSaving(true);
    const toSave = override ?? data;
    try {
      const serialized = JSON.parse(JSON.stringify({ ...toSave, contentVersion: CONTENT_VERSION }));
      // Keep editing lock ON while Firestore processes the write
      isEditing.current = true;
      
      // Await the Firestore write with a timeout
      const writePromise = setDoc(SITE_DOC, serialized);
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
      
      await Promise.race([writePromise, timeoutPromise]);
      
      // Update saved snapshot to match what we just wrote
      setSavedData(toSave);
      if (override) setData(override);
      setHasUnsaved(false);
      
      // Keep editing lock for 3 more seconds so onSnapshot doesn't overwrite
      setTimeout(() => {
        isEditing.current = false;
      }, 3000);
      
    } catch (err) {
      console.error('Save failed:', err);
      alert('Erreur de sauvegarde. Vérifiez votre connexion.');
      isEditing.current = false;
    } finally {
      setSaving(false);
    }
  }, [data]);

  // ── Local-only update (no Firestore write) ──
  const update = useCallback((updater: (prev: SiteData) => SiteData) => {
    setData(prev => updater(prev));
  }, []);

  // ── Upload image to Firebase Storage ──
  // Firebase Storage exige l'offre payante : les photos vont dans Supabase (src/supabase.ts)
  const uploadImage = useCallback((file: File, path: string): Promise<string> => uploadToSupabase(file, path), []);

  // ── All the same CRUD operations (local only, need save) ──
  const updateProfile = useCallback((partial: Partial<ArtistProfile>) => {
    update(d => ({ ...d, profile: { ...d.profile, ...partial } }));
  }, [update]);

  const addArtwork = useCallback((artwork: Artwork) => {
    update(d => ({ ...d, artworks: [...d.artworks, artwork] }));
  }, [update]);

  const updateArtwork = useCallback((id: string, updates: Partial<Artwork>) => {
    update(d => ({
      ...d,
      artworks: d.artworks.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }, [update]);

  const deleteArtwork = useCallback((id: string) => {
    update(d => ({ ...d, artworks: d.artworks.filter(a => a.id !== id) }));
  }, [update]);

  const addNews = useCallback((post: NewsPost) => {
    update(d => ({ ...d, news: [post, ...d.news] }));
  }, [update]);

  const updateNews = useCallback((id: string, updates: Partial<NewsPost>) => {
    update(d => ({
      ...d,
      news: d.news.map(n => n.id === id ? { ...n, ...updates } : n),
    }));
  }, [update]);

  const deleteNews = useCallback((id: string) => {
    update(d => ({ ...d, news: d.news.filter(n => n.id !== id) }));
  }, [update]);

  const setExhibitions = useCallback((exhibitions: Exhibition[]) => {
    update(d => ({ ...d, exhibitions }));
  }, [update]);

  const addExhibition = useCallback((exhibition: Exhibition) => {
    update(d => ({ ...d, exhibitions: [exhibition, ...d.exhibitions] }));
  }, [update]);

  const deleteExhibition = useCallback((index: number) => {
    update(d => ({ ...d, exhibitions: d.exhibitions.filter((_, i) => i !== index) }));
  }, [update]);

  const setPress = useCallback((press: PressItem[]) => {
    update(d => ({ ...d, press }));
  }, [update]);

  const addPress = useCallback((item: PressItem) => {
    update(d => ({ ...d, press: [item, ...d.press] }));
  }, [update]);

  const updatePress = useCallback((index: number, updates: Partial<PressItem>) => {
    update(d => ({
      ...d,
      press: d.press.map((p, i) => i === index ? { ...p, ...updates } : p),
    }));
  }, [update]);

  const deletePress = useCallback((index: number) => {
    update(d => ({ ...d, press: d.press.filter((_, i) => i !== index) }));
  }, [update]);

  const addPortfolio = useCallback((item: PortfolioItem) => {
    update(d => ({ ...d, portfolio: [...(d.portfolio || []), item] }));
  }, [update]);

  const updatePortfolio = useCallback((id: string, updates: Partial<PortfolioItem>) => {
    update(d => ({
      ...d,
      portfolio: (d.portfolio || []).map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, [update]);

  const deletePortfolio = useCallback((id: string) => {
    update(d => ({ ...d, portfolio: (d.portfolio || []).filter(p => p.id !== id) }));
  }, [update]);

  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    update(d => ({ ...d, theme: { ...(d.theme || { bgColor: '#f4f1ea', paletteId: 'outremer' }), ...updates } }));
  }, [update]);

  const updateHomeNav = useCallback((index: number, updates: Partial<HomeNavItem>) => {
    update(d => ({
      ...d,
      homeNav: (d.homeNav || []).map((item, i) => i === index ? { ...item, ...updates } : item),
    }));
  }, [update]);

  const reorderHomeNav = useCallback((fromIndex: number, toIndex: number) => {
    update(d => {
      const arr = [...(d.homeNav || [])];
      if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return d;
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { ...d, homeNav: arr };
    });
  }, [update]);

  const updateMenuConfig = useCallback((updates: Partial<MenuConfig>) => {
    update(d => ({ ...d, menuConfig: { ...(d.menuConfig || defaultSiteData.menuConfig), ...updates } }));
  }, [update]);

  const updateContactEmail = useCallback((email: string) => {
    update(d => ({ ...d, contactEmail: email }));
  }, [update]);

  const replaceData = useCallback((next: SiteData) => setData(next), []);

  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as SiteData;
      if (!parsed.profile || !parsed.artworks) return false;
      setData(parsed);
      return true;
    } catch { return false; }
  }, []);

  const resetData = useCallback(() => {
    setData(defaultSiteData);
    setSavedData(defaultSiteData);
    setDoc(SITE_DOC, JSON.parse(JSON.stringify(defaultSiteData)));
  }, []);

  return (
    <SiteDataContext.Provider value={{
      data,
      loading,
      hasUnsaved,
      saving,
      save,
      replaceData,
      uploadImage,
      updateProfile,
      addArtwork, updateArtwork, deleteArtwork,
      addNews, updateNews, deleteNews,
      setExhibitions, addExhibition, deleteExhibition,
      setPress, addPress, updatePress, deletePress,
      addPortfolio, updatePortfolio, deletePortfolio,
      updateTheme,
      updateHomeNav,
      reorderHomeNav,
      updateMenuConfig,
      updateContactEmail,
      exportData, importData, resetData,
    }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be inside SiteDataProvider');
  return ctx;
}
