import { BarChart3, CalendarDays, Flame, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../contexts/AuthContext';
import { fromDateKey, toDateKey } from '../lib/date';
import { supabase } from '../lib/supabase';
import type { MealType } from '../lib/types';

type Period = 'week' | 'month' | 'year';
type Row = { id: string; meal_date: string; meal_type: MealType | null };
const types: (MealType | 'Outro')[] = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];
function range(period: Period, now: Date) { const start = new Date(now); const end = new Date(now); if (period === 'week') { start.setDate(now.getDate() + (now.getDay() === 0 ? -6 : 1 - now.getDay())); end.setTime(start.getTime()); end.setDate(start.getDate() + 6); } else if (period === 'month') { start.setDate(1); end.setMonth(now.getMonth() + 1, 0); } else { start.setMonth(0, 1); end.setMonth(11, 31); } return { start, end }; }
function streak(rows: Row[]) { const days = [...new Set(rows.map((r) => r.meal_date))].sort(); let max = 0, current = 0, previous: Date | null = null; days.forEach((key) => { const date = fromDateKey(key); current = previous && Math.round((date.getTime() - previous.getTime()) / 86400000) === 1 ? current + 1 : 1; max = Math.max(max, current); previous = date; }); return max; }
export function StatisticsPage() {
  const { user } = useAuth(); const [period, setPeriod] = useState<Period>('month'); const [rows, setRows] = useState<Row[]>([]); const now = useMemo(() => new Date(), []);
  useEffect(() => { if (!user) return; const selected = range(period, now); void supabase.from('meals').select('id, meal_date, meal_type').eq('user_id', user.id).gte('meal_date', toDateKey(selected.start)).lte('meal_date', toDateKey(selected.end)).then(({ data }) => setRows((data ?? []) as Row[])); }, [now, period, user]);
  const activeDays = new Set(rows.map((r) => r.meal_date)).size; const counts = types.map((type) => ({ type, count: rows.filter((r) => (r.meal_type ?? 'Outro') === type).length })).sort((a, b) => b.count - a.count); const max = Math.max(1, ...counts.map((i) => i.count));
  return <div className="page"><ScreenHeader title="Estatísticas" /><p className="page-subtitle">Sua história alimentar em números</p><div className="segmented">{(['week', 'month', 'year'] as Period[]).map((key) => <button className={period === key ? 'active' : ''} key={key} onClick={() => setPeriod(key)}>{{ week: 'Semana', month: 'Mês', year: 'Ano' }[key]}</button>)}</div>
    <div className="stats-grid"><Stat Icon={Utensils} value={rows.length} label="Refeições registradas" /><Stat Icon={CalendarDays} value={activeDays} label="Dias com registros" /><Stat Icon={BarChart3} value={activeDays ? (rows.length / activeDays).toFixed(1) : '0,0'} label="Média por dia ativo" /><Stat Icon={Flame} value={streak(rows)} label="Dias consecutivos" /></div>
    <section className="panel ranking"><h2>Refeições mais registradas</h2>{counts.map((item) => <div key={item.type}><span>{item.type}</span><i><b style={{ width: `${item.count / max * 100}%` }} /></i><small>{item.count}</small></div>)}</section>
  </div>;
}
function Stat({ Icon, value, label }: { Icon: typeof Utensils; value: string | number; label: string }) { return <article className="stat-card"><span><Icon /></span><div><strong>{value}</strong><small>{label}</small></div></article>; }
