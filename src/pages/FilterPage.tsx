import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, Download, RotateCcw, Layers, ArrowLeftRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import {
  applyLineFilter,
  applyOverlay,
  fitTo,
  placePreset,
  FRONT_PRESETS,
  type FrontPreset,
  loadImage,
  extractImageData,
  downloadCanvas,
  DEFAULT_LINE_OPTIONS,
  DEFAULT_OVERLAY_OPTIONS,
  LINE_PALETTES,
  ANALYSIS_SIZE,
  EXPORT_SIZE,
  type LineOptions,
  type OverlayOptions,
} from '../utils/lineFilter';

type Mode = 'une' | 'deux';
type Slot = 'back' | 'front';

/** Réglage de lumière / sensibilité : -1 … +1, affiché « auto » au centre. */
const lightLabel = (v: number) => (v === 0 ? 'auto' : v > 0 ? `+${Math.round(v * 10)}` : String(Math.round(v * 10)));

export default function FilterPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSlot = useRef<Slot>('back');

  // Photos analysées (le premier plan est recadré aux dimensions du fond)
  const backImg = useRef<HTMLImageElement | null>(null);
  const frontImg = useRef<HTMLImageElement | null>(null);
  const frontPreset = useRef<FrontPreset | null>(null); // végétation tirée d'une toile d'Adrien
  const backData = useRef<ImageData | null>(null);
  const frontData = useRef<ImageData | null>(null);
  const [thumbs, setThumbs] = useState<{ back?: string; front?: string }>({});

  const [mode, setMode] = useState<Mode>('une');
  const [ready, setReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [single, setSingle] = useState<LineOptions>({ ...DEFAULT_LINE_OPTIONS });
  const [overlay, setOverlay] = useState<OverlayOptions>({ ...DEFAULT_OVERLAY_OPTIONS });

  const render = useCallback((canvas: HTMLCanvasElement, scale: number) => {
    if (mode === 'deux' && backData.current && frontData.current) applyOverlay(backData.current, frontData.current, canvas, overlay, scale);
    else if (backData.current) applyLineFilter(backData.current, canvas, single, scale);
  }, [mode, overlay, single]);

  // Aperçu : 2× la taille d'analyse, net sur un téléphone
  useEffect(() => {
    if (!ready) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const out = outputCanvasRef.current;
      if (out) requestAnimationFrame(() => render(out, 2));
    }, 50);
  }, [ready, render, thumbs]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const refit = () => {
    const b = backData.current;
    if (!frontImg.current || !b) return;
    frontData.current = frontPreset.current
      ? placePreset(frontImg.current, frontPreset.current.layout, b.width, b.height)
      : fitTo(frontImg.current, b.width, b.height);
  };

  const choosePreset = async (preset: FrontPreset) => {
    const img = new Image();
    img.src = preset.src;
    await img.decode();
    frontImg.current = img;
    frontPreset.current = preset;
    refit();
    setOverlay(o => ({ ...o, frontKind: 'peinture' }));
    setThumbs(t => { if (t.front?.startsWith('blob:')) URL.revokeObjectURL(t.front); return { ...t, front: preset.src }; });
    setReady(Boolean(backData.current));
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const { img, url } = await loadImage(file);
      if (pendingSlot.current === 'back') {
        backImg.current = img;
        backData.current = extractImageData(img, ANALYSIS_SIZE);
        refit();
      } else {
        frontImg.current = img;
        frontPreset.current = null;
        refit();
        setOverlay(o => ({ ...o, frontKind: 'photo' }));
      }
      setThumbs(t => {
        const old = t[pendingSlot.current];
        if (old?.startsWith('blob:')) URL.revokeObjectURL(old);
        return { ...t, [pendingSlot.current]: url };
      });
      setReady(Boolean(backData.current) && (mode === 'une' || Boolean(frontData.current)));
    } catch (err) {
      console.error('Image illisible :', err);
    }
  };

  const pick = (slot: Slot, camera = false) => {
    pendingSlot.current = slot;
    (camera ? cameraInputRef : fileInputRef).current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setReady(Boolean(backData.current) && (m === 'une' || Boolean(frontData.current)));
  };

  const handleReset = () => {
    Object.values(thumbs).forEach(u => u?.startsWith('blob:') && URL.revokeObjectURL(u));
    backImg.current = frontImg.current = null;
    frontPreset.current = null;
    backData.current = frontData.current = null;
    setThumbs({});
    setReady(false);
    setSingle({ ...DEFAULT_LINE_OPTIONS });
    setOverlay({ ...DEFAULT_OVERLAY_OPTIONS });
  };

  // Export : même dessin, en grand (côté long ≈ EXPORT_SIZE px)
  const handleDownload = async () => {
    const d = backData.current;
    if (!d) return;
    setIsSaving(true);
    try {
      const big = document.createElement('canvas');
      render(big, EXPORT_SIZE / Math.max(d.width, d.height));
      const palette = mode === 'deux' ? overlay.palette : single.palette;
      await downloadCanvas(big, `adrien-da-silva-filtre-${mode === 'deux' ? 'superposition-' : ''}${palette}`);
    } finally {
      setIsSaving(false);
    }
  };

  const palette = mode === 'deux' ? overlay.palette : single.palette;
  const setPalette = (id: string) => (mode === 'deux' ? setOverlay(o => ({ ...o, palette: id })) : setSingle(o => ({ ...o, palette: id })));
  const lines = mode === 'deux' ? overlay.lines : single.lines;
  const setLines = (n: number) => (mode === 'deux' ? setOverlay(o => ({ ...o, lines: n })) : setSingle(o => ({ ...o, lines: n })));
  const accent = mode === 'deux' ? overlay.accent : single.accent;
  const setAccent = (v: boolean) => (mode === 'deux' ? setOverlay(o => ({ ...o, accent: v })) : setSingle(o => ({ ...o, accent: v })));
  const pal = LINE_PALETTES.find(p => p.id === palette) ?? LINE_PALETTES[0];

  const Presets = (
    <div className="filter-presets">
      <p className="filter-presets-title">Ou un premier plan peint par Adrien</p>
      <div className="filter-presets-row">
        {FRONT_PRESETS.map(p => (
          <button key={p.id} className={`filter-preset ${thumbs.front === p.src ? 'active' : ''}`} onClick={() => choosePreset(p)}>
            <img src={p.src} alt="" />
            <strong>{p.label}</strong>
            <small>{p.source}</small>
          </button>
        ))}
      </div>
    </div>
  );

  const ModeSwitch = (
    <div className="filter-toggle filter-mode">
      <button className={mode === 'une' ? 'active' : ''} onClick={() => switchMode('une')}>Une photo</button>
      <button className={mode === 'deux' ? 'active' : ''} onClick={() => switchMode('deux')}><Layers size={13} /> Deux photos superposées</button>
    </div>
  );

  return (
    <div className="page filter-page" id="filter-page" style={{ paddingTop: '60px' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-input" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} id="camera-input" />

      {!ready ? (
        <div className="page-content animate-in" style={{ paddingTop: '20px' }}>
          <BackButton />
          <h1 className="page-title" style={{ marginBottom: '8px' }}>Filtre</h1>
          <p className="page-subtitle" style={{ marginBottom: '12px' }}>Votre photo en lignes, à la manière d'Adrien</p>
          <p className="filter-intro">
            {mode === 'une'
              ? "Tirets à bouts ronds, deux tons d'une même encre, le fond qui respire : six palettes tirées de ses toiles."
              : 'Un fond en lignes horizontales, un premier plan en lignes verticales qui ne garde que la végétation et les bâtiments, comme dans « Temps libre 2.0 ».'}
            {' '}L'image reste sur votre appareil, rien n'est envoyé.
          </p>
          {ModeSwitch}

          {mode === 'une' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="filter-upload-zone" onClick={() => pick('back')} id="upload-zone">
                <Upload size={36} style={{ color: 'var(--color-accent-muted)', marginBottom: '12px' }} />
                <h3>Importer une photo</h3>
                <p>Depuis la galerie ou les fichiers</p>
              </div>
              <div className="filter-upload-zone" onClick={() => pick('back', true)} id="camera-zone">
                <Camera size={36} style={{ color: 'var(--color-accent-muted)', marginBottom: '12px' }} />
                <h3>Prendre une photo</h3>
                <p>Ouvrir l'appareil photo</p>
              </div>
            </div>
          ) : (
            <div className="filter-slots">
              {(['back', 'front'] as Slot[]).map(slot => (
                <button key={slot} className={`filter-slot ${thumbs[slot] ? 'is-filled' : ''}`} onClick={() => pick(slot)}>
                  {thumbs[slot] ? <img src={thumbs[slot]} alt="" /> : <Upload size={26} />}
                  <strong>{slot === 'back' ? 'Fond' : 'Premier plan'}</strong>
                  <small>{slot === 'back' ? 'lignes horizontales' : 'végétation et bâtiments, lignes verticales'}</small>
                </button>
              ))}
            </div>
          )}
          {mode === 'deux' && Presets}
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
              <button className="btn btn-primary btn-sm" onClick={handleDownload} id="btn-download" style={{ flex: 1 }} disabled={isSaving}>
                <Download size={13} /> {isSaving ? 'Préparation…' : 'Enregistrer en haute définition'}
              </button>
            </div>
          </div>

          <div className="filter-scroll-controls">
            <div className="filter-controls" style={{ display: 'block' }}>
              <div className="filter-control-group">{ModeSwitch}</div>

              {mode === 'deux' && (
                <div className="filter-slots is-compact">
                  {(['back', 'front'] as Slot[]).map(slot => (
                    <button key={slot} className={`filter-slot ${thumbs[slot] ? 'is-filled' : ''}`} onClick={() => pick(slot)}>
                      {thumbs[slot] ? <img src={thumbs[slot]} alt="" /> : <Upload size={20} />}
                      <strong>{slot === 'back' ? 'Fond' : 'Premier plan'}</strong>
                      <small>Changer</small>
                    </button>
                  ))}
                </div>
              )}
              {mode === 'deux' && Presets}

              <div className="filter-control-group">
                <div className="filter-control-label">
                  <span>Palette</span>
                  <span className="filter-palette-source">d'après « {pal.source} »</span>
                </div>
                <div className="color-mode-options palette-grid">
                  {LINE_PALETTES.map((p) => (
                    <button key={p.id} className={`color-mode-btn ${palette === p.id ? 'active' : ''}`} onClick={() => setPalette(p.id)} id={`palette-${p.id}`}>
                      <span className="palette-chips">
                        <i style={{ background: p.ground }} /><i style={{ background: p.mid }} /><i style={{ background: p.ink }} /><i style={{ background: p.accent }} />
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'une' ? (
                <div className="filter-control-group">
                  <div className="filter-control-label"><span>Sens des lignes</span></div>
                  <div className="filter-toggle">
                    <button className={!single.vertical ? 'active' : ''} onClick={() => setSingle(o => ({ ...o, vertical: false }))}>Horizontal</button>
                    <button className={single.vertical ? 'active' : ''} onClick={() => setSingle(o => ({ ...o, vertical: true }))}>Vertical</button>
                  </div>
                </div>
              ) : (
                <div className="filter-control-group">
                  <button className="filter-swap" onClick={() => setOverlay(o => ({ ...o, backVertical: !o.backVertical }))}>
                    <ArrowLeftRight size={13} /> Fond {overlay.backVertical ? 'vertical' : 'horizontal'}, premier plan {overlay.backVertical ? 'horizontal' : 'vertical'} — inverser
                  </button>
                </div>
              )}

              <div className="filter-control-group">
                <div className="filter-control-label"><span>Détail</span><span>{lines} lignes</span></div>
                <input className="filter-slider" type="range" min="40" max="160" step="2" value={lines}
                  onChange={(e) => setLines(parseInt(e.target.value))} id="slider-lines" />
              </div>

              {mode === 'une' ? (
                <div className="filter-control-group">
                  <div className="filter-control-label"><span>Lumière</span><span>{lightLabel(single.light)}</span></div>
                  <input className="filter-slider" type="range" min="-10" max="10" value={Math.round(single.light * 10)}
                    onChange={(e) => setSingle(o => ({ ...o, light: parseInt(e.target.value) / 10 }))} id="slider-light" />
                  <p className="filter-control-hint">Réglée automatiquement pour chaque photo. Vers la droite : plus de vide, vers la gauche : plus d'encre.</p>
                </div>
              ) : (
                <>
                  <div className="filter-control-group">
                    <div className="filter-control-label"><span>Sensibilité du fond</span><span>{lightLabel(overlay.backLight)}</span></div>
                    <input className="filter-slider" type="range" min="-10" max="10" value={Math.round(overlay.backLight * 10)}
                      onChange={(e) => setOverlay(o => ({ ...o, backLight: parseInt(e.target.value) / 10 }))} id="slider-back" />
                  </div>
                  <div className="filter-control-group">
                    <div className="filter-control-label"><span>Sensibilité du premier plan</span><span>{lightLabel(overlay.frontLight)}</span></div>
                    <input className="filter-slider" type="range" min="-10" max="10" value={Math.round(overlay.frontLight * 10)}
                      onChange={(e) => setOverlay(o => ({ ...o, frontLight: parseInt(e.target.value) / 10 }))} id="slider-front" />
                  </div>
                  <div className="filter-control-group">
                    <div className="filter-control-label"><span>Premier plan gardé</span><span>{overlay.frontReach < 0.35 ? 'large' : overlay.frontReach > 0.6 ? 'sélectif' : 'équilibré'}</span></div>
                    <input className="filter-slider" type="range" min="0" max="100" value={Math.round((1 - overlay.frontReach) * 100)}
                      onChange={(e) => setOverlay(o => ({ ...o, frontReach: 1 - parseInt(e.target.value) / 100 }))} id="slider-reach" />
                    <p className="filter-control-hint">Végétation et bâtiments sont reconnus automatiquement ; le ciel laisse voir le fond. Vers la droite, le premier plan prend plus de place.</p>
                  </div>
                </>
              )}

              <div className="filter-control-group filter-switches">
                <label><input type="checkbox" checked={accent} onChange={(e) => setAccent(e.target.checked)} /> Touches fluo sur les roses et les orangés</label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
