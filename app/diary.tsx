import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MealCard } from '@/components/MealCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ScreenLoader } from '@/components/ScreenLoader';
import { WeekCalendar } from '@/components/WeekCalendar';
import { colors } from '@/constants/theme';
import { useScreenFade } from '@/hooks/useScreenFade';
import { getWeek, toDateKey } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import type { Meal } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';
import { useNotification } from '@/providers/NotificationProvider';

export default function DiaryScreen() {
  const { width } = useWindowDimensions();
  const compact = width <= 430;
  const router = useRouter();
  const { opacity } = useScreenFade();
  const { loading: authLoading, user } = useAuth();
  const { confirm } = useConfirmDialog();
  const { notify } = useNotification();
  const [selected, setSelected] = useState(new Date());
  const [displayName, setDisplayName] = useState<string>(() => String(user?.user_metadata?.name ?? '').trim());
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recordedDates, setRecordedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMeal, setActionMeal] = useState<Meal | null>(null);

  const loadMeals = useCallback(async () => {
    if (!user) return;
    setError('');
    const { data, error: queryError } = await supabase
      .from('meals')
      .select('*')
      .eq('meal_date', toDateKey(selected))
      .order('meal_time', { ascending: true });

    if (queryError) {
      setError('Não foi possível carregar as refeições.');
      setMeals([]);
      notify({ type: 'error', title: 'Erro ao carregar', message: 'Não foi possível buscar as refeições deste dia.' });
    } else {
      const rows = (data ?? []) as Meal[];
      const withUrls = await Promise.all(rows.map(async (meal) => {
        const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrl(meal.photo_path, 3600);
        return { ...meal, imageUrl: signed?.signedUrl };
      }));
      setMeals(withUrls);
    }
    setLoading(false);
  }, [notify, selected, user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('name, avatar_path').eq('user_id', user.id).maybeSingle();
    const profileName = typeof data?.name === 'string' ? data.name.trim() : '';
    const metadataName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
    setDisplayName(profileName || metadataName || user.email?.split('@')[0] || '');
    if (data?.avatar_path) {
      const { data: signed } = await supabase.storage.from('profile-photos').createSignedUrl(data.avatar_path, 3600);
      setAvatarUrl(signed?.signedUrl);
    } else {
      setAvatarUrl(undefined);
    }
  }, [user]);

  const loadRecordedDates = useCallback(async () => {
    if (!user) return;
    const week = getWeek(selected);
    const { data } = await supabase
      .from('meals')
      .select('meal_date')
      .eq('user_id', user.id)
      .gte('meal_date', week[0].key)
      .lte('meal_date', week[week.length - 1].key);
    setRecordedDates(new Set((data ?? []).map((item) => item.meal_date)));
  }, [selected, user]);

  const removeMeal = useCallback(async (meal: Meal) => {
    const { error: deleteError } = await supabase.from('meals').delete().eq('id', meal.id);
    if (deleteError) {
      notify({ type: 'error', title: 'Não foi possível excluir', message: deleteError.message });
      return;
    }
    const { error: storageError } = await supabase.storage.from('meal-photos').remove([meal.photo_path]);
    setMeals((current) => current.filter((item) => item.id !== meal.id));
    void loadRecordedDates();
    if (storageError) {
      notify({ type: 'info', title: 'Refeição excluída', message: 'O registro foi removido, mas a limpeza da foto precisará ser tentada novamente.' });
    } else {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      notify({ type: 'success', title: 'Publicação excluída', message: 'A refeição e a fotografia foram removidas.' });
    }
  }, [loadRecordedDates, notify]);

  const confirmMealRemoval = useCallback(async (meal: Meal) => {
    setActionMeal(null);
    const confirmed = await confirm({
      title: 'Excluir publicação?',
      message: 'A fotografia e a observação serão removidas definitivamente.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    });
    if (confirmed) await removeMeal(meal);
  }, [confirm, removeMeal]);

  const openMealOptions = useCallback((meal: Meal) => {
    if (Platform.OS === 'web') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionMeal(meal);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void Promise.all([loadMeals(), loadProfile(), loadRecordedDates()]);
  }, [loadMeals, loadProfile, loadRecordedDates]));

  if (authLoading) return <ScreenLoader />;
  if (!user) return <Redirect href="/auth" />;

  const selectedIsToday = toDateKey(selected) === toDateKey(new Date());
  const mealCountText = `${meals.length} ${meals.length === 1 ? 'refeição' : 'refeições'} ${selectedIsToday ? 'hoje' : 'neste dia'}`;
  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.animatedScreen, { opacity }]}>
        <ImageBackground source={require('../assets/diary-background.png')} resizeMode="cover" style={styles.background}>
        <View style={styles.shell}>
          <ScrollView
            contentContainerStyle={[styles.content, compact && styles.contentCompact]}
            refreshControl={<RefreshControl refreshing={loading && meals.length > 0} onRefresh={() => void Promise.all([loadMeals(), loadRecordedDates()])} tintColor={colors.sageDark} />}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerCopy}>
                  <Text numberOfLines={1} style={styles.greeting}>Olá{displayName ? `, ${displayName}` : ''}!</Text>
                  <Text style={styles.headerSubtitle}>Seu diário alimentar.</Text>
                </View>
                <Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push('/profile')} style={styles.avatar}>
                  {avatarUrl ? <Image source={avatarUrl} style={styles.avatarImage} contentFit="cover" transition={180} /> : <Ionicons name="person" size={25} color="#365331" />}
                </Pressable>
              </View>
            </View>

            <WeekCalendar markedDates={recordedDates} selected={selected} onSelect={setSelected} />

            <View style={[styles.summary, compact && styles.summaryCompact]}>
              <View style={styles.summaryIcon}><Ionicons name="leaf" size={22} color={colors.sageDark} /></View>
              <Text style={styles.summaryText}>{mealCountText}</Text>
              <Ionicons name="chevron-forward" size={22} color={colors.sageDark} />
            </View>

            {loading && meals.length === 0 ? (
              <ActivityIndicator style={styles.loader} color={colors.sageDark} />
            ) : error ? (
              <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={34} color={colors.sageDark} /><Text style={styles.emptyTitle}>{error}</Text><Pressable onPress={loadMeals}><Text style={styles.retry}>Tentar novamente</Text></Pressable></View>
            ) : meals.length === 0 ? (
              <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="restaurant-outline" size={31} color={colors.sageDark} /></View><Text style={styles.emptyTitle}>Nenhuma refeição neste dia</Text><Text style={styles.emptyText}>Toque na câmera para adicionar a primeira.</Text></View>
            ) : (
              <View style={styles.list}>{meals.map((meal) => <MealCard fullWidth={compact} key={meal.id} meal={meal} onLongPress={() => openMealOptions(meal)} onPress={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })} />)}</View>
            )}

          </ScrollView>

          <BottomNavigation addDate={toDateKey(selected)} />
        </View>
        </ImageBackground>
      </Animated.View>

      <Modal visible={Boolean(actionMeal)} transparent animationType="fade" onRequestClose={() => setActionMeal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionMeal(null)}>
          <Pressable style={styles.actionSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.actionHandle} />
            <View style={styles.actionHeader}>
              <View style={styles.actionIcon}><Ionicons name="restaurant-outline" size={24} color={colors.sageDark} /></View>
              <View style={styles.actionCopy}><Text style={styles.actionTitle}>{actionMeal?.meal_type || 'Refeição'}</Text><Text style={styles.actionSubtitle}>Escolha uma opção para esta publicação.</Text></View>
            </View>
            <Pressable onPress={() => { const meal = actionMeal; setActionMeal(null); if (meal) router.push({ pathname: '/meal/[id]', params: { id: meal.id } }); }} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><View style={styles.actionButtonIcon}><Ionicons name="create-outline" size={22} color={colors.sageDark} /></View><Text style={styles.actionButtonText}>Editar publicação</Text><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Pressable>
            <Pressable onPress={() => actionMeal && void confirmMealRemoval(actionMeal)} style={({ pressed }) => [styles.actionButton, styles.deleteButton, pressed && styles.actionPressed]}><View style={[styles.actionButtonIcon, styles.deleteIcon]}><Ionicons name="trash-outline" size={22} color={colors.danger} /></View><Text style={[styles.actionButtonText, styles.deleteText]}>Excluir publicação</Text><Ionicons name="chevron-forward" size={20} color={colors.danger} /></Pressable>
            <Pressable onPress={() => setActionMeal(null)} style={({ pressed }) => [styles.cancelButton, pressed && styles.actionPressed]}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5ED' },
  animatedScreen: { flex: 1 },
  background: { flex: 1, width: '100%' },
  shell: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 27, paddingTop: 25, paddingBottom: 118 },
  contentCompact: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 102 },
  header: { paddingTop: 4 },
  headerTop: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 12, gap: 3 },
  greeting: { color: '#20391F', fontSize: 23, fontWeight: '700', letterSpacing: 0 },
  headerSubtitle: { color: '#7B8676', fontSize: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3E7DA', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 24 },
  summary: { alignSelf: 'flex-start', minWidth: 245, height: 52, borderRadius: 26, backgroundColor: 'rgba(235, 236, 227, 0.9)', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 20 },
  summaryCompact: { alignSelf: 'stretch', minWidth: 0, height: 48, marginTop: 14, marginBottom: 16 },
  summaryIcon: { width: 28, alignItems: 'center' },
  summaryText: { flex: 1, color: '#3C5237', fontSize: 15 },
  list: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  loader: { marginVertical: 72 },
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 14 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 7 },
  retry: { color: colors.sageDark, fontWeight: '700', marginTop: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(29, 37, 27, 0.56)', justifyContent: 'flex-end', padding: 14 },
  actionSheet: { width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: 28, backgroundColor: '#FAF8F1', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, shadowColor: '#20271E', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.16, shadowRadius: 22, elevation: 10 },
  actionHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: '#D5D3CA', alignSelf: 'center', marginBottom: 18 },
  actionHeader: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 5, marginBottom: 17 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, gap: 3 },
  actionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  actionSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  actionButton: { minHeight: 58, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFFFF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 9 },
  actionButtonIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '600' },
  deleteButton: { borderColor: '#E7C5BF', backgroundColor: '#FCF3F1' },
  deleteIcon: { backgroundColor: '#F3E2DE' },
  deleteText: { color: colors.danger },
  cancelButton: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  cancelText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  actionPressed: { opacity: 0.72 },
});
