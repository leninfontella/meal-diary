import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  description: string;
  onCamera: () => void;
  onClose: () => void;
  onLibrary: () => void;
  title: string;
  visible: boolean;
};

export function PhotoSourceModal({ description, onCamera, onClose, onLibrary, title, visible }: Props) {
  const choose = (action: () => void) => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    onClose();
    action();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerIcon}><Ionicons name="camera-outline" size={26} color={colors.sageDark} /></View>
            <View style={styles.headerCopy}><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text></View>
          </View>

          <Pressable onPress={() => choose(onCamera)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <View style={styles.optionIcon}><Ionicons name="camera" size={23} color={colors.sageDark} /></View>
            <View style={styles.optionCopy}><Text style={styles.optionTitle}>Usar a câmera</Text><Text style={styles.optionText}>Tire uma foto agora</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>

          <Pressable onPress={() => choose(onLibrary)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <View style={styles.optionIcon}><Ionicons name="images" size={23} color={colors.sageDark} /></View>
            <View style={styles.optionCopy}><Text style={styles.optionTitle}>Escolher da galeria</Text><Text style={styles.optionText}>Selecione uma foto do aparelho</Text></View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(29, 37, 27, 0.56)', justifyContent: 'flex-end', padding: 14 },
  sheet: { width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: 28, backgroundColor: '#FAF8F1', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, shadowColor: '#20271E', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.16, shadowRadius: 22, elevation: 10 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D5D3CA', alignSelf: 'center', marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 5, marginBottom: 17 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 3 },
  title: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  option: { minHeight: 64, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  optionCopy: { flex: 1, gap: 2 },
  optionTitle: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  optionText: { color: colors.muted, fontSize: 12 },
  cancel: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.72 },
});
