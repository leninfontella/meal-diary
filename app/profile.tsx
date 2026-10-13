import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenLoader } from '@/components/ScreenLoader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PhotoSourceModal } from '@/components/PhotoSourceModal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors } from '@/constants/theme';
import { useScreenFade } from '@/hooks/useScreenFade';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useConfirmDialog } from '@/providers/ConfirmDialogProvider';
import { useNotification } from '@/providers/NotificationProvider';

type Profile = { user_id: string; name: string | null; avatar_path: string | null };

export default function ProfileScreen() {
  const router = useRouter();
  const { opacity, fadeIn, fadeOut } = useScreenFade();
  const { loading: authLoading, user } = useAuth();
  const { confirm } = useConfirmDialog();
  const { notify } = useNotification();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoSourceVisible, setPhotoSourceVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, name, avatar_path').eq('user_id', user.id).maybeSingle();
      if (error) {
        notify({ type: 'error', title: 'Erro ao carregar perfil', message: error.message });
      } else if (data) {
        const row = data as Profile;
        setProfile(row);
        setName(row.name ?? '');
        if (row.avatar_path) {
          const { data: signed } = await supabase.storage.from('profile-photos').createSignedUrl(row.avatar_path, 3600);
          setAvatarUrl(signed?.signedUrl);
        }
      }
      setLoading(false);
    })();
  }, [notify, user]);

  async function openCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      notify({ type: 'error', title: 'Acesso à câmera necessário', message: 'Libere a permissão nas configurações do dispositivo.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setAvatar(result.assets[0]);
  }

  async function openLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify({ type: 'error', title: 'Acesso às fotos necessário', message: 'Libere a permissão nas configurações do dispositivo.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled) setAvatar(result.assets[0]);
  }

  function chooseAvatar() {
    if (Platform.OS === 'web') {
      void openLibrary();
      return;
    }
    setPhotoSourceVisible(true);
  }

  async function uploadAvatar(asset: ImagePicker.ImagePickerAsset) {
    if (!user) throw new Error('Sessão inválida.');
    const extension = (asset.fileName?.split('.').pop() || asset.mimeType?.split('/').pop() || 'jpg').replace('jpeg', 'jpg');
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const body = Platform.OS === 'web' && asset.file ? asset.file : await (await fetch(asset.uri)).arrayBuffer();
    const { error } = await supabase.storage.from('profile-photos').upload(path, body, { contentType: asset.mimeType || 'image/jpeg' });
    if (error) throw error;
    return path;
  }

  async function save() {
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      notify({ type: 'error', title: 'Nome muito curto', message: 'Informe pelo menos 2 caracteres.' });
      return;
    }
    if (!user) return;
    const nameChanged = cleanName !== (profile?.name ?? '').trim();
    const photoChanged = Boolean(avatar);
    if (!nameChanged && !photoChanged) {
      notify({ type: 'info', title: 'Perfil atualizado', message: 'Seus dados já estão atualizados.' });
      return;
    }
    setSaving(true);
    let newAvatarPath: string | null = null;
    try {
      if (avatar) newAvatarPath = await uploadAvatar(avatar);
      const avatarPath = newAvatarPath ?? profile?.avatar_path ?? null;
      const { error: authError } = await supabase.auth.updateUser({ data: { name: cleanName } });
      if (authError) throw authError;
      const { error } = await supabase.from('profiles').upsert({ user_id: user.id, name: cleanName, avatar_path: avatarPath }, { onConflict: 'user_id' });
      if (error) throw error;
      if (newAvatarPath && profile?.avatar_path) await supabase.storage.from('profile-photos').remove([profile.avatar_path]);
      setProfile({ user_id: user.id, name: cleanName, avatar_path: avatarPath });
      setAvatar(null);
      if (newAvatarPath) {
        const { data } = await supabase.storage.from('profile-photos').createSignedUrl(newAvatarPath, 3600);
        setAvatarUrl(data?.signedUrl);
      }
      const successMessage = nameChanged && photoChanged
        ? 'Seu nome e sua foto foram salvos.'
        : nameChanged
          ? 'Seu nome foi salvo.'
          : 'Sua foto foi atualizada.';
      notify({ type: 'success', title: 'Perfil atualizado', message: successMessage });
    } catch (error) {
      if (newAvatarPath) await supabase.storage.from('profile-photos').remove([newAvatarPath]);
      notify({ type: 'error', title: 'Não foi possível salvar', message: error instanceof Error ? error.message : 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fadeOut();
    const { error } = await supabase.auth.signOut();
    if (error) {
      fadeIn();
      notify({ type: 'error', title: 'Não foi possível sair', message: error.message });
      return;
    }
    notify({ type: 'success', title: 'Sessão encerrada', message: 'Até a próxima refeição.' });
    router.replace('/auth');
  }

  async function confirmLogout() {
    const confirmed = await confirm({
      title: 'Sair da conta?',
      message: 'Você poderá entrar novamente com seu e-mail e senha.',
      confirmLabel: 'Sair',
      tone: 'danger',
    });
    if (confirmed) await logout();
  }

  async function removeUserFiles(bucket: 'meal-photos' | 'profile-photos') {
    if (!user) return;
    const paths: string[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await supabase.storage.from(bucket).list(user.id, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      const files = (data ?? []).filter((item) => Boolean(item.id));
      paths.push(...files.map((item) => `${user.id}/${item.name}`));
      if ((data ?? []).length < 100) break;
    }
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await supabase.storage.from(bucket).remove(paths.slice(index, index + 100));
      if (error) throw error;
    }
  }

  async function deleteAccount() {
    if (!user || deleting) return;
    const firstConfirmation = await confirm({
      title: 'Excluir sua conta?',
      message: 'Todas as refeições, fotografias, observações, perfil e histórico serão apagados permanentemente.',
      confirmLabel: 'Continuar',
      tone: 'danger',
    });
    if (!firstConfirmation) return;
    const finalConfirmation = await confirm({
      title: 'Esta ação é definitiva',
      message: 'Não será possível recuperar sua conta ou suas fotos. Deseja excluir tudo agora?',
      confirmLabel: 'Excluir tudo',
      tone: 'danger',
    });
    if (!finalConfirmation) return;

    setDeleting(true);
    try {
      await Promise.all([removeUserFiles('meal-photos'), removeUserFiles('profile-photos')]);
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await supabase.auth.signOut({ scope: 'local' });
      notify({ type: 'success', title: 'Conta excluída', message: 'Seus dados e fotografias foram removidos.' });
      router.replace('/auth');
    } catch (deleteError) {
      notify({ type: 'error', title: 'Não foi possível excluir a conta', message: deleteError instanceof Error ? deleteError.message : 'Tente novamente.' });
      setDeleting(false);
    }
  }

  if (authLoading || loading) return <ScreenLoader />;
  if (!user) return <Redirect href="/auth" />;

  const displayedAvatar = avatar?.uri || avatarUrl;

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.animatedScreen, { opacity }]}>
        <ImageBackground source={require('../assets/diary-background.png')} resizeMode="cover" style={styles.background}>
        <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.shell}>
          <ScreenHeader title="Perfil" />

          <ScrollView
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={styles.content}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarSection}>
              <Pressable accessibilityLabel="Alterar foto de perfil" onPress={chooseAvatar} style={styles.avatarButton}>
                {displayedAvatar ? <Image source={displayedAvatar} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatarFallback}><Ionicons name="person" size={58} color={colors.sageDark} /></View>}
                <View style={styles.cameraBadge}><Ionicons name="camera" size={19} color={colors.white} /></View>
              </Pressable>
              <Text style={styles.welcome}>Olá{profile?.name ? `, ${profile.name}` : ''}!</Text>
              <Text style={styles.welcomeText}>Que bom ter você por aqui.</Text>
              <Pressable onPress={chooseAvatar} style={styles.changeButton}><Text style={styles.changeText}>Alterar foto</Text></Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="leaf-outline" size={25} color={colors.sageDark} /></View><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>Dados pessoais</Text><Text style={styles.sectionDescription}>Mantenha seus dados sempre atualizados.</Text></View></View>
              <View style={styles.fieldGroup}><Text style={styles.label}>Nome</Text><View style={styles.inputShell}><Ionicons name="person-outline" size={23} color={colors.sageDark} /><TextInput value={name} onChangeText={setName} autoCapitalize="words" maxLength={80} placeholder="Como você quer ser chamado?" placeholderTextColor={colors.muted} style={styles.input} /></View></View>
              <View style={styles.fieldGroup}><Text style={styles.label}>E-mail</Text><View style={styles.readonly}><Ionicons name="mail-outline" size={23} color={colors.muted} /><Text numberOfLines={1} style={styles.readonlyText}>{user.email}</Text><Ionicons name="lock-closed-outline" size={18} color={colors.muted} /></View></View>
              <Pressable disabled={saving} onPress={save} style={({ pressed }) => [styles.save, pressed && styles.pressed, saving && styles.disabled]}>
                {saving ? <ActivityIndicator color={colors.white} /> : <><Ionicons name="checkmark" size={21} color={colors.white} /><Text style={styles.saveText}>Salvar alterações</Text></>}
              </Pressable>
            </View>

            <View style={styles.accountSection}>
              <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="shield-checkmark-outline" size={25} color={colors.sageDark} /></View><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>Conta</Text><Text style={styles.sectionDescription}>Gerencie sua conta no Diário Alimentar.</Text></View></View>
              <Pressable disabled={deleting} onPress={() => void confirmLogout()} style={({ pressed }) => [styles.logout, pressed && styles.pressed, deleting && styles.disabled]}><Ionicons name="log-out-outline" size={22} color={colors.danger} /><Text style={styles.logoutText}>Sair da conta</Text></Pressable>
              <Pressable disabled={deleting} onPress={() => void deleteAccount()} style={({ pressed }) => [styles.deleteAccount, pressed && styles.pressed, deleting && styles.disabled]}>{deleting ? <ActivityIndicator color={colors.white} /> : <><Ionicons name="trash-outline" size={22} color={colors.white} /><Text style={styles.deleteAccountText}>Excluir conta e todos os dados</Text></>}</Pressable>
            </View>
          </ScrollView>
          <BottomNavigation />
          </View>
        </KeyboardAvoidingView>
        </ImageBackground>
      </Animated.View>
      <PhotoSourceModal
        description="Escolha de onde vem sua nova foto de perfil."
        onCamera={() => void openCamera()}
        onClose={() => setPhotoSourceVisible(false)}
        onLibrary={() => void openLibrary()}
        title="Alterar foto"
        visible={photoSourceVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F5ED' },
  animatedScreen: { flex: 1 },
  background: { flex: 1, width: '100%' },
  keyboard: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  content: { paddingHorizontal: 18, paddingBottom: 118, gap: 20 },
  avatarSection: { alignItems: 'center', borderRadius: 28, backgroundColor: 'rgba(250, 248, 241, 0.94)', paddingVertical: 30, paddingHorizontal: 20, shadowColor: '#514F43', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 2 },
  avatarButton: { width: 126, height: 126 },
  avatar: { width: 126, height: 126, borderRadius: 63, backgroundColor: colors.sageLight },
  avatarFallback: { width: 126, height: 126, borderRadius: 63, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', right: 2, bottom: 5, width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: colors.background, backgroundColor: colors.sageDark, alignItems: 'center', justifyContent: 'center' },
  welcome: { color: '#20351E', fontSize: 22, fontWeight: '700', marginTop: 15 },
  welcomeText: { color: colors.muted, fontSize: 15, marginTop: 4 },
  changeButton: { paddingHorizontal: 14, paddingVertical: 8, marginTop: 8 },
  changeText: { color: colors.sageDark, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  section: { gap: 18, borderRadius: 28, backgroundColor: 'rgba(250, 248, 241, 0.96)', padding: 24, shadowColor: '#514F43', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 2 },
  accountSection: { gap: 18, borderRadius: 28, backgroundColor: 'rgba(250, 248, 241, 0.96)', padding: 24, shadowColor: '#514F43', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sectionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  sectionCopy: { flex: 1, gap: 3 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' },
  sectionDescription: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  fieldGroup: { gap: 8 },
  label: { color: colors.ink, fontSize: 15, fontWeight: '600' },
  inputShell: { minHeight: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.5)', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, height: 52, color: colors.ink, fontSize: 15, paddingVertical: 0 },
  readonly: { minHeight: 54, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: '#ECEAE3', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  readonlyText: { flex: 1, color: colors.muted, fontSize: 15 },
  save: { height: 58, borderRadius: 13, backgroundColor: colors.sageDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 2, shadowColor: colors.sageDark, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 3 },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  logout: { minHeight: 58, borderRadius: 13, borderWidth: 1, borderColor: '#E2B8B0', backgroundColor: '#F9ECE9', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  deleteAccount: { minHeight: 58, borderRadius: 13, backgroundColor: colors.danger, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  deleteAccountText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.65 },
});
