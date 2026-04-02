import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { defaultSiteData, type SiteData, type Artwork, type NewsPost, type Exhibition, type PressItem, type PortfolioItem, type ArtistProfile } from '../data/defaultData';

const STORAGE_KEY = 'artist-site-data';

function loadData(): SiteData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSiteData, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSiteData;
}

function saveData(data: SiteData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface SiteDataContextType {
  data: SiteData;
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
  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

const SiteDataContext = createContext<SiteDataContextType | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(loadData);

  const update = useCallback((updater: (prev: SiteData) => SiteData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

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

  // ── Portfolio ──
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

  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as SiteData;
      if (!parsed.profile || !parsed.artworks) return false;
      setData(parsed);
      saveData(parsed);
      return true;
    } catch { return false; }
  }, []);

  const resetData = useCallback(() => {
    setData(defaultSiteData);
    saveData(defaultSiteData);
  }, []);

  return (
    <SiteDataContext.Provider value={{
      data,
      updateProfile,
      addArtwork, updateArtwork, deleteArtwork,
      addNews, updateNews, deleteNews,
      setExhibitions, addExhibition, deleteExhibition,
      setPress, addPress, updatePress, deletePress,
      addPortfolio, updatePortfolio, deletePortfolio,
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
