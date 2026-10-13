import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavigation } from '@/components/BottomNavigation';
import { ScreenLoader } from '@/components/ScreenLoader';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, shadow } from '@/constants/theme';
import { fromDateKey, toDateKey } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import type { Meal, MealType } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useNotification } from '@/providers/NotificationProvider';

type Period = 'week' | 'month' | 'year';
type StatsMeal = Pick<Meal, 'id' | 'meal_date' | 'meal_type'>;

const periodLabels: { key: Period; label: string }[] = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
];

const mealOrder: (MealType | 'Outro')[] = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Outro'];
const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

function periodRange(period: Period, now: Date) {
  const start = new Date(now);
  const end = new Date(now);
  if (period === 'week') {
    const offset = now.getDay() === 0 ? -6 : 1 - now.getDay();
    start.setDate(now.getDate() + offset);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  } else if (period === 'month') {
    start.setDate(1);
    end.setMonth(now.getMonth() + 1, 0);
  } else {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
  }
  return { start, end };
}

function longestStreak(meals: StatsMeal[]) {
  const days = [...new Set(meals.map((meal) => meal.meal_date))].sort();
  let longest = 0;
  let current = 0;
  let previous: Date | null = null;
  days.forEach((key) => {
    const date = fromDateKey(key);
    const difference = previous ? Math.round((date.getTime() - previous.getTime()) / 86400000) : 0;
    current = previous && difference === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  });
  return longest;
}

export default function StatisticsScreen() {
  const { loading: authLoading, user } = useAuth();
  const { notify } = useNotification();
  const [period, setPeriod] = useState<Period>('month');
  const [meals, setMeals] = useState<StatsMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const now = useMemo(() => new Date(), []);

  const loadStatistics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const selected = periodRange(period, now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const queryStart = selected.start < monthStart ? selected.start : monthStart;
    const queryEnd = selected.end > monthEnd ? selected.end : monthEnd;
    const { data, error: queryError } = await supabase
      .from('meals')
      .select('id, meal_date, meal_type')
      .eq('user_id', user.id)
      .gte('meal_date', toDateKey(queryStart))
      .lte('meal_date', toDateKey(queryEnd))
      .order('meal_date', { ascending: false });

    if (queryError) {
      setMeals([]);
      setError('Não foi possível carregar suas estatísticas.');
      notify({ type: 'error', title: 'Erro ao carregar', message: 'Não foi possível buscar os registros.' });
    } else {
      setMeals((data ?? []) as StatsMeal[]);
    }
    setLoading(false);
  }, [now, notify, period, user]);

  useFocusEffect(useCallback(() => { void loadStatistics(); }, [loadStatistics]));

  const selectedRange = periodRange(period, now);
  const selectedMeals = meals.filter((meal) => meal.meal_date >= toDateKey(selectedRange.start) && meal.meal_date <= toDateKey(selectedRange.end));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthMeals = meals.filter((meal) => meal.meal_date >= toDateKey(monthStart) && meal.meal_date <= toDateKey(monthEnd));
  const activeDays = new Set(selectedMeals.map((meal) => meal.meal_date)).size;
  const average = activeDays ? selectedMeals.length / activeDays : 0;
  const typeCounts = mealOrder.map((type) => ({ type, count: selectedMeals.filter((meal) => (meal.meal_type ?? 'Outro') === type).length })).sort((a, b) => b.count - a.count);
  const maxTypeCount = Math.max(1, ...typeCounts.map((item) => item.count));

  const activity = (() => {
    if (period === 'year') {
      return Array.from({ length: 12 }, (_, index) => ({
        label: String(index + 1),
        count: selectedMeals.filter((meal) => fromDateKey(meal.meal_date).getMonth() === index).length,
      }));
    }
    const days = period === 'week' ? 7 : selectedRange.end.getDate();
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(selectedRange.start);
      date.setDate(selectedRange.start.getDate() + index);
      return { label: period === 'week' ? weekDays[date.getDay()].slice(0, 1) : String(date.getDate()), count: selectedMeals.filter((meal) => meal.meal_date === toDateKey(date)).length };
    });
  })();
  const maxActivity = Math.max(1, ...activity.map((item) => item.count));
  const monthCounts = monthMeals.reduce<Record<string, number>>((accumulator, meal) => {
    accumulator[meal.meal_date] = (accumulator[meal.meal_date] ?? 0) + 1;
    return accumulator;
  }, {});
  const calendarCells = [
    ...Array.from({ length: monthStart.getDay() }, () => null),
    ...Array.from({ length: monthEnd.getDate() }, (_, index) => index + 1),
  ];
  const periodCopy = period === 'week' ? 'Nesta semana' : period === 'month' ? 'Neste mês' : 'Neste ano';

  if (authLoading) return <ScreenLoader />;
  if (!user) return <Redirect href="/auth" />;

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={require('../assets/diary-background.png')} resizeMode="cover" style={styles.background}>
        <View style={styles.shell}>
          <ScreenHeader title="Estatísticas" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Sua história alimentar em números</Text>

            <View style={styles.segmented}>
              {periodLabels.map((item) => <Pressable key={item.key} onPress={() => setPeriod(item.key)} style={[styles.segment, period === item.key && styles.segmentActive]}><Text style={[styles.segmentText, period === item.key && styles.segmentTextActive]}>{item.label}</Text></Pressable>)}
            </View>

            {loading ? <ActivityIndicator style={styles.loader} color={colors.sageDark} /> : error ? <View style={styles.errorCard}><Ionicons name="cloud-offline-outline" size={30} color={colors.sageDark} /><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void loadStatistics()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View> : <>
              <View style={styles.summaryGrid}>
                <SummaryCard icon="restaurant-outline" value={selectedMeals.length.toLocaleString('pt-BR')} label="Refeições registradas" helper={periodCopy} />
                <SummaryCard icon="calendar-outline" value={String(activeDays)} label="Dias com registros" helper={periodCopy} />
                <SummaryCard icon="bar-chart-outline" value={average.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} label="Média por dia ativo" helper="Refeições registradas" />
                <SummaryCard icon="flame-outline" value={String(longestStreak(selectedMeals))} label="Dias consecutivos" helper="Com registros" />
              </View>

              <Section title="Suas refeições mais registradas">
                <View style={styles.ranking}>
                  {typeCounts.map((item, index) => <View key={item.type} style={styles.rankRow}><Text style={styles.rankNumber}>{index + 1}.</Text><Text numberOfLines={1} style={[styles.rankLabel, index === 0 && styles.rankLabelFirst]}>{item.type}</Text><View style={styles.track}><View style={[styles.fill, { width: `${(item.count / maxTypeCount) * 100}%`, opacity: 1 - index * 0.13 }]} /></View><Text style={styles.rankCount}>{item.count} {item.count === 1 ? 'registro' : 'registros'}</Text></View>)}
                </View>
              </Section>

              <Section title={`Atividade ${period === 'week' ? 'da semana' : period === 'month' ? 'do mês' : 'do ano'}`}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                  <View style={styles.chart}>
                    {activity.map((item, index) => <View key={`${item.label}-${index}`} style={styles.barColumn}><View style={styles.barArea}><View style={[styles.bar, { height: item.count ? Math.max(8, (item.count / maxActivity) * 76) : 2 }]} /></View><Text style={styles.barLabel}>{period === 'month' && activity.length > 20 && index % 4 !== 0 ? '' : item.label}</Text></View>)}
                  </View>
                </ScrollView>
              </Section>

              <Section title="Calendário de registros">
                <View style={styles.calendarHeader}>{weekDays.map((day) => <Text key={day} style={styles.calendarWeekday}>{day}</Text>)}</View>
                <View style={styles.calendarGrid}>{calendarCells.map((day, index) => {
                  const key = day ? toDateKey(new Date(now.getFullYear(), now.getMonth(), day)) : '';
                  const count = day ? monthCounts[key] ?? 0 : 0;
                  return <View key={`${day ?? 'blank'}-${index}`} style={[styles.calendarCell, !day && styles.calendarBlank, count === 1 && styles.levelOne, count === 2 && styles.levelTwo, count >= 3 && styles.levelThree]}>{day ? <Text style={[styles.calendarDay, count >= 3 && styles.calendarDayStrong]}>{day}</Text> : null}</View>;
                })}</View>
                <View style={styles.legend}><Legend color="#ECEAE3" label="Sem registros" /><Legend color="#D5DFCE" label="1 registro" /><Legend color="#9CAF93" label="2 registros" /><Legend color="#52684E" label="3 ou mais" /></View>
              </Section>

            </>}
          </ScrollView>
          <BottomNavigation />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, value, label, helper }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; helper: string }) {
  return <View style={styles.summaryCard}><View style={styles.summaryIcon}><Ionicons name={icon} size={25} color={colors.sageDark} /></View><View style={styles.summaryCopy}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryHelper}>{helper}</Text></View></View>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.sectionLine} />{children}</View>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5ED' },
  background: { flex: 1, width: '100%' },
  shell: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 122, gap: 18 },
  subtitle: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  segmented: { height: 52, borderRadius: 26, padding: 4, flexDirection: 'row', backgroundColor: 'rgba(250, 248, 241, 0.94)', borderWidth: 1, borderColor: colors.line, ...shadow },
  segment: { flex: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#7D9476' },
  segmentText: { color: colors.ink, fontSize: 15 },
  segmentTextActive: { color: colors.white, fontWeight: '700' },
  loader: { marginVertical: 90 },
  errorCard: { minHeight: 190, alignItems: 'center', justifyContent: 'center', borderRadius: 24, padding: 24, backgroundColor: 'rgba(250, 248, 241, 0.96)' },
  errorText: { color: colors.ink, fontSize: 16, textAlign: 'center', marginTop: 10 },
  retry: { color: colors.sageDark, fontWeight: '700', marginTop: 13 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { width: '48%', minHeight: 126, borderRadius: 21, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(250, 248, 241, 0.96)', ...shadow },
  summaryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6E9DF', alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1 },
  summaryValue: { color: '#17351F', fontSize: 27, fontWeight: '700' },
  summaryLabel: { color: colors.ink, fontSize: 13, lineHeight: 17, marginTop: 1 },
  summaryHelper: { color: colors.muted, fontSize: 11.5, marginTop: 2 },
  section: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(250, 248, 241, 0.96)', ...shadow },
  sectionTitle: { color: '#17351F', fontSize: 22, fontWeight: '700' },
  sectionLine: { height: 1, backgroundColor: colors.line, marginTop: 10, marginBottom: 16 },
  ranking: { gap: 15 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  rankNumber: { width: 19, color: colors.muted, fontSize: 13 },
  rankLabel: { width: 93, color: colors.ink, fontSize: 13 },
  rankLabelFirst: { color: colors.sageDark, fontWeight: '700' },
  track: { flex: 1, height: 13, borderRadius: 7, backgroundColor: '#E6E4DE', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7, backgroundColor: '#738A6D' },
  rankCount: { width: 72, color: colors.muted, fontSize: 11.5, textAlign: 'right' },
  chartScroll: { minWidth: '100%' },
  chart: { minWidth: '100%', height: 108, flexDirection: 'row', alignItems: 'flex-end', gap: 6, borderBottomWidth: 1, borderBottomColor: colors.line },
  barColumn: { width: 16, alignItems: 'center' },
  barArea: { height: 80, justifyContent: 'flex-end' },
  bar: { width: 12, minHeight: 2, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#91A78A' },
  barLabel: { height: 21, color: colors.muted, fontSize: 9, marginTop: 5 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  calendarWeekday: { width: '12.7%', color: colors.sageDark, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  calendarCell: { width: '12.7%', aspectRatio: 1, marginBottom: 7, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECEAE3' },
  calendarBlank: { backgroundColor: 'transparent' },
  levelOne: { backgroundColor: '#D5DFCE' },
  levelTwo: { backgroundColor: '#9CAF93' },
  levelThree: { backgroundColor: '#52684E' },
  calendarDay: { color: colors.muted, fontSize: 11 },
  calendarDayStrong: { color: colors.white, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 13, height: 13, borderRadius: 4 },
  legendText: { color: colors.muted, fontSize: 10.5 },
});
