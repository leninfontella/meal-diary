import { AlertTriangle, Leaf } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ConfirmOptions = { title: string; message: string; confirmLabel?: string; cancelLabel?: string; tone?: 'default' | 'danger' };
type ConfirmValue = { confirm: (options: ConfirmOptions) => Promise<boolean> };
const ConfirmContext = createContext<ConfirmValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((result: boolean) => void) | null>(null);
  const confirm = useCallback((next: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current?.(false); resolver.current = resolve; setOptions(next);
  }), []);
  const close = useCallback((result: boolean) => { resolver.current?.(result); resolver.current = null; setOptions(null); }, []);
  const danger = options?.tone === 'danger';
  return <ConfirmContext.Provider value={{ confirm }}>{children}{options && <div className="modal-backdrop modal-center" role="presentation" onMouseDown={() => close(false)}><div className="confirm-dialog" role="alertdialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><span className={danger ? 'danger' : ''}>{danger ? <AlertTriangle /> : <Leaf />}</span><h2>{options.title}</h2><p>{options.message}</p><div><button onClick={() => close(false)}>{options.cancelLabel ?? 'Cancelar'}</button><button className={danger ? 'danger-button' : 'primary-button'} onClick={() => close(true)}>{options.confirmLabel ?? 'Confirmar'}</button></div></div></div>}</ConfirmContext.Provider>;
}
export function useConfirmDialog() { const value = useContext(ConfirmContext); if (!value) throw new Error('useConfirmDialog deve estar dentro do provider.'); return value; }
