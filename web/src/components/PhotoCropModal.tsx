import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, RotateCw, X, ZoomIn } from 'lucide-react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { cropImage } from '../lib/cropImage';

type Props = {
  file: File | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function PhotoCropModal({ file, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const imageUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => {
    if (!file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedArea(null);
    setError('');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [file]);

  useEffect(() => {
    if (!file) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !processing) onCancel();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [file, onCancel, processing]);

  const cropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  async function confirmCrop() {
    if (!file || !croppedArea || processing) return;
    setProcessing(true);
    setError('');
    try {
      onConfirm(await cropImage(file, croppedArea, rotation));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível recortar esta imagem.');
    } finally {
      setProcessing(false);
    }
  }

  if (!file) return null;

  return <div className="modal-backdrop crop-backdrop" role="presentation">
    <section className="crop-dialog" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <header>
        <div><h2 id="crop-title">Ajustar foto</h2><p>Escolha como ela aparecerá no seu diário.</p></div>
        <button type="button" className="crop-close" aria-label="Cancelar recorte" disabled={processing} onClick={onCancel}><X /></button>
      </header>
      <div className="crop-stage">
        <Cropper image={imageUrl} crop={crop} zoom={zoom} rotation={rotation} aspect={1} showGrid objectFit="contain" onCropChange={setCrop} onCropComplete={cropComplete} onZoomChange={setZoom} />
      </div>
      <div className="crop-controls">
        <label><span><ZoomIn /> Zoom</span><input aria-label="Zoom da foto" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw /> Girar 90°</button>
        <small>Arraste a foto para posicionar a refeição dentro do quadrado.</small>
        {error && <p className="form-error">{error}</p>}
      </div>
      <footer>
        <button type="button" className="crop-cancel" disabled={processing} onClick={onCancel}>Cancelar</button>
        <button type="button" className="primary-button" disabled={processing || !croppedArea} onClick={() => void confirmCrop()}><Check />{processing ? 'Preparando...' : 'Usar esta foto'}</button>
      </footer>
    </section>
  </div>;
}
