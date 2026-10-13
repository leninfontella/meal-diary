import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenLoader } from '@/components/ScreenLoader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PhotoSourceModal } from '@/components/PhotoSourceModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/constants/theme';
import { currentTime, toDateKey } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { mealTypes, MealType, type Meal } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';
import { useNotification } from '@/providers/NotificationProvider';

type Props = { mealId?: string; initialDate?: string; initialPhoto?: ImagePicker.ImagePickerAsset };

const mealIcons: Record<MealType, keyof typeof Ionicons.glyphMap> = {
  'Café da manhã': 'cafe-outline',
  'Almoço': 'restaurant-outline',
  'Lanche': 'nutrition-outline',
  'Jantar': 'fast-food-outline',
  'Outro': 'ellipsis-horizontal',
};

export function MealEditor({ mealId, initialDate, initialPhoto }: Props) {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const { notify } = useNotification();
  const [initialValues] = useState(() => ({ date: initialDate || toDateKey(new Date()), time: currentTime() }));
  const allowExit = useRef(false);
  const exitPromptOpen = useRef(false);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(initialPhoto ?? null);
  const [imageUrl, setImageUrl] = useState<string>();
  const [date, setDate] = useState(initialValues.date);
  const [time, setTime] = useState(initialValues.time);
  const [type, setType] = useState<MealType | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(Boolean(mealId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoSourceVisible, setPhotoSourceVisible] = useState(false);
  const hasUnsavedChanges = !mealId && Boolean(photo || type || note.trim() || date !== initialValues.date || time !== initialValues.time);

  useEffect(() => navigation.addListener('beforeRemove', (event) => {
    if (allowExit.current || !hasUnsavedChanges) return;
    event.preventDefault();
    if (exitPromptOpen.current) return;
    exitPromptOpen.current = true;
    void (async () => {
      const confirmed = await confirm({
        title: 'Sair sem salvar?',
        message: 'Deseja sair sem salvar esta refeição? A foto e os dados preenchidos serão descartados.',
        confirmLabel: 'Sair sem salvar',
        tone: 'danger',
      });
      exitPromptOpen.current = false;
      if (!confirmed) return;
      allowExit.current = true;
      navigation.dispatch(event.data.action);
    })();
  }), [confirm, hasUnsavedChanges, navigation]);

  useEffect(() => {
    if (!mealId) return;
    (async () => {
      const { data, error: queryError } = await supabase.from('meals').select('*').eq('id', mealId).single();
      if (queryError || !data) {
        setError('Não foi possível abrir esta refeição.');
        notify({ type: 'error', title: 'Refeição indisponível', message: 'Não foi possível carregar os dados.' });
      } else {
        const row = data as Meal;
        setMeal(row);
        setDate(row.meal_date);
        setTime(row.meal_time.slice(0, 5));
        setType(row.meal_type);
        setNote(row.note ?? '');
        const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrl(row.photo_path, 3600);
        setImageUrl(signed?.signedUrl);
      }
      setLoading(false);
    })();
  }, [mealId, notify]);

  async function openCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Permita o acesso à câmera para tirar uma foto.');
      notify({ type: 'error', title: 'Acesso à câmera necessário', message: 'Libere a permissão nas configurações do dispositivo.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.82 });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
      setError('');
      notify({ type: 'success', title: 'Foto adicionada', message: 'Agora complete os dados da refeição.' });
    }
  }

  async function openLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita o acesso às fotos para selecionar uma imagem.');
      notify({ type: 'error', title: 'Acesso às fotos necessário', message: 'Libere a permissão nas configurações do dispositivo.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.82 });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
      setError('');
      notify({ type: 'success', title: 'Foto selecionada', message: 'A imagem está pronta para ser salva.' });
    }
  }

  function choosePhoto() {
    if (Platform.OS === 'web') {
      void openLibrary();
      return;
    }
    setPhotoSourceVisible(true);
  }

  async function uploadPhoto(asset: ImagePicker.ImagePickerAsset) {
    if (!user) throw new Error('Sessão inválida.');
    const extension = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/').pop() || 'jpg').replace('jpeg', 'jpg');
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const body = Platform.OS === 'web' && asset.file ? asset.file : await (await fetch(asset.uri)).arrayBuffer();
    const { error: uploadError } = await supabase.storage.from('meal-photos').upload(path, body, {
      contentType: asset.mimeType || 'image/jpeg',
      upsert: false,
    });
    if (uploadError) throw uploadError;
    return path;
  }

  async function save() {
    setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Confira a data e o horário informados.');
      notify({ type: 'error', title: 'Data ou horário inválido', message: 'Use os formatos AAAA-MM-DD e HH:MM.' });
      return;
    }
    if (!mealId && !photo) {
      setError('Adicione uma foto da refeição.');
      notify({ type: 'info', title: 'Adicione uma foto', message: 'Escolha a câmera ou uma imagem da galeria.' });
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      if (mealId) {
        const { error: updateError } = await supabase.from('meals').update({ meal_date: date, meal_time: time, meal_type: type, note: note.trim() || null }).eq('id', mealId);
        if (updateError) throw updateError;
      } else if (photo) {
        const path = await uploadPhoto(photo);
        const { error: insertError } = await supabase.from('meals').insert({ user_id: user.id, meal_date: date, meal_time: time, meal_type: type, note: note.trim() || null, photo_path: path });
        if (insertError) {
          await supabase.storage.from('meal-photos').remove([path]);
          throw insertError;
        }
      }
      notify({ type: 'success', title: mealId ? 'Refeição atualizada' : 'Refeição adicionada', message: mealId ? 'As alterações foram salvas.' : 'A foto já está no seu diário.' });
      allowExit.current = true;
      router.replace('/diary');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Não foi possível salvar a refeição.';
      setError(message);
      notify({ type: 'error', title: 'Erro ao salvar', message });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!meal) return;
    const { error: deleteError } = await supabase.from('meals').delete().eq('id', meal.id);
    if (deleteError) {
      setError(deleteError.message);
      notify({ type: 'error', title: 'Não foi possível excluir', message: deleteError.message });
      return;
    }
    await supabase.storage.from('meal-photos').remove([meal.photo_path]);
    notify({ type: 'success', title: 'Refeição excluída', message: 'A foto foi removida do diário.' });
    router.replace('/diary');
  }

  async function confirmRemove() {
    const confirmed = await confirm({
      title: 'Excluir refeição?',
      message: 'A foto e a observação serão removidas definitivamente.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (confirmed) await remove();
  }

  if (loading) return <ScreenLoader />;

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={require('../assets/diary-background.png')} resizeMode="cover" style={styles.background}>
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.shell}>
          <ScreenHeader
            right={mealId ? <Pressable accessibilityLabel="Excluir refeição" onPress={() => void confirmRemove()} style={styles.headerAction}><Ionicons name="trash-outline" size={22} color={colors.danger} /></Pressable> : undefined}
            title={mealId ? 'Sua refeição' : 'Nova refeição'}
          />

          <ScrollView
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={styles.content}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.panel}>
              <Pressable onPress={!mealId ? choosePhoto : undefined} style={[styles.photoArea, (photo || imageUrl) && styles.photoAreaFilled]}>
                {photo || imageUrl ? (
                  <Image source={photo?.uri || imageUrl} style={styles.photo} contentFit="cover" />
                ) : (
                  <View style={styles.photoPlaceholder}><View style={styles.cameraCircle}><Ionicons name="camera" size={34} color={colors.sageDark} /></View><Text style={styles.photoTitle}>Adicionar foto</Text><Text style={styles.photoHint}>Câmera ou galeria</Text></View>
                )}
              </Pressable>

              {!mealId && (photo || imageUrl) && <Pressable onPress={choosePhoto} style={styles.changePhoto}><Ionicons name="images-outline" size={18} color={colors.sageDark} /><Text style={styles.changePhotoText}>Trocar foto</Text></Pressable>}

              <View style={styles.row}>
                <View style={styles.dateField}>
                  <Text style={styles.label}>Data</Text>
                  <View style={styles.inputShell}><Ionicons name="calendar-outline" size={22} color={colors.sageDark} /><TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" style={styles.input} /></View>
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.label}>Horário</Text>
                  <View style={styles.inputShell}><Ionicons name="time-outline" size={23} color={colors.sageDark} /><TextInput value={time} onChangeText={setTime} placeholder="00:00" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" style={styles.input} /></View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Tipo de refeição <Text style={styles.optional}>opcional</Text></Text>
                <View style={styles.chips}>{mealTypes.map((item) => <Pressable key={item} onPress={() => setType(type === item ? null : item)} style={[styles.chip, type === item && styles.chipActive]}><Ionicons name={mealIcons[item]} size={19} color={type === item ? colors.sageDark : colors.muted} /><Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Observação</Text>
                <View style={styles.noteShell}><Ionicons name="leaf-outline" size={23} color={colors.sageDark} style={styles.noteIcon} /><TextInput value={note} onChangeText={setNote} multiline maxLength={500} placeholder="Como estava a refeição?" placeholderTextColor={colors.muted} textAlignVertical="top" style={styles.noteInput} /></View>
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <Pressable disabled={saving} onPress={save} style={({ pressed }) => [styles.save, pressed && styles.pressed, saving && styles.disabled]}>
                {saving ? <ActivityIndicator color={colors.white} /> : <><Ionicons name="checkmark" size={23} color={colors.white} /><Text style={styles.saveText}>Salvar refeição</Text></>}
              </Pressable>
            </View>
          </ScrollView>
          <BottomNavigation addDate={date} />
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
      <PhotoSourceModal
        description="Escolha como deseja adicionar a fotografia da refeição."
        onCamera={() => void openCamera()}
        onClose={() => setPhotoSourceVisible(false)}
        onLibrary={() => void openLibrary()}
        title={photo || imageUrl ? 'Trocar foto' : 'Adicionar foto'}
        visible={photoSourceVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5ED' },
  background: { flex: 1, width: '100%' },
  keyboard: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  headerAction: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(229, 233, 220, 0.92)', alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 18, paddingBottom: 118 },
  panel: { borderRadius: 28, backgroundColor: 'rgba(250, 248, 241, 0.96)', padding: 24, gap: 23, shadowColor: '#514F43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 3 },
  photoArea: { width: '100%', aspectRatio: 1.55, borderRadius: 17, borderWidth: 1, borderStyle: 'dashed', borderColor: '#AEBCA3', overflow: 'hidden', backgroundColor: 'rgba(237, 241, 230, 0.72)' },
  photoAreaFilled: { borderStyle: 'solid', borderColor: colors.line },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(221, 229, 215, 0.8)', alignItems: 'center', justifyContent: 'center' },
  photoTitle: { color: colors.sageDark, fontSize: 17, fontWeight: '700', marginTop: 12 },
  photoHint: { color: colors.muted, fontSize: 14, marginTop: 3 },
  changePhoto: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -14, padding: 7 },
  changePhotoText: { color: colors.sageDark, fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1.45, gap: 8 },
  timeField: { flex: 1, gap: 8 },
  inputShell: { height: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.48)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, height: '100%', color: colors.ink, fontSize: 15, paddingVertical: 0 },
  fieldGroup: { gap: 9 },
  label: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  optional: { color: colors.muted, fontWeight: '400' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255, 255, 255, 0.62)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  chipActive: { borderColor: colors.sage, backgroundColor: colors.sageLight },
  chipText: { color: colors.muted, fontSize: 14 },
  chipTextActive: { color: colors.sageDark, fontWeight: '700' },
  noteShell: { minHeight: 112, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: 'rgba(255, 255, 255, 0.48)', flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 15 },
  noteIcon: { marginTop: 15 },
  noteInput: { flex: 1, minHeight: 110, color: colors.ink, fontSize: 15, lineHeight: 21, paddingHorizontal: 12, paddingTop: 15, paddingBottom: 12 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  save: { height: 58, borderRadius: 13, backgroundColor: colors.sageDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: colors.sageDark, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.65 },
});
