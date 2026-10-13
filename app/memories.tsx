import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavigation } from '@/components/BottomNavigation';
import { ScreenLoader } from '@/components/ScreenLoader';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, shadow } from '@/constants/theme';
import { fromDateKey } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import { mealTypes, type Meal, type MealType } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useNotification } from '@/providers/NotificationProvider';

type MemoryMeal = Meal & { imageUrl?: string };
type Filter = 'Todas' | MealType;

const filters: Filter[] = ['Todas', ...mealTypes];
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function MemoriesScreen() {
  const { width } = useWindowDimensions();
  const { loading: authLoading, user } = useAuth();
  const { notify } = useNotification();
  const [filter, setFilter] = useState<Filter>('Todas');
  const [meals, setMeals] = useState<MemoryMeal[]>([]);
  const [selected, setSelected] = useState<MemoryMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const columns = width >= 680 ? 3 : 2;

  const loadMemories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('meal_date', { ascending: false })
      .order('meal_time', { ascending: false });

    if (queryError) {
      setMeals([]);
      setError('Não foi possível carregar suas memórias.');
      notify({ type: 'error', title: 'Erro ao carregar', message: 'Não foi possível buscar suas fotografias.' });
    } else {
      const rows = (data ?? []) as Meal[];
      const uniquePaths = [...new Set(rows.map((meal) => meal.photo_path))];
      const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrls(uniquePaths, 3600);
      const urls = new Map((signed ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
      setMeals(rows.map((meal) => ({ ...meal, imageUrl: urls.get(meal.photo_path) ?? undefined })));
    }
    setLoading(false);
  }, [notify, user]);

  useFocusEffect(useCallback(() => { void loadMemories(); }, [loadMemories]));

  const groups = useMemo(() => {
    const visible = filter === 'Todas' ? meals : meals.filter((meal) => meal.meal_type === filter);
    return visible.reduce<{ key: string; title: string; meals: MemoryMeal[] }[]>((result, meal) => {
      const key = meal.meal_date.slice(0, 7);
      let group = result.find((item) => item.key === key);
      if (!group) {
        const date = fromDateKey(`${key}-01`);
        group = { key, title: monthFormatter.format(date), meals: [] };
        result.push(group);
      }
      group.meals.push(meal);
      return result;
    }, []);
  }, [filter, meals]);

  if (authLoading) return <ScreenLoader />;
  if (!user) return <Redirect href="/auth" />;

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground source={require('../assets/diary-background.png')} resizeMode="cover" style={styles.background}>
        <View style={styles.shell}>
          <ScreenHeader title="Memórias" />
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Um álbum pessoal de todas as suas refeições</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}
            </ScrollView>

            {loading ? <ActivityIndicator style={styles.loader} color={colors.sageDark} /> : error ? (
              <View style={styles.messageCard}><Ionicons name="cloud-offline-outline" size={34} color={colors.sageDark} /><Text style={styles.messageTitle}>{error}</Text><Pressable onPress={() => void loadMemories()}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>
            ) : groups.length === 0 ? (
              <View style={styles.messageCard}><View style={styles.emptyIcon}><Ionicons name="images-outline" size={32} color={colors.sageDark} /></View><Text style={styles.messageTitle}>{meals.length ? 'Nenhuma foto neste filtro' : 'Seu álbum ainda está vazio'}</Text><Text style={styles.messageText}>{meals.length ? 'Escolha outro tipo de refeição.' : 'As fotografias das refeições registradas aparecerão aqui.'}</Text></View>
            ) : groups.map((group) => (
              <View key={group.key} style={styles.group}>
                <View style={styles.groupHeader}><Text style={styles.groupTitle}>{group.title}</Text><Text style={styles.groupCount}>{group.meals.length} {group.meals.length === 1 ? 'foto' : 'fotos'}</Text></View>
                <View style={styles.grid}>
                  {group.meals.map((meal) => <Pressable key={meal.id} accessibilityLabel={`Abrir memória de ${meal.meal_date}`} onPress={() => setSelected(meal)} style={[styles.photoCard, { width: columns === 3 ? '31.8%' : '48.5%' }]}><Image source={meal.imageUrl} style={styles.photo} contentFit="cover" transition={180} /><View style={styles.photoOverlay}><Text numberOfLines={1} style={styles.photoType}>{meal.meal_type || 'Refeição'}</Text><Text style={styles.photoDate}>{meal.meal_date.slice(8, 10)}/{meal.meal_date.slice(5, 7)}</Text></View></Pressable>)}
                </View>
              </View>
            ))}
          </ScrollView>
          <BottomNavigation />
        </View>
      </ImageBackground>

      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <Pressable accessibilityLabel="Fechar detalhes" onPress={() => setSelected(null)} style={styles.close}><Ionicons name="close" size={24} color={colors.ink} /></Pressable>
            {selected && <>
              <Image source={selected.imageUrl} style={styles.modalImage} contentFit="cover" transition={180} />
              <View style={styles.modalContent}>
                <View style={styles.detailTop}><View style={styles.typeBadge}><Ionicons name="restaurant-outline" size={16} color={colors.sageDark} /><Text style={styles.typeBadgeText}>{selected.meal_type || 'Refeição'}</Text></View><Text style={styles.detailTime}>{selected.meal_time.slice(0, 5)}</Text></View>
                <View style={styles.detailRow}><Ionicons name="calendar-outline" size={19} color={colors.sageDark} /><Text style={styles.detailDate}>{dateFormatter.format(fromDateKey(selected.meal_date))}</Text></View>
                <View style={styles.noteBox}><Text style={styles.noteLabel}>Observação</Text><Text style={styles.noteText}>{selected.note?.trim() || 'Nenhuma observação registrada.'}</Text></View>
              </View>
            </>}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5ED' },
  background: { flex: 1, width: '100%' },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  content: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 122, gap: 20 },
  subtitle: { maxWidth: 420, color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  filters: { gap: 8, paddingHorizontal: 1 },
  filter: { height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(250, 248, 241, 0.94)', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  filterActive: { borderColor: '#7D9476', backgroundColor: '#7D9476' },
  filterText: { color: colors.muted, fontSize: 13 },
  filterTextActive: { color: colors.white, fontWeight: '700' },
  loader: { marginVertical: 90 },
  messageCard: { minHeight: 250, borderRadius: 24, backgroundColor: 'rgba(250, 248, 241, 0.96)', padding: 28, alignItems: 'center', justifyContent: 'center', ...shadow },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  messageTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 13 },
  messageText: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7 },
  retry: { color: colors.sageDark, fontWeight: '700', marginTop: 14 },
  group: { gap: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 },
  groupTitle: { color: '#20351E', fontSize: 22, fontWeight: '700', textTransform: 'capitalize' },
  groupCount: { color: colors.muted, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  photoCard: { aspectRatio: 0.86, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.sageLight, ...shadow },
  photo: { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 48, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(27, 43, 25, 0.66)' },
  photoType: { color: colors.white, fontSize: 12.5, fontWeight: '700' },
  photoDate: { color: 'rgba(255,255,255,0.82)', fontSize: 10.5, marginTop: 2 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(29, 37, 27, 0.62)', padding: 20, alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '100%', maxWidth: 520, maxHeight: '90%', borderRadius: 26, overflow: 'hidden', backgroundColor: '#FAF8F1', ...shadow },
  close: { position: 'absolute', zIndex: 2, top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(250, 248, 241, 0.92)', alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: '100%', aspectRatio: 1.12, backgroundColor: colors.sageLight },
  modalContent: { padding: 20, gap: 14 },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { minHeight: 36, borderRadius: 18, backgroundColor: colors.sageLight, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  typeBadgeText: { color: colors.sageDark, fontSize: 13, fontWeight: '700' },
  detailTime: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailDate: { color: colors.ink, fontSize: 14 },
  noteBox: { borderRadius: 15, backgroundColor: '#EFEEE7', padding: 15 },
  noteLabel: { color: colors.sageDark, fontSize: 12, fontWeight: '700', marginBottom: 5 },
  noteText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
});
