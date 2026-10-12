import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '@/constants/theme';
import type { Meal } from '@/lib/types';

type Props = { meal: Meal; onPress: () => void };

export function MealCard({ meal, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${meal.meal_type ?? 'refeição'}`} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={meal.imageUrl} style={styles.image} contentFit="cover" transition={180} />
      <View style={styles.details}>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.type}>{meal.meal_type || 'Refeição'}</Text>
          <Text style={styles.time}>{meal.meal_time.slice(0, 5)}</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={19} color={colors.sageDark} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48.3%', borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.94)', ...shadow },
  pressed: { opacity: 0.84 },
  image: { width: '100%', aspectRatio: 1.06, backgroundColor: colors.sageLight },
  details: { minHeight: 64, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { flex: 1, paddingRight: 4 },
  type: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  time: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
