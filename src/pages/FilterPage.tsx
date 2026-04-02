import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Download, RotateCcw, Sliders } from 'lucide-react';
import {
  applyDaSilvaFilter,
  loadImage,
  extractImageData,
  downloadFilteredImage,
  DEFAULT_OPTIONS,
  type FilterOptions,
  type ColorPalette,
} from '../utils/artFilter';

const PALETTE_OPTIONS: { id: ColorPalette; label: string; swatch: string; trame: string }[] = [
  { id: 'realColors', label: 'Réel', swatch: 'linear-gradient(135deg, #4a7c4f, #c89040, #7a7a7a)', trame: 'auto' },
  { id: 'roseFluo', label: 'Rose Fluo', swatch: 'linear-gradient(135deg, #00bcd4, #6a1b9a, #ff00ff)', trame: '#ff00ff' },
  { id: 'grisFluo', label: 'N&B Fluo', swatch: 'linear-gradient(135deg, #000, #888, #ff00ff)', trame: '#ff00ff' },
  { id: 'sunset', label: 'Sunset', swatch: 'linear-gradient(135deg, #e87040, #cc7040, #3d1308)', trame: '#5b8abf' },
  { id: 'speciale', label: 'Spéciale', swatch: 'linear-gradient(135deg, #e8706a, #283593, #ff1493)', trame: '#e8706a' },
];

export default function FilterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [hasImage, setHasImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [options, setOptions] = useState<FilterOptions>({ ...DEFAULT_OPTIONS });
  const [filterTrigger, setFilterTrigger] = useState(0);

  const runFilter = useCallback((opts: FilterOptions) => {
    const out = outputCanvasRef.current;
    const imgData = imageDataRef.current;
    if (!out || !imgData) return false;
    setIsProcessing(true);
    applyDaSilvaFilter(imgData, out, opts);
    setIsProcessing(false);
    return true;
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const { img, url } = await loadImage(file);
      objectUrlRef.current = url;
      const imgData = extractImageData(img, 800, 800);
      imageDataRef.current = imgData;
      setHasImage(true);
      setFilterTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error loading image:', err);
    }
  };

  useEffect(() => {
    if (!hasImage || !imageDataRef.current) return;
    let attempts = 0;
    function tryApply() {
      attempts++;
      const success = runFilter(options);
      if (!success && attempts < 10) setTimeout(tryApply, 100);
    }
    const timer = setTimeout(tryApply, 50);
    return () => clearTimeout(timer);
  }, [hasImage, filterTrigger, options, runFilter]);

  useEffect(() => {
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleReset = () => {
    setHasImage(false);
    setShowControls(false);
    setOptions({ ...DEFAULT_OPTIONS });
    imageDataRef.current = null;
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (outputCanvasRef.current) downloadFilteredImage(outputCanvasRef.current, 'adrien-da-silva-halftone');
  };

  const updateOption = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="page filter-page" id="filter-page">
      <div className="page-header">
        <h1>Filtre</h1>
        <p>Transformez vos photos en halftone lines</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id="file-input"
      />

      {!hasImage ? (
        <div className="page-content animate-in">
          <div className="filter-upload-zone" onClick={handleUploadClick} id="upload-zone">
            <Camera size={48} style={{ color: 'var(--color-accent-muted)', marginBottom: '16px' }} />
            <h3>Prendre une photo ou importer</h3>
            <p>Tapez pour ouvrir l'appareil photo ou choisir une image</p>
          </div>

          <div style={{
            marginTop: '24px', padding: '24px',
            background: 'var(--color-dark-card)',
            border: '1px solid var(--color-dark-border)',
          }}>
            <h3 style={{ marginBottom: '10px' }}>Comment ça marche ?</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.75 }}>
              Le filtre analyse la luminosité de votre photo et la reconstruit avec des lignes
              horizontales continues dont l'<strong>épaisseur varie</strong> : épaisses dans les zones
              sombres, fines dans les zones claires. Choisissez parmi plusieurs palettes de couleurs
              et ajustez la densité, l'épaisseur et la fusion des couleurs.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
            <button className="btn btn-primary btn-block" onClick={handleUploadClick} id="btn-camera">
              <Camera size={16} /> Photo
            </button>
            <button className="btn btn-outline btn-block" onClick={handleUploadClick} id="btn-gallery">
              <Upload size={16} /> Galerie
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-in">
          <div className="filter-canvas-container" id="filter-result">
            <canvas ref={outputCanvasRef} style={{ width: '100%', height: 'auto' }} />
            {isProcessing && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', color: 'var(--color-text-secondary)',
              }}>
                Transformation en cours...
              </div>
            )}
          </div>

          <div className="page-content" style={{ paddingBottom: '8px' }}>
            <button
              className={`btn ${showControls ? 'btn-primary' : 'btn-outline'} btn-block btn-sm`}
              onClick={() => setShowControls(!showControls)}
              id="toggle-controls"
            >
              <Sliders size={14} />
              {showControls ? 'Masquer les réglages' : 'Ajuster le filtre'}
            </button>
          </div>

          {showControls && (
            <div className="filter-controls animate-in">

              {/* ── Color palette ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Palette couleur</span>
                </div>
                <div className="color-mode-options">
                  {PALETTE_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      className={`color-mode-btn ${options.palette === p.id ? 'active' : ''}`}
                      onClick={() => updateOption('palette', p.id)}
                      id={`palette-${p.id}`}
                    >
                      <div className="color-swatch" style={{ background: p.swatch }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Nombre de couleurs ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Nombre de couleurs</span>
                  <span>{options.colorCount}</span>
                </div>
                <input className="filter-slider" type="range"
                  min="2" max="24" value={options.colorCount}
                  onChange={(e) => updateOption('colorCount', parseInt(e.target.value))}
                  id="slider-colors"
                />
                <div className="filter-control-hint">Moins = plus simple, plus = plus de nuances</div>
              </div>

              {/* ── Densité (line spacing) ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Densité des lignes</span>
                  <span>{options.lineSpacing}px</span>
                </div>
                <input className="filter-slider" type="range"
                  min="4" max="24" value={options.lineSpacing}
                  onChange={(e) => updateOption('lineSpacing', parseInt(e.target.value))}
                  id="slider-density"
                />
                <div className="filter-control-hint">Plus petit = plus de lignes</div>
              </div>

              {/* ── Épaisseur pleine ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Épaisseur pleine</span>
                  <span>{options.maxThickness}px</span>
                </div>
                <input className="filter-slider" type="range"
                  min="2" max="16" value={options.maxThickness}
                  onChange={(e) => updateOption('maxThickness', parseInt(e.target.value))}
                  id="slider-thickness"
                />
                <div className="filter-control-hint">Épaisseur des lignes dans les zones sombres</div>
              </div>

              {/* ── Épaisseur trame ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Épaisseur trame</span>
                  <span>{Math.round(options.trameRatio * 100)}%</span>
                </div>
                <input className="filter-slider" type="range"
                  min="5" max="80" value={Math.round(options.trameRatio * 100)}
                  onChange={(e) => updateOption('trameRatio', parseInt(e.target.value) / 100)}
                  id="slider-trame"
                />
                <div className="filter-control-hint">Finesse de la trame (% de l'épaisseur pleine)</div>
              </div>

              {/* ── Fusion couleurs ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Fusion des couleurs</span>
                  <span>{options.mergeTolerance}°</span>
                </div>
                <input className="filter-slider" type="range"
                  min="0" max="90" value={options.mergeTolerance}
                  onChange={(e) => updateOption('mergeTolerance', parseInt(e.target.value))}
                  id="slider-merge"
                />
                <div className="filter-control-hint">Plus haut = lignes plus longues, moins de détails couleur</div>
              </div>

              {/* ── Résolution ── */}
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Résolution</span>
                  <span>{options.segmentWidth}px</span>
                </div>
                <input className="filter-slider" type="range"
                  min="2" max="14" value={options.segmentWidth}
                  onChange={(e) => updateOption('segmentWidth', parseInt(e.target.value))}
                  id="slider-segment"
                />
                <div className="filter-control-hint">Taille des capsules, plus petit = plus de détails</div>
              </div>
            </div>
          )}

          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={handleReset} id="btn-reset">
              <RotateCcw size={14} /> Nouvelle
            </button>
            <button className="btn btn-primary" onClick={handleDownload} id="btn-download" style={{ flex: 1 }}>
              <Download size={14} /> Télécharger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
