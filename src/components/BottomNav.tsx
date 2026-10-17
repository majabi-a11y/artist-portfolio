import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { Menu, X } from 'lucide-react';

// Detect if running as installed PWA
function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsPWA(mq.matches || (navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isPWA;
}



export default function BottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useSiteData();
  const isPWA = useIsPWA();

  const menuItems = useMemo(() => {
    // Use homeNav order as source of truth for menu order
    const homeItems = (data.homeNav || [])
      .filter(item => !item.pwaOnly || isPWA)
      .map(item => ({
        label: item.label,
        route: item.route,
        textColor: item.textColor || '#f4efe9',
      }));

    let items = homeItems.length ? homeItems : (
      data.menuConfig?.items?.length ? data.menuConfig.items : [
        { label: 'Accueil', route: '/', textColor: '#f4efe9' },
        { label: 'Catalogue', route: '/catalogue', textColor: '#f4efe9' },
        { label: 'Atelier', route: '/portfolio', textColor: '#f4efe9' },
        { label: 'Journal', route: '/journal', textColor: '#f4efe9' },
        { label: 'Contact', route: '/contact', textColor: '#f4efe9' },
      ]
    );
    // Deduplicate by route AND by label (case-insensitive)
    const seenRoutes = new Set<string>();
    const seenLabels = new Set<string>();
    items = items.filter(i => {
      const labelKey = i.label.toLowerCase().trim();
      if (seenRoutes.has(i.route) || seenLabels.has(labelKey)) return false;
      seenRoutes.add(i.route);
      seenLabels.add(labelKey);
      return true;
    });
    return items;
  }, [data.homeNav, data.menuConfig, isPWA]);

  const lineConfig = useMemo(() => {
    const cfg = data.menuConfig || { items: [], lineColor: '#ff5c9d', lineThickness: 4 };
    return { color: cfg.lineColor || '#ff5c9d', thickness: cfg.lineThickness || 4 };
  }, [data.menuConfig]);

  const handleClick = useCallback((route: string) => {
    setIsOpen(false);
    navigate(route);
  }, [navigate]);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) setIsOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <>
      <header className="top-header" id="top-header">
        <button className="header-logo" onClick={() => { setIsOpen(false); navigate('/'); }} id="header-logo">
          {data.profile.name.toUpperCase()}
        </button>
        <button className="header-menu-btn" onClick={() => setIsOpen(!isOpen)} id="menu-toggle"
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}>
          {isOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </header>

      <div className={`menu-overlay ${isOpen ? 'open' : ''}`} id="menu-overlay">
        <nav className="menu-nav">
          {menuItems.map((item, i) => {
            // Per-line config: lines[i-1] corresponds to the line before item i
            const cfg = data.menuConfig || { items: [], lines: [], lineColor: '#ff5c9d', lineThickness: 4 };
            const lineIdx = i - 1;
            const lineCfg = cfg.lines?.[lineIdx];
            const lColor = lineCfg?.color || cfg.lineColor || '#ff5c9d';
            const lThick = lineCfg?.thickness || cfg.lineThickness || 4;
            const lOffset = lineCfg?.offsetX ?? 10;
            const lWidth = lineCfg?.width ?? 30;
            return (
              <div key={item.route}>
                {/* Decorative line before each item (except first) */}
                {i > 0 && (
                  <div className="menu-line-deco" style={{ paddingLeft: `${lOffset}%` }}>
                    <div className="menu-line-segment" style={{
                      width: `${lWidth}%`,
                      height: `${lThick}px`,
                      background: lColor,
                    }} />
                  </div>
                )}
                <button
                  className={`menu-link ${location.pathname === item.route ? 'active' : ''}`}
                  onClick={() => handleClick(item.route)}
                  style={{
                    animationDelay: isOpen ? `${i * 70 + 80}ms` : '0ms',
                    color: item.textColor || undefined,
                  }}
                >
                  <span className="menu-link-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="menu-link-label">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

      </div>
    </>
  );
}

export { useIsPWA };
