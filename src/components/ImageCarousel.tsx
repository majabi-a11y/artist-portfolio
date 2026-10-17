import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ImageViewer from './ImageViewer';
import { thumb } from '../data/defaultData';

interface Props {
  images: string[];
  alt?: string;
  height?: string;
  className?: string;
  fit?: 'cover' | 'contain'; // contain : l'œuvre entière, sans recadrage
}

export default function ImageCarousel({ images, alt = '', height = '240px', className = '', fit = 'cover' }: Props) {
  const [current, setCurrent] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const count = images.length;

  if (count === 0) return null;
  if (count === 1) {
    return (
      <>
        <div className={`img-carousel ${className}`} style={{ height, cursor: 'zoom-in' }}
          onClick={() => setViewerOpen(true)}>
          <img src={thumb(images[0])} alt={alt} style={{ width: '100%', height: '100%', objectFit: fit }} loading="lazy" />
        </div>
        {viewerOpen && (
          <ImageViewer images={images} startIndex={0} alt={alt} onClose={() => setViewerOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className={`img-carousel ${className}`} style={{ height, position: 'relative', overflow: 'hidden' }}>
        {images.map((src, i) => (
          <img
            key={i}
            src={thumb(src)}
            alt={`${alt} ${i + 1}`}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit,
              opacity: i === current ? 1 : 0,
              transition: 'opacity 0.4s ease',
              cursor: 'zoom-in',
            }}
            loading="lazy"
            onClick={() => setViewerOpen(true)}
          />
        ))}

        {/* Nav arrows */}
        <button onClick={(e) => { e.stopPropagation(); setCurrent((current - 1 + count) % count); }}
          className="img-carousel-arrow img-carousel-arrow-left" aria-label="Image précédente">
          <ChevronLeft size={16} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setCurrent((current + 1) % count); }}
          className="img-carousel-arrow img-carousel-arrow-right" aria-label="Image suivante">
          <ChevronRight size={16} />
        </button>

        {/* Dots */}
        <div className="img-carousel-dots">
          {images.map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`img-carousel-dot ${i === current ? 'active' : ''}`}
              aria-label={`Image ${i + 1}`} />
          ))}
        </div>
      </div>

      {viewerOpen && (
        <ImageViewer images={images} startIndex={current} alt={alt} onClose={() => setViewerOpen(false)} />
      )}
    </>
  );
}
