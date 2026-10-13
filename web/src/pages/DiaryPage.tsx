import { useCallback, useEffect, useRef, useState } from 'react';
import { Apple, ChevronLeft, ChevronRight, Coffee, CookingPot, Ellipsis, Leaf, MoreHorizontal, SquarePen, Trash2, Utensils, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from '../contexts/ConfirmDialogContext';
import { useToast } from '../contexts/ToastContext';
import { getWeek, monthName, toDateKey } from '../lib/date';
import { supabase } from '../lib/supabase';
import type { Meal } from '../lib/types';

export function DiaryPage() {
  const { user } = useAuth(); const { notify } = useToast(); const { confirm } = useConfirmDialog(); const navigate = useNavigate();
  const [selected, setSelected] = useState(new Date()); const [meals, setMeals] = useState<Meal[]>([]);
  const [recorded, setRecorded] = useState(new Set<string>()); const [name, setName] = useState(''); const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true); const [menuMeal, setMenuMeal] = useState<Meal | null>(null);
  const load = useCallback(async () => {
    if (!user) return; setLoading(true); const week = getWeek(selected);
    const [mealResult, datesResult, profileResult] = await Promise.all([
      supabase.from('meals').select('*').eq('user_id', user.id).eq('meal_date', toDateKey(selected)).order('meal_time'),
      supabase.from('meals').select('meal_date').eq('user_id', user.id).gte('meal_date', week[0].key).lte('meal_date', week[6].key),
      supabase.from('profiles').select('name, avatar_path').eq('user_id', user.id).maybeSingle()
    ]);
    if (mealResult.error) notify({ tone: 'error', title: 'Erro ao carregar', message: 'Não foi possível buscar as refeições deste dia.' });
    const rows = (mealResult.data ?? []) as Meal[];
    const signed = await Promise.all(rows.map(async (meal) => ({ ...meal, imageUrl: (await supabase.storage.from('meal-photos').createSignedUrl(meal.photo_path, 3600)).data?.signedUrl })));
    setMeals(signed); setRecorded(new Set((datesResult.data ?? []).map((item) => item.meal_date)));
    const profile = profileResult.data; setName(profile?.name?.trim() || String(user.user_metadata.name ?? '') || user.email?.split('@')[0] || '');
    if (profile?.avatar_path) setAvatar((await supabase.storage.from('profile-photos').createSignedUrl(profile.avatar_path, 3600)).data?.signedUrl ?? '');
    setLoading(false);
  }, [notify, selected, user]);
  useEffect(() => { void load(); }, [load]);
  const moveWeek = (days: number) => setSelected((current) => { const next = new Date(current); next.setDate(next.getDate() + days); return next; });
  async function remove(meal: Meal) {
    if (!await confirm({ title: 'Excluir publicação?', message: 'A fotografia e a observação serão removidas definitivamente.', confirmLabel: 'Excluir', tone: 'danger' })) return;
    const { error } = await supabase.from('meals').delete().eq('id', meal.id); if (error) return notify({ tone: 'error', title: 'Não foi possível excluir', message: error.message });
    const { error: storageError } = await supabase.storage.from('meal-photos').remove([meal.photo_path]); setMenuMeal(null); void load();
    notify(storageError ? { tone: 'info', title: 'Refeição excluída', message: 'O registro foi removido, mas a limpeza da foto precisará ser tentada novamente.' } : { tone: 'success', title: 'Publicação excluída', message: 'A refeição e a fotografia foram removidas.' });
  }
  const week = getWeek(selected);
  return <div className="page diary-page"><header className="diary-header"><div><h1>Olá{name ? `, ${name}` : ''}!</h1><p>Seu diário alimentar.</p></div><button className="avatar-small" onClick={() => navigate('/profile')}>{avatar ? <img src={avatar} alt="Perfil" /> : <UserRound />}</button></header>
    <section className="week-card"><div className="week-title"><h2>{monthName(selected)}</h2><div><button onClick={() => moveWeek(-7)}><ChevronLeft /></button><button onClick={() => moveWeek(7)}><ChevronRight /></button></div></div><div className="week-days">{week.map((day) => <button key={day.key} className={day.key === toDateKey(selected) ? 'selected' : ''} onClick={() => setSelected(day.date)}><span>{day.weekday}</span><strong>{day.date.getDate()}</strong><i className={recorded.has(day.key) ? 'marked' : ''} /></button>)}</div></section>
    <div className="day-summary"><Leaf /><span>{meals.length} {meals.length === 1 ? 'refeição' : 'refeições'} {toDateKey(selected) === toDateKey(new Date()) ? 'hoje' : 'neste dia'}</span><ChevronRight /></div>
    {loading ? <div className="inline-loader" /> : meals.length ? <div className="meal-grid">{meals.map((meal) => <DiaryMealCard key={meal.id} meal={meal} onPress={() => navigate(`/meal/${meal.id}`)} onLongPress={() => setMenuMeal(meal)} />)}</div> : <div className="empty-state diary-empty"><Leaf /><h3>Nenhuma refeição neste dia</h3><p>Toque em Adicionar para registrar a primeira.</p></div>}
    {menuMeal && <div className="modal-backdrop" onClick={() => setMenuMeal(null)}><div className="action-sheet meal-action-sheet" onClick={(e) => e.stopPropagation()}><i aria-hidden="true" /><header><span><MealTypeIcon type={menuMeal.meal_type} /></span><div><h2>{menuMeal.meal_type || 'Refeição'}</h2><p>Escolha uma opção para esta publicação.</p></div></header><button onClick={() => navigate(`/meal/${menuMeal.id}`)}><span><SquarePen /></span><div><strong>Editar publicação</strong><small>Altere a data, o tipo ou a observação</small></div><ChevronRight /></button><button className="danger" onClick={() => void remove(menuMeal)}><span><Trash2 /></span><div><strong>Excluir publicação</strong><small>Remova esta refeição do seu diário</small></div><ChevronRight /></button><button className="cancel" onClick={() => setMenuMeal(null)}>Cancelar</button></div></div>}
  </div>;
}

function DiaryMealCard({ meal, onPress, onLongPress }: { meal: Meal; onPress: () => void; onLongPress: () => void }) {
  const timer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const clearTimer = () => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; };
  const startPress = () => {
    clearTimer(); longPressTriggered.current = false;
    timer.current = window.setTimeout(() => { longPressTriggered.current = true; onLongPress(); }, 450);
  };
  const finishPress = () => clearTimer();
  return <article
    className="meal-card"
    role="button"
    tabIndex={0}
    aria-label={`Abrir ${meal.meal_type || 'refeição'}`}
    onPointerDown={startPress}
    onPointerUp={finishPress}
    onPointerCancel={finishPress}
    onPointerLeave={finishPress}
    onClick={(event) => { if (longPressTriggered.current) { event.preventDefault(); longPressTriggered.current = false; return; } onPress(); }}
    onContextMenu={(event) => { event.preventDefault(); clearTimer(); onLongPress(); }}
    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPress(); } }}
  >
    <div className="meal-card-photo">
      <img src={meal.imageUrl} alt={meal.meal_type || 'Refeição'} draggable={false} />
      <button
        type="button"
        className="meal-card-menu"
        aria-label={`Opções de ${meal.meal_type || 'refeição'}`}
        onPointerDown={(event) => { event.stopPropagation(); clearTimer(); }}
        onClick={(event) => { event.stopPropagation(); onLongPress(); }}
      ><MoreHorizontal /></button>
    </div>
    <div className="meal-card-body">
      <div className="meal-card-meta">
        <span className="meal-card-type-icon"><MealTypeIcon type={meal.meal_type} /></span>
        <span><strong>{meal.meal_type || 'Refeição'}</strong><small>{meal.meal_time.slice(0, 5)}</small></span>
      </div>
      <p>{meal.note?.trim() || '\u00a0'}</p>
    </div>
  </article>;
}

function MealTypeIcon({ type }: { type: Meal['meal_type'] }) {
  if (type === 'Café da manhã') return <Coffee />;
  if (type === 'Almoço') return <Utensils />;
  if (type === 'Lanche') return <Apple />;
  if (type === 'Jantar') return <CookingPot />;
  return <Ellipsis />;
}
