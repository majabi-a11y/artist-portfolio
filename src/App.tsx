import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import BottomNav from './components/BottomNav';
import WelcomeSheet from './components/WelcomeSheet';

// Lazy-loaded pages for better initial load performance
const HomePage = lazy(() => import('./pages/HomePage'));
const CataloguePage = lazy(() => import('./pages/CataloguePage'));
const ArtworkDetailPage = lazy(() => import('./pages/ArtworkDetailPage'));
const FilterPage = lazy(() => import('./pages/FilterPage'));
const FresquesPage = lazy(() => import('./pages/FresquesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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
    // Favicon + apple-touch-icon
    if (data.profile.appIcon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (link) { link.type = 'image/png'; link.href = data.profile.appIcon; }
      if (apple) apple.href = data.profile.appIcon;

      // Dynamic manifest — update PWA install icon
      const iconUrl = data.profile.appIcon;
      const manifest = {
        name: 'Adrien Da Silva — Portfolio',
        short_name: 'Da Silva',
        description: 'Artiste peintre et muraliste — Montpellier',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: data.theme?.bgColor || '#0a0a0a',
        orientation: 'portrait',
        icons: [
          { src: iconUrl, sizes: '192x192', type: 'image/png' },
          { src: iconUrl, sizes: '512x512', type: 'image/png' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(blob);
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) manifestLink.href = manifestUrl;
    }
    // Theme
    const theme = data.theme;
    if (theme) {
      const root = document.documentElement;
      const bg = theme.bgColor || '#0a0a0a';
      root.style.setProperty('--color-bg', bg);
      root.style.setProperty('--color-black', bg);

      // Generate tinted dark shades from the chosen color
      // Parse hex to RGB, then create 1-2 shades lighter for surfaces/cards
      const hex2rgb = (hex: string) => {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
      };
      const [r, g, b] = hex2rgb(bg);
      const nearBlack = `rgb(${Math.min(r+4,255)}, ${Math.min(g+4,255)}, ${Math.min(b+4,255)})`;
      const surface = `rgb(${Math.min(r+12,255)}, ${Math.min(g+12,255)}, ${Math.min(b+12,255)})`;
      const card = `rgb(${Math.min(r+8,255)}, ${Math.min(g+8,255)}, ${Math.min(b+8,255)})`;
      const elevated = `rgb(${Math.min(r+18,255)}, ${Math.min(g+18,255)}, ${Math.min(b+18,255)})`;
      const border = `rgba(${Math.min(r+40,255)}, ${Math.min(g+40,255)}, ${Math.min(b+40,255)}, 0.15)`;
      root.style.setProperty('--color-near-black', nearBlack);
      root.style.setProperty('--color-surface', surface);
      root.style.setProperty('--color-dark-surface', surface);
      root.style.setProperty('--color-dark-card', card);
      root.style.setProperty('--color-dark-elevated', elevated);
      root.style.setProperty('--color-dark-border', border);

      const palette = TEXT_PALETTES[theme.paletteId] || TEXT_PALETTES.warm;
      root.style.setProperty('--color-text', palette.text);
      root.style.setProperty('--color-white', palette.text);
      root.style.setProperty('--color-text-secondary', palette.textSecondary);
      root.style.setProperty('--color-text-muted', palette.textMuted);
      root.style.setProperty('--color-accent', palette.accent);
      root.style.setProperty('--color-accent-muted', palette.accentMuted);

      // SEO: dynamic meta tags
      document.title = `${data.profile.name} — ${data.profile.tagline}`;
      const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (metaDesc) metaDesc.content = `${data.profile.name} — ${data.profile.tagline}. Portfolio, œuvres, fresques et actualités.`;
      const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (metaTheme) metaTheme.content = bg;
    }
  }, [data.profile.appIcon, data.theme]);
  return null;
}

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Loading fallback for lazy pages
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-bar" />
    </div>
  );
}

function App() {
  return (
    <SiteDataProvider>
      <DynamicTheme />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalogue" element={<CataloguePage />} />
            <Route path="/catalogue/:id" element={<ArtworkDetailPage />} />
            <Route path="/filter" element={<FilterPage />} />
            <Route path="/fresques" element={<FresquesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/journal" element={<NewsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Suspense>
        <BottomNav />
        <WelcomeSheet />
      </BrowserRouter>
    </SiteDataProvider>
  );
}

export default App;
