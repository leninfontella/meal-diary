import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  right?: ReactNode;
  title: string;
};

export function ScreenHeader({ right, title }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={() => router.back()} style={styles.side}><Ionicons name="arrow-back" size={25} color={colors.sageDark} /></Pressable>
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '600', textAlign: 'center', paddingHorizontal: 8 },
});
