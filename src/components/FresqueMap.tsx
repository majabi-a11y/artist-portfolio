import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Artwork } from '../data/defaultData';
import { thumb } from '../data/defaultData';

interface Props {
  fresques: Artwork[];
  /** Fresque à centrer et dont la bulle s'ouvre */
  focusId?: string | null;
  onOpen: (id: string) => void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * Carte de toutes les fresques (fond OpenStreetMap, sans clé ni compte) ;
 * chaque bulle propose « Voir la fresque » et « Itinéraire » dans Google Maps.
 */
export default function FresqueMap({ fresques, focusId, onOpen }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false, attributionControl: true });
    // Tuiles OpenStreetMap (libres, mention obligatoire), adoucies en gris papier par la feuille de style
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);
    const icon = L.divIcon({ className: 'fresque-pin', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] });
    const points: L.LatLngExpression[] = [];
    for (const f of fresques) {
      if (!f.coords) continue;
      const [lat, lng] = f.coords;
      const gmaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      const marker = L.marker([lat, lng], { icon, title: f.title }).addTo(m).bindPopup(`
        <div class="fresque-popup">
          ${f.images[0] ? `<img src="${esc(thumb(f.images[0]))}" alt="">` : ''}
          <strong>${esc(f.title)}</strong>
          <span>${esc([f.lieu, f.year].filter(Boolean).join(' · '))}</span>
          <div class="fresque-popup-links">
            <button type="button" data-open="${esc(f.id)}">Voir la fresque</button>
            <a href="${gmaps}" target="_blank" rel="noopener noreferrer">Itinéraire ↗</a>
          </div>
        </div>`, { maxWidth: 220 });
      markers.current.set(f.id, marker);
      points.push([lat, lng]);
    }
    if (points.length) m.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    m.on('popupopen', (e) => {
      e.popup.getElement()?.querySelector<HTMLButtonElement>('[data-open]')?.addEventListener('click', (ev) => {
        onOpen((ev.currentTarget as HTMLButtonElement).dataset.open!);
      });
    });
    map.current = m;
    return () => { m.remove(); map.current = null; markers.current.clear(); };
  }, [fresques, onOpen]);

  useEffect(() => {
    if (!focusId || !map.current) return;
    const marker = markers.current.get(focusId);
    if (marker) { map.current.setView(marker.getLatLng(), 12); marker.openPopup(); }
  }, [focusId]);

  return (
    <div className="fresque-map-wrap">
      <div ref={el} className="fresque-map" />
      <p className="fresque-map-note">Emplacements approximatifs (ville ou lieu de la fresque).</p>
    </div>
  );
}
