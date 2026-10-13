import { createContext, useContext, useState, type ReactNode } from 'react';

type Toast = { id: number; title: string; message?: string; tone?: 'success' | 'error' | 'info' };
type ToastValue = { notify: (toast: Omit<Toast, 'id'>) => void };
const ToastContext = createContext<ToastValue>({ notify: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function notify(toast: Omit<Toast, 'id'>) {
    const id = Date.now(); setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000);
  }
  return <ToastContext.Provider value={{ notify }}>{children}<div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div key={toast.id} className={`toast ${toast.tone ?? 'info'}`}><strong>{toast.title}</strong>{toast.message && <span>{toast.message}</span>}</div>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
