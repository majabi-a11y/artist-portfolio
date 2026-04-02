import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { SiteDataProvider, useSiteData } from './contexts/SiteDataContext';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import FilterPage from './pages/FilterPage';
import CataloguePage from './pages/CataloguePage';
import AdminPage from './pages/AdminPage';

function DynamicFavicon() {
  const { data } = useSiteData();
  useEffect(() => {
    if (data.profile.appIcon) {
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
      if (link) link.href = data.profile.appIcon;
      if (apple) apple.href = data.profile.appIcon;
    }
  }, [data.profile.appIcon]);
  return null;
}

function App() {
  return (
    <SiteDataProvider>
      <DynamicFavicon />
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
