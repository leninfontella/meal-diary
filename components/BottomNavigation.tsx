import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '@/constants/theme';
import { toDateKey } from '@/lib/date';
import { useNotification } from '@/providers/NotificationProvider';

type Props = { addDate?: string };

const items = [
  { label: 'Início', icon: 'home-outline', activeIcon: 'home', route: '/diary', matches: (path: string) => path === '/diary' },
  { label: 'Memórias', icon: 'images-outline', activeIcon: 'images', route: '/memories', matches: (path: string) => path === '/memories' },
  { label: 'Estatísticas', icon: 'stats-chart-outline', activeIcon: 'stats-chart', route: '/statistics', matches: (path: string) => path === '/statistics' },
  { label: 'Perfil', icon: 'person-outline', activeIcon: 'person', route: '/profile', matches: (path: string) => path === '/profile' },
] as const;

export function BottomNavigation({ addDate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { notify } = useNotification();
  const mealActive = pathname.startsWith('/meal/');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  const captureNewMeal = async () => {
    const date = addDate ?? toDateKey(new Date());
    if (Platform.OS === 'web') {
      router.push({ pathname: '/meal/new', params: { date } });
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      notify({ type: 'error', title: 'Acesso à câmera necessário', message: 'Libere a permissão nas configurações do dispositivo.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.82 });
    if (result.canceled) return;
    const photo = result.assets[0];
    void Haptics.selectionAsync();
    router.push({
      pathname: '/meal/new',
      params: {
        date,
        photoUri: photo.uri,
        photoName: photo.fileName ?? '',
        photoType: photo.mimeType ?? 'image/jpeg',
        photoWidth: String(photo.width),
        photoHeight: String(photo.height),
      },
    });
  };

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={styles.bar}>
        {items.slice(0, 2).map((item) => {
          const active = item.matches(pathname);
          return (
            <Pressable key={item.route} accessibilityLabel={`Abrir ${item.label}`} onPress={() => router.push(item.route)} style={styles.item}>
              <Ionicons name={active ? item.activeIcon : item.icon} size={23} color={active ? colors.sageDark : '#78856F'} />
              <Text numberOfLines={1} style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
        <View style={styles.addSpace} />
        {items.slice(2).map((item) => {
          const active = item.matches(pathname);
          return (
            <Pressable key={item.route} accessibilityLabel={`Abrir ${item.label}`} onPress={() => router.push(item.route)} style={styles.item}>
              <Ionicons name={active ? item.activeIcon : item.icon} size={24} color={active ? colors.sageDark : '#78856F'} />
              <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityLabel="Adicionar refeição"
        onPress={() => void captureNewMeal()}
        style={({ pressed }) => [styles.addButton, mealActive && styles.addButtonActive, pressed && styles.addPressed]}
      >
        <Ionicons name="camera" size={27} color={colors.white} />
        <Text style={styles.addLabel}>Adicionar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 },
  bar: { position: 'absolute', left: 14, right: 14, bottom: 8, height: 72, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.96)', paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', ...shadow },
  item: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { color: '#78856F', fontSize: 9.5 },
  activeLabel: { color: colors.sageDark, fontWeight: '700' },
  addSpace: { width: 72 },
  addButton: { position: 'absolute', bottom: 15, left: '50%', marginLeft: -37, width: 74, height: 74, borderRadius: 37, backgroundColor: '#78976C', borderWidth: 5, borderColor: '#F4F3EB', alignItems: 'center', justifyContent: 'center', ...shadow },
  addButtonActive: { backgroundColor: colors.sageDark },
  addPressed: { transform: [{ scale: 0.96 }] },
  addLabel: { color: colors.white, fontSize: 10.5, fontWeight: '600', marginTop: 1 },
});
