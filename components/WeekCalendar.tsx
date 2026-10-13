import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { getWeek, monthName, toDateKey } from '@/lib/date';

type Props = { selected: Date; onSelect: (date: Date) => void; markedDates?: Set<string> };

export function WeekCalendar({ selected, onSelect, markedDates }: Props) {
  const days = getWeek(selected);
  const selectedKey = toDateKey(selected);
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
              {markedDates?.has(item.key) && <View accessibilityLabel="Dia com refeição registrada" style={styles.recordDot} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 18, paddingHorizontal: 15, paddingTop: 18, paddingBottom: 18, borderWidth: 1, borderColor: 'rgba(216, 217, 206, 0.72)', borderRadius: 24, backgroundColor: 'rgba(250, 248, 241, 0.82)', shadowColor: '#514F43', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
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
  recordDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#68845F', marginTop: 7 },
});
