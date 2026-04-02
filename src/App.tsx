import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SiteDataProvider } from './contexts/SiteDataContext';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import FilterPage from './pages/FilterPage';
import CataloguePage from './pages/CataloguePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <SiteDataProvider>
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
