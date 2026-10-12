import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { getWeek, monthName, toDateKey } from '@/lib/date';

type Props = { selected: Date; onSelect: (date: Date) => void };

export function WeekCalendar({ selected, onSelect }: Props) {
  const days = getWeek(selected);
  const selectedKey = toDateKey(selected);
  const todayKey = toDateKey(new Date());
  const moveWeek = (amount: number) => {
    const next = new Date(selected);
    next.setDate(selected.getDate() + amount * 7);
    onSelect(next);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.monthRow}>
        <Text style={styles.month}>{monthName(selected)}</Text>
        <View style={styles.arrows}>
          <Pressable accessibilityLabel="Semana anterior" hitSlop={10} onPress={() => moveWeek(-1)} style={styles.arrow}><Ionicons name="chevron-back" size={28} color={colors.sageDark} /></Pressable>
          <Pressable accessibilityLabel="Próxima semana" hitSlop={10} onPress={() => moveWeek(1)} style={styles.arrow}><Ionicons name="chevron-forward" size={28} color={colors.sageDark} /></Pressable>
        </View>
      </View>
      <View style={styles.days}>
        {days.map((item) => {
          const active = item.key === selectedKey;
          return (
            <View key={item.key} style={styles.daySlot}>
              <Pressable onPress={() => onSelect(item.date)} style={[styles.day, active && styles.activeDay]}>
                <Text style={[styles.weekday, active && styles.activeText]}>{item.weekday}</Text>
                <Text style={[styles.number, active && styles.activeText]}>{item.date.getDate()}</Text>
              </Pressable>
              {item.key === todayKey && !active && <View style={styles.todayDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingTop: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#D8D9CE' },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  month: { color: '#183017', fontSize: 24, fontWeight: '600' },
  arrows: { flexDirection: 'row', gap: 12 },
  arrow: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  daySlot: { width: '13.2%', minWidth: 39, alignItems: 'center' },
  day: { width: '100%', maxWidth: 56, height: 76, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 5 },
  activeDay: { backgroundColor: colors.sage },
  weekday: { color: '#30432D', fontSize: 13 },
  number: { color: '#172616', fontSize: 20, fontWeight: '400' },
  activeText: { color: colors.white },
  todayDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sage, marginTop: 7 },
});
