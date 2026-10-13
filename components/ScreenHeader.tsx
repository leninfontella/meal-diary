import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  onBack?: () => void;
  right?: ReactNode;
  showBack?: boolean;
  title: string;
  tone?: 'default' | 'light';
};

export function ScreenHeader({ onBack, right, showBack = true, title, tone = 'default' }: Props) {
  const router = useRouter();
  const foreground = tone === 'light' ? '#F8F6EF' : colors.sageDark;

  return (
    <View style={styles.header}>
      <View style={styles.side}>{showBack && <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={onBack ?? (() => router.back())} style={styles.backButton}><Ionicons name="arrow-back" size={25} color={foreground} /></Pressable>}</View>
      <Text numberOfLines={1} style={[styles.title, tone === 'light' && styles.titleLight]}>{title}</Text>
      <View style={styles.side}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: colors.ink, fontSize: 20, fontWeight: '600', textAlign: 'center', paddingHorizontal: 8 },
  titleLight: { color: '#F8F6EF' },
});
