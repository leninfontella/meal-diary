import { Ionicons } from '@expo/vector-icons';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '@/constants/theme';

type NotificationType = 'success' | 'error' | 'info';
type Notification = { id: number; type: NotificationType; title: string; message?: string };
type NotifyOptions = { type?: NotificationType; title: string; message?: string; duration?: number };
type NotificationContextValue = { notify: (options: NotifyOptions) => void };

const NotificationContext = createContext<NotificationContextValue | null>(null);

const notificationColors = {
  success: { background: '#E4EBDD', accent: colors.sageDark, icon: 'checkmark-circle' as const },
  error: { background: '#F4E4E0', accent: colors.danger, icon: 'alert-circle' as const },
  info: { background: '#E8E7DF', accent: '#665F52', icon: 'information-circle' as const },
};

export function NotificationProvider({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<Notification | null>(null);
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -18, duration: 300, useNativeDriver: true }),
    ]).start(() => setNotification(null));
  }, [opacity, translateY]);

  const notify = useCallback(({ type = 'info', title, message, duration = 3000 }: NotifyOptions) => {
    if (timeout.current) clearTimeout(timeout.current);
    setNotification({ id: Date.now(), type, title, message });
    translateY.setValue(-18);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    timeout.current = setTimeout(dismiss, Math.max(0, duration - 300));
  }, [dismiss, opacity, translateY]);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  const appearance = notification ? notificationColors[notification.type] : notificationColors.info;

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notification && (
        <View pointerEvents="box-none" style={[styles.layer, { top: Math.max(insets.top, 12) + 8 }]}>
          <Animated.View style={[styles.notification, { backgroundColor: appearance.background, borderLeftColor: appearance.accent, opacity, transform: [{ translateY }] }, shadow]}>
            <Ionicons name={appearance.icon} size={25} color={appearance.accent} />
            <View style={styles.copy}>
              <Text style={[styles.title, { color: appearance.accent }]}>{notification.title}</Text>
              {!!notification.message && <Text style={styles.message}>{notification.message}</Text>}
            </View>
            <Pressable accessibilityLabel="Fechar notificação" hitSlop={10} onPress={dismiss} style={styles.close}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </Pressable>
          </Animated.View>
        </View>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification deve ser usado dentro de NotificationProvider.');
  return context;
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 14, right: 14, zIndex: 1000, alignItems: 'center' },
  notification: { width: '100%', maxWidth: 520, minHeight: 68, borderRadius: 8, borderLeftWidth: 4, paddingVertical: 13, paddingLeft: 14, paddingRight: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700' },
  message: { color: colors.ink, fontSize: 13, lineHeight: 18 },
  close: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
