import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
  startIndex?: number;
  alt?: string;
  onClose: () => void;
}

export default function ImageViewer({ images, startIndex = 0, alt = '', onClose }: ImageViewerProps) {
  const [current, setCurrent] = useState(startIndex);
  const touchStartX = useRef(0);
  const N = images.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % N), [N]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + N) % N), [N]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, next, prev]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
  };

  // Dans <body> : les pages animées font perdre à « position: fixed » son ancrage à l'écran
  return createPortal(
    <div className="image-viewer-overlay" onClick={e => { e.stopPropagation(); onClose(); }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button className="image-viewer-close" aria-label="Fermer">
        <X size={20} />
      </button>

      {N > 1 && (
        <>
          <button className="image-viewer-nav image-viewer-prev"
            onClick={e => { e.stopPropagation(); prev(); }}>
            <ChevronLeft size={28} />
          </button>
          <button className="image-viewer-nav image-viewer-next"
            onClick={e => { e.stopPropagation(); next(); }}>
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div className="image-viewer-content" onClick={e => e.stopPropagation()}>
        <img
          src={images[current]}
          alt={`${alt} ${current + 1}`}
          className="image-viewer-img"
          draggable={false}
        />
      </div>

      {N > 1 && (
        <div className="image-viewer-counter">
          {current + 1} / {N}
        </div>
      )}
    </div>,
    document.body,
  );
}
