import { Camera, ChevronRight, Images } from 'lucide-react';

type Props = { visible: boolean; title: string; description: string; onCamera: () => void; onLibrary: () => void; onClose: () => void };
export function PhotoSourceModal({ visible, title, description, onCamera, onLibrary, onClose }: Props) {
  if (!visible) return null;
  const choose = (action: () => void) => { onClose(); action(); };
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="photo-source-sheet" onMouseDown={(event) => event.stopPropagation()}><i /><header><span><Camera /></span><div><h2>{title}</h2><p>{description}</p></div></header><button onClick={() => choose(onCamera)}><span><Camera /></span><div><strong>Usar a câmera</strong><small>Tire uma foto agora</small></div><ChevronRight /></button><button onClick={() => choose(onLibrary)}><span><Images /></span><div><strong>Escolher da galeria</strong><small>Selecione uma foto do aparelho</small></div><ChevronRight /></button><button className="cancel" onClick={onClose}>Cancelar</button></div></div>;
}
