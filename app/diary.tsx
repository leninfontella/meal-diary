import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MealCard } from '@/components/MealCard';
import { ScreenLoader } from '@/components/ScreenLoader';
import { WeekCalendar } from '@/components/WeekCalendar';
import { colors, shadow } from '@/constants/theme';
import { useScreenFade } from '@/hooks/useScreenFade';
import { toDateKey } from '@/lib/date';
import { supabase } from '@/lib/supabase';
import type { Meal } from '@/lib/types';
import { useAuth } from '@/providers/AuthProvider';
import { useNotification } from '@/providers/NotificationProvider';

export default function DiaryScreen() {
  const router = useRouter();
  const { opacity } = useScreenFade();
  const { loading: authLoading, user } = useAuth();
  const { notify } = useNotification();
  const [selected, setSelected] = useState(new Date());
  const [displayName, setDisplayName] = useState<string>(() => String(user?.user_metadata?.name ?? '').trim());
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadMeals();
    void loadProfile();
  }, [loadMeals, loadProfile]));

  if (authLoading) return <ScreenLoader />;
  if (!user) return <Redirect href="/auth" />;

  const selectedIsToday = toDateKey(selected) === toDateKey(new Date());
  const mealCountText = `${meals.length} ${meals.length === 1 ? 'refeição' : 'refeições'} ${selectedIsToday ? 'hoje' : 'neste dia'}`;
  const addRoute = { pathname: '/meal/new' as const, params: { date: toDateKey(selected) } };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.animatedScreen, { opacity }]}>
        <ImageBackground source={require('../assets/diary-background.png')} resizeMode="cover" style={styles.background}>
        <View style={styles.shell}>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={loading && meals.length > 0} onRefresh={loadMeals} tintColor={colors.sageDark} />}
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

            <WeekCalendar selected={selected} onSelect={setSelected} />

            <View style={styles.summary}>
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
              <View style={styles.list}>{meals.map((meal) => <MealCard key={meal.id} meal={meal} onPress={() => router.push({ pathname: '/meal/[id]', params: { id: meal.id } })} />)}</View>
            )}

          </ScrollView>

          <View style={styles.bottomBar}>
            <View style={styles.navItem}><Ionicons name="home" size={24} color="#284D27" /><Text style={styles.navActive}>Início</Text></View>
            <View style={styles.barSpacer} />
            <Pressable accessibilityLabel="Abrir perfil" onPress={() => router.push('/profile')} style={styles.navItem}><Ionicons name="person-outline" size={25} color="#78856F" /><Text style={styles.navText}>Perfil</Text></Pressable>
          </View>
          <Pressable accessibilityLabel="Adicionar foto" onPress={() => router.push(addRoute)} style={({ pressed }) => [styles.addButton, pressed && styles.addPressed]}>
            <Ionicons name="camera" size={28} color={colors.white} />
            <Text style={styles.addText}>Adicionar</Text>
          </Pressable>
        </View>
        </ImageBackground>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5ED' },
  animatedScreen: { flex: 1 },
  background: { flex: 1, width: '100%' },
  shell: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 27, paddingTop: 25, paddingBottom: 118 },
  header: { paddingTop: 4 },
  headerTop: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 12, gap: 3 },
  greeting: { color: '#20391F', fontSize: 23, fontWeight: '700', letterSpacing: 0 },
  headerSubtitle: { color: '#7B8676', fontSize: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3E7DA', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 24 },
  summary: { alignSelf: 'flex-start', minWidth: 245, height: 52, borderRadius: 26, backgroundColor: 'rgba(235, 236, 227, 0.9)', paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 20 },
  summaryIcon: { width: 28, alignItems: 'center' },
  summaryText: { flex: 1, color: '#3C5237', fontSize: 15 },
  list: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  loader: { marginVertical: 72 },
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 14 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center', marginTop: 7 },
  retry: { color: colors.sageDark, fontWeight: '700', marginTop: 16 },
  bottomBar: { position: 'absolute', left: 16, right: 16, bottom: 8, height: 72, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.94)', paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadow },
  navItem: { width: 64, height: 58, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navActive: { color: '#284D27', fontSize: 12, fontWeight: '700' },
  navText: { color: '#78856F', fontSize: 12 },
  barSpacer: { width: 78 },
  addButton: { position: 'absolute', bottom: 15, left: '50%', transform: [{ translateX: -41 }], width: 82, height: 82, borderRadius: 41, backgroundColor: '#78976C', borderWidth: 5, borderColor: '#F4F3EB', alignItems: 'center', justifyContent: 'center', ...shadow },
  addPressed: { transform: [{ translateX: -41 }, { scale: 0.96 }] },
  addText: { color: colors.white, fontSize: 11, fontWeight: '600', marginTop: 1 },
});
