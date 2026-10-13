import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Images, Utensils, X } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fromDateKey } from '../lib/date';
import { supabase } from '../lib/supabase';
import { mealTypes, type Meal, type MealType } from '../lib/types';

type Filter = 'Todas' | MealType;
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
const cardDateFormat = new Intl.DateTimeFormat('pt-BR');
export function MemoriesPage() {
  const { user } = useAuth(); const { notify } = useToast(); const [filter, setFilter] = useState<Filter>('Todas'); const [meals, setMeals] = useState<Meal[]>([]); const [selected, setSelected] = useState<Meal | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { if (!user) return; setLoading(true); const { data, error } = await supabase.from('meals').select('*').eq('user_id', user.id).order('meal_date', { ascending: false }).order('meal_time', { ascending: false }); if (error) { notify({ tone: 'error', title: 'Erro ao carregar', message: 'Não foi possível buscar suas fotografias.' }); setLoading(false); return; } const rows = (data ?? []) as Meal[]; const signed = await Promise.all(rows.map(async (meal) => ({ ...meal, imageUrl: (await supabase.storage.from('meal-photos').createSignedUrl(meal.photo_path, 3600)).data?.signedUrl }))); setMeals(signed); setLoading(false); }, [notify, user]);
  useEffect(() => { void load(); }, [load]);
  const groups = useMemo(() => (filter === 'Todas' ? meals : meals.filter((m) => m.meal_type === filter)).reduce<Record<string, Meal[]>>((all, meal) => { (all[meal.meal_date.slice(0, 7)] ??= []).push(meal); return all; }, {}), [filter, meals]);
  return <div className="page"><ScreenHeader title="Memórias" /><p className="page-subtitle">Um álbum pessoal de todas as suas refeições</p><div className="filter-scroll">{(['Todas', ...mealTypes] as Filter[]).map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    {loading ? <div className="inline-loader" /> : Object.keys(groups).length ? Object.entries(groups).map(([key, items]) => <section className="memory-group" key={key}><div><h2>{monthFormat.format(fromDateKey(`${key}-01`))}</h2><small>{items.length} fotos</small></div><div className="memory-grid">{items.map((meal) => <button className="memory-card" key={meal.id} onClick={() => setSelected(meal)}><img src={meal.imageUrl} alt={meal.meal_type || 'Refeição'} /><span className="memory-card-body"><strong>{meal.meal_type || 'Refeição'}</strong><small>{cardDateFormat.format(fromDateKey(meal.meal_date))}</small></span></button>)}</div></section>) : <div className="empty-state memory-empty"><Images /><h3>Seu álbum ainda está vazio</h3><p>As fotografias das refeições registradas aparecerão aqui.</p></div>}
    {selected && <div className="modal-backdrop memory-backdrop" onClick={() => setSelected(null)}><article className="memory-modal" onClick={(e) => e.stopPropagation()}><button className="close-button" onClick={() => setSelected(null)} aria-label="Fechar"><X /></button><img src={selected.imageUrl} alt="Refeição" /><div className="memory-details"><div className="memory-meta"><span><Utensils />{selected.meal_type || 'Refeição'}</span><time>{selected.meal_time.slice(0, 5)}</time></div><p className="memory-date"><CalendarDays />{dateFormat.format(fromDateKey(selected.meal_date))}</p><blockquote><strong>Observação</strong><span>{selected.note || 'Nenhuma observação registrada.'}</span></blockquote></div></article></div>}
  </div>;
}
