import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import FilterPage from './pages/FilterPage';
import CataloguePage from './pages/CataloguePage';
import AdminPage from './pages/AdminPage';

export const TEXT_PALETTES: Record<string, {
  name: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
}> = {
  warm: { name: 'Terracotta', text: '#f2ede8', textSecondary: 'rgba(242,237,232,0.55)', textMuted: 'rgba(242,237,232,0.25)', accent: '#c9a090', accentMuted: 'rgba(201,160,144,0.45)' },
  cool: { name: 'Glacier', text: '#e8eef2', textSecondary: 'rgba(232,238,242,0.55)', textMuted: 'rgba(232,238,242,0.25)', accent: '#90b8c9', accentMuted: 'rgba(144,184,201,0.45)' },
  gold: { name: 'Doré', text: '#f5f0e6', textSecondary: 'rgba(245,240,230,0.55)', textMuted: 'rgba(245,240,230,0.25)', accent: '#c9b070', accentMuted: 'rgba(201,176,112,0.45)' },
  rose: { name: 'Rosé', text: '#f2e8ee', textSecondary: 'rgba(242,232,238,0.55)', textMuted: 'rgba(242,232,238,0.25)', accent: '#c990a8', accentMuted: 'rgba(201,144,168,0.45)' },
  sage: { name: 'Sauge', text: '#ecf0ea', textSecondary: 'rgba(236,240,234,0.55)', textMuted: 'rgba(236,240,234,0.25)', accent: '#90c9a0', accentMuted: 'rgba(144,201,160,0.45)' },
  mono: { name: 'Monochrome', text: '#e8e8e8', textSecondary: 'rgba(232,232,232,0.5)', textMuted: 'rgba(232,232,232,0.22)', accent: '#b0b0b0', accentMuted: 'rgba(176,176,176,0.4)' },
  lavender: { name: 'Lavande', text: '#eee8f2', textSecondary: 'rgba(238,232,242,0.55)', textMuted: 'rgba(238,232,242,0.25)', accent: '#a890c9', accentMuted: 'rgba(168,144,201,0.45)' },
};

function DynamicTheme() {
  const { data } = useSiteData();
  useEffect(() => {
    // Favicon
    if (data.profile.appIcon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (link) link.href = data.profile.appIcon;
      if (apple) apple.href = data.profile.appIcon;
    }
    // Theme
    const theme = data.theme;
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--color-bg', theme.bgColor || '#0a0a0a');
      root.style.setProperty('--color-black', theme.bgColor || '#0a0a0a');
      const palette = TEXT_PALETTES[theme.paletteId] || TEXT_PALETTES.warm;
      root.style.setProperty('--color-text', palette.text);
      root.style.setProperty('--color-white', palette.text);
      root.style.setProperty('--color-text-secondary', palette.textSecondary);
      root.style.setProperty('--color-text-muted', palette.textMuted);
      root.style.setProperty('--color-accent', palette.accent);
      root.style.setProperty('--color-accent-muted', palette.accentMuted);
    }
  }, [data.profile.appIcon, data.theme]);
  return null;
}

function App() {
  return (
    <SiteDataProvider>
      <DynamicTheme />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CataloguePage />} />
          <Route path="/catalogue/:id" element={<ArtworkDetailPage />} />
          <Route path="/filter" element={<FilterPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </SiteDataProvider>
  );
}

export default App;
