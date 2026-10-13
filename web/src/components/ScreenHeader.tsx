import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export function ScreenHeader({ title, back = false, action, onBack }: { title: string; back?: boolean; action?: ReactNode; onBack?: () => void }) {
  const navigate = useNavigate();
  return <header className="screen-header"><div>{back && <button className="icon-button" onClick={() => onBack ? onBack() : navigate(-1)} aria-label="Voltar"><ArrowLeft /></button>}</div><h1>{title}</h1><div>{action}</div></header>;
}
