import { Ionicons } from '@expo/vector-icons';
import { createContext, PropsWithChildren, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, shadow } from '@/constants/theme';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
};

type ConfirmContextValue = { confirm: (options: ConfirmOptions) => Promise<boolean> };

const ConfirmDialogContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({ children }: PropsWithChildren) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((nextOptions: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setOptions(nextOptions);
  }), []);

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOptions(null);
  }, []);

  const danger = options?.tone === 'danger';

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <Modal transparent visible={Boolean(options)} animationType="fade" onRequestClose={() => close(false)} statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable accessibilityLabel="Fechar confirmação" onPress={() => close(false)} style={StyleSheet.absoluteFill} />
          <View accessibilityRole="alert" style={[styles.dialog, shadow]}>
            <View style={[styles.iconCircle, danger && styles.iconCircleDanger]}>
              <Ionicons name={danger ? 'alert-outline' : 'leaf-outline'} size={29} color={danger ? colors.danger : colors.sageDark} />
            </View>
            <Text style={styles.title}>{options?.title}</Text>
            <Text style={styles.message}>{options?.message}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => close(false)} style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelText}>{options?.cancelLabel ?? 'Cancelar'}</Text>
              </Pressable>
              <Pressable onPress={() => close(true)} style={({ pressed }) => [styles.button, danger ? styles.dangerButton : styles.confirmButton, pressed && styles.pressed]}>
                <Text style={styles.confirmText}>{options?.confirmLabel ?? 'Confirmar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) throw new Error('useConfirmDialog deve ser usado dentro de ConfirmDialogProvider.');
  return context;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(30, 38, 27, 0.48)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 410, borderRadius: 20, backgroundColor: '#F9F7F0', paddingHorizontal: 24, paddingTop: 26, paddingBottom: 20, alignItems: 'center' },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconCircleDanger: { backgroundColor: '#F3E2DE' },
  title: { color: colors.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  actions: { width: '100%', flexDirection: 'row', gap: 10 },
  button: { flex: 1, minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  cancelButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF' },
  confirmButton: { backgroundColor: colors.sageDark },
  dangerButton: { backgroundColor: colors.danger },
  cancelText: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  confirmText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
