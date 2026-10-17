import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Download, RotateCcw } from 'lucide-react';
import BackButton from '../components/BackButton';
import {
  applyLineFilter,
  loadImage,
  extractImageData,
  downloadCanvas,
  DEFAULT_LINE_OPTIONS,
  LINE_PALETTES,
  ANALYSIS_SIZE,
  EXPORT_SIZE,
  type LineOptions,
} from '../utils/lineFilter';

export default function FilterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [hasImage, setHasImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [options, setOptions] = useState<LineOptions>({ ...DEFAULT_LINE_OPTIONS });

  // Aperçu : dessiné à 2× la taille d'analyse, net sur un écran de téléphone
  const runFilter = useCallback((opts: LineOptions) => {
    const out = outputCanvasRef.current;
    const imgData = imageDataRef.current;
    if (!out || !imgData) return;
    requestAnimationFrame(() => applyLineFilter(imgData, out, opts, 2));
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const { img, url } = await loadImage(file);
      imageDataRef.current = extractImageData(img, ANALYSIS_SIZE);
      URL.revokeObjectURL(url);
      setHasImage(true);
    } catch (err) {
      console.error('Image illisible :', err);
    }
  };

  useEffect(() => {
    if (!hasImage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runFilter(options), 60);
  }, [hasImage, options, runFilter]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleReset = () => {
    setHasImage(false);
    setOptions({ ...DEFAULT_LINE_OPTIONS });
    imageDataRef.current = null;
  };

  // Export : même dessin, en grand (côté long ≈ EXPORT_SIZE px)
  const handleDownload = async () => {
    const imgData = imageDataRef.current;
    if (!imgData) return;
    setIsSaving(true);
    try {
      const big = document.createElement('canvas');
      applyLineFilter(imgData, big, options, EXPORT_SIZE / Math.max(imgData.width, imgData.height));
      await downloadCanvas(big, `adrien-da-silva-filtre-${options.palette}`);
    } finally {
      setIsSaving(false);
    }
  };

  const update = <K extends keyof LineOptions>(key: K, value: LineOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const palette = LINE_PALETTES.find(p => p.id === options.palette) ?? LINE_PALETTES[0];

  return (
    <div className="page filter-page" id="filter-page" style={{ paddingTop: '60px' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-input" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} id="camera-input" />

      {!hasImage ? (
        <div className="page-content animate-in" style={{ paddingTop: '20px' }}>
          <BackButton />
          <h1 className="page-title" style={{ marginBottom: '8px' }}>Filtre</h1>
          <p className="page-subtitle" style={{ marginBottom: '12px' }}>
            Votre photo en lignes, à la manière d'Adrien
          </p>
          <p className="filter-intro">
            Tirets à bouts ronds, deux tons d'une même encre, le fond qui respire : six palettes
            tirées de ses toiles. L'image reste sur votre appareil, rien n'est envoyé.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="filter-upload-zone" onClick={() => fileInputRef.current?.click()} id="upload-zone">
              <Upload size={36} style={{ color: 'var(--color-accent-muted)', marginBottom: '12px' }} />
              <h3>Importer une photo</h3>
              <p>Depuis la galerie ou les fichiers</p>
            </div>

            <div className="filter-upload-zone" onClick={() => cameraInputRef.current?.click()} id="camera-zone">
              <Camera size={36} style={{ color: 'var(--color-accent-muted)', marginBottom: '12px' }} />
              <h3>Prendre une photo</h3>
              <p>Ouvrir l'appareil photo</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="filter-split-layout">
          <div className="filter-sticky-preview">
            <div className="filter-canvas-container" id="filter-result">
              <canvas ref={outputCanvasRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '8px 16px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleReset} id="btn-reset" style={{ flex: 0 }} aria-label="Recommencer">
                <RotateCcw size={13} />
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()} style={{ flex: 0 }} aria-label="Autre photo">
                <Upload size={13} />
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDownload} id="btn-download" style={{ flex: 1 }} disabled={isSaving}>
                <Download size={13} /> {isSaving ? 'Préparation…' : 'Enregistrer en haute définition'}
              </button>
            </div>
          </div>

          <div className="filter-scroll-controls">
            <div className="filter-controls" style={{ display: 'block' }}>
              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Palette</span>
                  <span className="filter-palette-source">d'après « {palette.source} »</span>
                </div>
                <div className="color-mode-options palette-grid">
                  {LINE_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      className={`color-mode-btn ${options.palette === p.id ? 'active' : ''}`}
                      onClick={() => update('palette', p.id)}
                      id={`palette-${p.id}`}
                    >
                      <span className="palette-chips">
                        <i style={{ background: p.ground }} />
                        <i style={{ background: p.mid }} />
                        <i style={{ background: p.ink }} />
                        <i style={{ background: p.accent }} />
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-control-group">
                <div className="filter-control-label"><span>Sens des lignes</span></div>
                <div className="filter-toggle">
                  <button className={!options.vertical ? 'active' : ''} onClick={() => update('vertical', false)}>Horizontal</button>
                  <button className={options.vertical ? 'active' : ''} onClick={() => update('vertical', true)}>Vertical</button>
                </div>
              </div>

              <div className="filter-control-group">
                <div className="filter-control-label"><span>Nombre de lignes</span><span>{options.lines}</span></div>
                <input className="filter-slider" type="range" min="40" max="160" step="2" value={options.lines}
                  onChange={(e) => update('lines', parseInt(e.target.value))} id="slider-lines" />
              </div>

              <div className="filter-control-group">
                <div className="filter-control-label"><span>Épaisseur des tirets</span><span>{Math.round(options.weight * 100)} %</span></div>
                <input className="filter-slider" type="range" min="30" max="100" value={Math.round(options.weight * 100)}
                  onChange={(e) => update('weight', parseInt(e.target.value) / 100)} id="slider-weight" />
              </div>

              <div className="filter-control-group">
                <div className="filter-control-label"><span>Lumière</span><span>{Math.round(options.threshold * 100)}</span></div>
                <input className="filter-slider" type="range" min="15" max="75" value={Math.round(options.threshold * 100)}
                  onChange={(e) => update('threshold', parseInt(e.target.value) / 100)} id="slider-light" />
                <p className="filter-control-hint">Plus haut : plus de surfaces laissées vides.</p>
              </div>

              <div className="filter-control-group">
                <div className="filter-control-label"><span>Longueur des tirets</span><span>{options.dash}</span></div>
                <input className="filter-slider" type="range" min="2" max="30" value={options.dash}
                  onChange={(e) => update('dash', parseInt(e.target.value))} id="slider-dash" />
              </div>

              <div className="filter-control-group filter-switches">
                <label><input type="checkbox" checked={options.trame} onChange={(e) => update('trame', e.target.checked)} /> Trame fine dans les clairs</label>
                <label><input type="checkbox" checked={options.accent} onChange={(e) => update('accent', e.target.checked)} /> Touches fluo</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
