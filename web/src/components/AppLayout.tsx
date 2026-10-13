import { BarChart3, Camera, Home, Images, UserRound } from 'lucide-react';
import { useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { setDraftPhoto } from '../lib/draftPhoto';

const nav = [
  { to: '/diary', label: 'Início', Icon: Home },
  { to: '/memories', label: 'Memórias', Icon: Images },
  { to: '/statistics', label: 'Estatísticas', Icon: BarChart3 },
  { to: '/profile', label: 'Perfil', Icon: UserRound }
];

export function AppLayout() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hideNavigation = location.pathname.startsWith('/meal/');
  function captured(file?: File) {
    if (!file) return;
    setDraftPhoto(file);
    navigate('/meal/new');
  }
  return <div className="app-background"><main className="app-shell"><Outlet /></main>{!hideNavigation && <nav className="bottom-nav" aria-label="Navegação principal">
    {nav.slice(0, 2).map(({ to, label, Icon }) => <NavLink key={to} to={to}><Icon /><span>{label}</span></NavLink>)}
    <span className="nav-spacer" aria-hidden="true" />
    <button className="capture-button" aria-label="Adicionar refeição" onClick={() => inputRef.current?.click()}><Camera /><span>Adicionar</span></button>
    {nav.slice(2).map(({ to, label, Icon }) => <NavLink key={to} to={to}><Icon /><span>{label}</span></NavLink>)}
    <input ref={inputRef} className="visually-hidden" type="file" accept="image/*" capture="environment" onChange={(event) => { captured(event.target.files?.[0]); event.target.value = ''; }} />
  </nav>}</div>;
}
