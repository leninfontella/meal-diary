import { ArrowLeft } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export function ScreenHeader({ title, back = true, action, onBack }: { title: string; back?: boolean; action?: ReactNode; onBack?: () => void }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(() => window.scrollY > 48);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 48);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  return <header className={`screen-header${visible ? ' is-visible' : ''}`} aria-hidden={!visible}><div>{back && <button className="icon-button" tabIndex={visible ? 0 : -1} onClick={() => onBack ? onBack() : navigate(-1)} aria-label="Voltar"><ArrowLeft /></button>}</div><h1>{title}</h1><div>{action}</div></header>;
}
