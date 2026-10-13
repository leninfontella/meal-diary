import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTransition } from '../contexts/TransitionContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { notify } = useToast();
  const { play } = useTransition();
  const [signup, setSignup] = useState(() => searchParams.get('mode') === 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState('');
  if (!authLoading && user && !transitioning) return <Navigate to="/diary" replace />;

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!isSupabaseConfigured) return setError('Configure as variáveis do Supabase em web/.env.');
    if (signup && name.trim().length < 2) return setError('Informe seu nome com pelo menos 2 caracteres.');
    if (!email.trim() || password.length < 6) return setError('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
    setLoading(true);
    const result = signup
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (result.error) return setError(result.error.message);
    if (signup) {
      if (result.data.session) await supabase.auth.signOut();
      setSignup(false); setPassword('');
      notify({ tone: 'success', title: 'Conta criada', message: 'Confirme seu e-mail, se solicitado, e faça login.' });
    } else {
      setTransitioning(true);
      await play();
      setTransitioning(false);
    }
  }

  return <main className="auth-page">
    <section className="desktop-auth-notice">
      <div className="desktop-auth-visual">
        <img src="/desktop-mobile-experience.png" alt="Refeição colorida servida em cerâmica artesanal, ao lado de um diário" />
      </div>
      <div className="desktop-auth-content">
        <span className="desktop-auth-mark"><Leaf /></span>
        <p className="desktop-auth-eyebrow">Diário Alimentar</p>
        <h1>Uma experiência feita para o celular</h1>
        <p className="desktop-auth-copy">Para aproveitar melhor o registro por fotos, a câmera e o diário no dia a dia, acesse este site pelo seu celular.</p>
        <div className="desktop-auth-stores" aria-label="Disponibilidade futura nas lojas oficiais"><div><FaApple /><span><small>Em breve na</small><strong>App Store</strong></span></div><div><FaGooglePlay /><span><small>Em breve no</small><strong>Google Play</strong></span></div></div>
        <p className="desktop-auth-footnote">Em breve também disponível nas lojas oficiais da Apple e do Google.</p>
      </div>
    </section>
    <section className="auth-hero"><div className="brand-mark"><Leaf /></div><h1>Diário Alimentar</h1><p>Suas refeições, do seu jeito.</p></section>
    <section className="auth-sheet"><form onSubmit={submit} className="auth-form">
      {signup && <h2>Crie sua conta</h2>}
      {signup && <label>Nome<div className="input-wrap"><UserRound /><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Seu nome" /></div></label>}
      <label>E-mail<div className="input-wrap"><Mail /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="voce@exemplo.com" /></div></label>
      <label>Senha<div className="input-wrap"><LockKeyhole /><input type={visible ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} placeholder="Mínimo de 6 caracteres" /><button type="button" className="input-action" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeOff /> : <Eye />}</button></div></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" disabled={loading}>{loading ? 'Aguarde...' : signup ? 'Cadastrar' : 'Entrar'}<ArrowRight /></button>
      <div className="leaf-divider"><span /><Leaf /><span /></div>
      <button type="button" className="text-button" onClick={() => { setSignup(!signup); setError(''); }}>{signup ? 'Já tenho uma conta' : 'Ainda não tenho uma conta'}</button>
    </form></section>
  </main>;
}
