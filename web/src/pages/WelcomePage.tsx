import { Leaf } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function WelcomePage() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/diary" replace />;

  return <main className="welcome-page">
    <section className="welcome-card">
      <div className="welcome-visual"><img src="/welcome-hero.png" alt="Prato de cerâmica sobre uma mesa clara" /><span className="ceramic ceramic-left" /><span className="ceramic ceramic-right" /></div>
      <div className="welcome-copy"><span className="welcome-mark"><Leaf /></span><p className="welcome-eyebrow">Diário Alimentar</p><h1>Conscientização alimentar</h1><h2>Observe suas refeições com mais presença, equilíbrio e atenção.</h2><p>Registre suas refeições com fotos e observações e desenvolva uma relação mais consciente com a sua alimentação.</p><div className="welcome-actions"><Link className="welcome-primary" to="/auth">Já tenho conta</Link><Link className="welcome-secondary" to="/auth?mode=signup">Criar conta</Link></div></div>
    </section>
  </main>;
}
