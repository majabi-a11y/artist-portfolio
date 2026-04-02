import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { Menu, X } from 'lucide-react';

const navItems = [
  { id: 'hero', label: 'Accueil' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'journal', label: 'Journal' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'filter-section', label: 'Filtre', route: '/filter' },
  { id: 'admin-section', label: 'Admin', route: '/admin' },
];

export default function BottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useSiteData();

  const scrollToSection = useCallback((id: string) => {
    // If not on homepage, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.pathname, navigate]);

  const handleClick = (item: typeof navItems[0]) => {
    setIsOpen(false);
    if (item.route) {
      navigate(item.route);
    } else {
      scrollToSection(item.id);
    }
  };

  return (
    <>
      <header className="top-header" id="top-header">
        <button
          className="header-logo"
          onClick={() => {
            if (location.pathname !== '/') navigate('/');
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="header-logo"
        >
          {data.profile.name.toUpperCase()}
        </button>
        <button
          className="header-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          id="menu-toggle"
          aria-label="Menu"
        >
          {isOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </header>

      <div className={`menu-overlay ${isOpen ? 'open' : ''}`} id="menu-overlay">
        <nav className="menu-nav">
          {navItems.map(({ id, label, route }, i) => (
            <button
              key={id}
              className="menu-link"
              onClick={() => handleClick({ id, label, route })}
              style={{ animationDelay: isOpen ? `${i * 70 + 80}ms` : '0ms' }}
            >
              <span className="menu-link-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="menu-link-label">{label}</span>
            </button>
          ))}
        </nav>
        <div className="menu-footer">
          <span>© 2024</span>
          <span>contact@adriendasilva.com</span>
        </div>
      </div>
    </>
  );
}
