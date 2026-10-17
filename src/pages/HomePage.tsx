import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { useIsPWA } from '../components/BottomNav';
import { Download, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { data } = useSiteData();
  const { profile, homeNav } = data;
  const isPWA = useIsPWA();

  const slides = useMemo(() => {
    return (homeNav || [])
      .filter(item => !item.pwaOnly || isPWA)
      .map(item => ({
        ...item,
        image: item.direction === 'bio' ? (item.image || profile.heroBanner || '') : item.image,
      }));
  }, [homeNav, isPWA, profile.heroBanner]);

  const N = slides.length;
  const [current, setCurrent] = useState(0);
  const isMoving = useRef(false);
  const touchStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const moveTo = useCallback((next: number) => {
    if (isMoving.current || N === 0) return;
    isMoving.current = true;
    setCurrent(((next % N) + N) % N);
    setTimeout(() => { isMoving.current = false; }, 500);
  }, [N]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveTo(current + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveTo(current - 1); }
      else if (e.key === 'Enter') {
        const s = slides[current];
        if (s?.route && s.route !== '/') navigate(s.route);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, moveTo, navigate, slides]);

  // Touch swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(dx) > 40) { dx < 0 ? moveTo(current + 1) : moveTo(current - 1); }
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd); };
  }, [current, moveTo]);

  // Mouse wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let accum = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      accum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (Math.abs(accum) > 30) { accum > 0 ? moveTo(current + 1) : moveTo(current - 1); }
        accum = 0;
      }, 80);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { el.removeEventListener('wheel', onWheel); if (timer) clearTimeout(timer); };
  }, [current, moveTo]);

  // Auto-scroll: 6s interval, pause on interaction, resume after 15s
  useEffect(() => {
    if (N <= 1) return;

    const startAutoPlay = () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = setInterval(() => {
        setCurrent(c => (c + 1) % N);
      }, 6000);
    };

    const pause = () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(startAutoPlay, 15000);
    };

    startAutoPlay();
    const el = containerRef.current;
    el?.addEventListener('pointerdown', pause);
    el?.addEventListener('touchstart', pause);

    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      el?.removeEventListener('pointerdown', pause);
      el?.removeEventListener('touchstart', pause);
    };
  }, [N]);

  const handleClick = (idx: number) => {
    const s = slides[idx];
    if (s?.pwaOnly && !isPWA) {
      if (deferredPrompt) deferredPrompt.prompt();
      else alert('Installez l\'application pour accéder au filtre artistique.');
      return;
    }
    if (s?.route && s.route !== '/') navigate(s.route);
  };

  if (N === 0) return <div className="spatial-home" />;

  const prevIdx = ((current - 1) + N) % N;
  const nextIdx = (current + 1) % N;

  return (
    <div className="spatial-home" ref={containerRef} id="home-page">
      <div className="carousel-1d">
        {[prevIdx, current, nextIdx].map((idx, pos) => {
          const slide = slides[idx];
          if (!slide) return null;
          const offset = pos - 1;
          const tc = slide.textColor || '#f2ede8';
          const isFilterWebOnly = slide.pwaOnly && !isPWA;

          return (
            <div
              key={`${idx}-${pos}`}
              className={`carousel-1d-slide ${offset === 0 ? 'carousel-1d-active' : ''}`}
              style={{
                transform: `translateX(${offset * 100}%)`,
                backgroundColor: slide.bgColor || undefined,
              }}
              onClick={() => offset === 0 ? handleClick(idx) : moveTo(idx)}
            >
              {slide.image && (
                <img src={slide.image} alt="" className="spatial-card-bg" />
              )}

              {isFilterWebOnly ? (
                <div className="spatial-card-content" style={{ textAlign: 'center', alignItems: 'center' }}>
                  <span className="spatial-card-label" style={{ color: tc }}>{slide.label}</span>
                  <span className="spatial-card-subtitle" style={{ color: tc, opacity: 0.6 }}>{slide.subtitle}</span>
                  <button className="btn btn-outline" style={{
                    marginTop: '24px', fontSize: '0.72rem', padding: '10px 20px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    color: tc, borderColor: `${tc}33`,
                  }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (deferredPrompt) deferredPrompt.prompt();
                      else alert('Installez l\'application pour accéder au filtre artistique.');
                    }}>
                    <Download size={14} /> Installer l'app
                  </button>
                </div>
              ) : (
                <div className="spatial-card-content">
                  <span className="spatial-card-label" style={{ color: tc }}>{slide.label}</span>
                  <span className="spatial-card-subtitle" style={{ color: tc, opacity: 0.6 }}>{slide.subtitle}</span>
                  {slide.route && slide.route !== '/' && offset === 0 && (
                    <span className="slide-cta" style={{ color: tc }}>
                      Découvrir <ArrowRight size={14} />
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="carousel-1d-dots">
        {slides.map((_, i) => (
          <button key={i} className={`carousel-1d-dot ${i === current ? 'active' : ''}`}
            onClick={() => moveTo(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      <div className="carousel-1d-hints">
        <span className="carousel-1d-hint">
          {slides[prevIdx]?.label} ←
        </span>
        <span className="carousel-1d-hint">
          → {slides[nextIdx]?.label}
        </span>
      </div>
    </div>
  );
}
