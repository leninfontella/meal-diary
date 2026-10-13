import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';
type Toast = { id: number; title: string; message?: string; tone: ToastTone };
type NotifyOptions = { title: string; message?: string; tone?: ToastTone; duration?: number };
type ToastValue = { notify: (toast: NotifyOptions) => void };
const ToastContext = createContext<ToastValue | null>(null);

const icons = { success: CheckCircle, error: AlertCircle, info: Info };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [closing, setClosing] = useState(false);
  const timeout = useRef<number | null>(null);
  const animationTimeout = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    if (animationTimeout.current !== null) window.clearTimeout(animationTimeout.current);
    setClosing(true);
    animationTimeout.current = window.setTimeout(() => { setToast(null); setClosing(false); }, 300);
  }, []);

  const notify = useCallback(({ tone = 'info', duration = 3000, ...content }: NotifyOptions) => {
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    if (animationTimeout.current !== null) window.clearTimeout(animationTimeout.current);
    setClosing(false);
    setToast({ ...content, tone, id: Date.now() });
    timeout.current = window.setTimeout(dismiss, Math.max(0, duration - 300));
  }, [dismiss]);

  useEffect(() => () => { if (timeout.current !== null) window.clearTimeout(timeout.current); if (animationTimeout.current !== null) window.clearTimeout(animationTimeout.current); }, []);
  const Icon = toast ? icons[toast.tone] : Info;

  return <ToastContext.Provider value={{ notify }}>{children}{toast && <div className="toast-stack" aria-live="polite"><div key={toast.id} className={`toast ${toast.tone}${closing ? ' closing' : ''}`} role="status"><Icon /><div className="toast-copy"><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div><button type="button" onClick={dismiss} aria-label="Fechar notificação"><X /></button></div></div>}</ToastContext.Provider>;
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast deve estar dentro do ToastProvider.');
  return value;
}
