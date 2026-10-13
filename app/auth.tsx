import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { useScreenFade } from '@/hooks/useScreenFade';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useNotification } from '@/providers/NotificationProvider';

type AuthFieldProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onToggleVisibility?: () => void;
  passwordVisible?: boolean;
};

function resetWebViewport() {
  if (Platform.OS !== 'web') return;

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const resetScroll = () => window.scrollTo({ left: 0, top: 0, behavior: 'auto' });
  resetScroll();
  window.requestAnimationFrame(resetScroll);
  window.setTimeout(resetScroll, 300);
}

function AuthField({ icon, label, onToggleVisibility, passwordVisible, ...props }: AuthFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name={icon} size={24} color="#52664A" />
        <TextInput
          {...props}
          placeholderTextColor="#979990"
          selectionColor="#52664A"
          style={styles.input}
        />
        {onToggleVisibility && (
          <Pressable accessibilityLabel={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'} hitSlop={10} onPress={onToggleVisibility} style={styles.eyeButton}>
            <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={24} color="#52664A" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const { height, width } = useWindowDimensions();
  const compact = width <= 430 || height <= 760;
  const router = useRouter();
  const { opacity, fadeOut } = useScreenFade();
  const { notify } = useNotification();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'error' | 'info'>('error');

  async function submit() {
    setMessage('');
    setMessageTone('error');
    if (!isSupabaseConfigured) {
      setMessage('Configure as variáveis do Supabase no arquivo .env.');
      notify({ type: 'error', title: 'Supabase não configurado', message: 'Preencha as variáveis no arquivo .env.' });
      return;
    }
    if (isSignUp && name.trim().length < 2) {
      setMessage('Informe seu nome com pelo menos 2 caracteres.');
      notify({ type: 'error', title: 'Confira seu nome', message: 'Informe pelo menos 2 caracteres.' });
      return;
    }
    if (!email.trim() || password.length < 6) {
      setMessage('Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
      notify({ type: 'error', title: 'Confira os dados', message: 'Use um e-mail válido e uma senha com pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    const result = isSignUp
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      notify({ type: 'error', title: isSignUp ? 'Cadastro não concluído' : 'Não foi possível entrar', message: result.error.message });
    } else if (isSignUp) {
      if (result.data.session) await supabase.auth.signOut();
      setIsSignUp(false);
      setPassword('');
      setPasswordVisible(false);
      const needsConfirmation = !result.data.session;
      setMessageTone('info');
      setMessage(needsConfirmation ? 'Cadastro concluído. Confirme seu e-mail e depois entre na sua conta.' : 'Cadastro concluído. Entre com seu e-mail e senha.');
      notify({ type: needsConfirmation ? 'info' : 'success', title: needsConfirmation ? 'Confirme seu e-mail' : 'Conta criada', message: needsConfirmation ? 'Depois da confirmação, volte para fazer login.' : 'Agora entre com os dados cadastrados.', duration: 5000 });
    } else {
      notify({ type: 'success', title: isSignUp ? 'Conta criada' : 'Login realizado', message: 'Seu diário está pronto.' });
      Keyboard.dismiss();
      resetWebViewport();
      await fadeOut();
      router.replace('/diary');
      resetWebViewport();
    }
  }

  function switchMode() {
    setIsSignUp((value) => !value);
    setMessage('');
    setMessageTone('error');
    setPasswordVisible(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.animatedScreen, { opacity }]}>
        <ImageBackground source={require('../assets/auth-background.png')} resizeMode="cover" style={styles.background}>
          <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              contentContainerStyle={styles.page}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.hero, compact && styles.heroCompact]}>
                <View style={[styles.mark, compact && styles.markCompact]}><Ionicons name="leaf-outline" size={compact ? 30 : 36} color="#405238" /></View>
                <Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>Diário Alimentar</Text>
                <Text style={styles.subtitle}>Suas refeições, do seu jeito.</Text>
                <View style={styles.heroLine} />
              </View>

              <View style={[styles.sheet, compact && styles.sheetCompact]}>
                <View style={[styles.form, compact && styles.formCompact]}>
                {isSignUp && <Text style={styles.formTitle}>Crie sua conta</Text>}

                  {isSignUp && (
                    <AuthField
                      icon="person-outline"
                      label="Nome"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      autoComplete="name"
                      maxLength={80}
                      placeholder="Seu nome"
                    />
                  )}
                  <AuthField
                    icon="mail-outline"
                    label="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                  />
                  <AuthField
                    icon="lock-closed-outline"
                    label="Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="Mínimo de 6 caracteres"
                    passwordVisible={passwordVisible}
                    onToggleVisibility={() => setPasswordVisible((value) => !value)}
                  />

                  {!!message && <Text style={[styles.message, messageTone === 'info' && styles.messageInfo]}>{message}</Text>}

                  <Pressable onPress={submit} disabled={loading} style={({ pressed }) => [styles.primary, pressed && styles.pressed, loading && styles.disabled]}>
                    <View style={styles.buttonSide} />
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>{isSignUp ? 'Cadastrar' : 'Entrar'}</Text>}
                    <View style={styles.buttonSide}><Ionicons name="arrow-forward" size={28} color={colors.white} /></View>
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Ionicons name="leaf-outline" size={25} color="#53684B" />
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable onPress={switchMode} style={styles.switchButton}>
                    <Text style={styles.switchText}>{isSignUp ? 'Já tenho uma conta' : 'Ainda não tenho uma conta'}</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#34472C' },
  animatedScreen: { flex: 1 },
  background: { flex: 1, width: '100%' },
  keyboard: { flex: 1 },
  page: { flexGrow: 1, width: '100%', maxWidth: 680, alignSelf: 'center' },
  hero: { height: 330, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 34 },
  heroCompact: { height: 225, paddingBottom: 24 },
  mark: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0E5', marginBottom: 18 },
  markCompact: { width: 60, height: 60, borderRadius: 30, marginBottom: 13 },
  brandTitle: { color: '#F8F6EF', fontSize: 30, fontWeight: '600', letterSpacing: 0, textAlign: 'center' },
  brandTitleCompact: { fontSize: 26 },
  subtitle: { color: '#D9DDCF', fontSize: 15, marginTop: 8, textAlign: 'center' },
  heroLine: { width: 46, height: 2, borderRadius: 1, backgroundColor: '#809172', marginTop: 22 },
  sheet: { flexGrow: 1, minHeight: 560, borderTopLeftRadius: 42, borderTopRightRadius: 42, backgroundColor: 'rgba(249, 247, 240, 0.96)', overflow: 'hidden' },
  sheetCompact: { minHeight: 470, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  form: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 34, paddingTop: 39, paddingBottom: 68, gap: 21 },
  formCompact: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40, gap: 16 },
  formTitle: { color: '#20211E', fontSize: 24, fontWeight: '600', letterSpacing: 0, marginBottom: 5 },
  fieldGroup: { gap: 8 },
  label: { color: '#44593D', fontSize: 15, fontWeight: '600' },
  inputShell: { height: 61, borderWidth: 1, borderColor: '#D4D1C6', borderRadius: 13, backgroundColor: 'rgba(255, 255, 255, 0.36)', paddingLeft: 19, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 15 },
  input: { flex: 1, height: '100%', color: '#252720', fontSize: 16, paddingVertical: 0 },
  eyeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  message: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: -7 },
  messageInfo: { color: colors.sageDark },
  primary: { height: 62, borderRadius: 14, backgroundColor: '#415936', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, shadowColor: '#273121', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4 },
  buttonSide: { width: 30, alignItems: 'center' },
  primaryText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 3 },
  dividerLine: { width: 95, maxWidth: '30%', height: 1, backgroundColor: '#D8D6CC' },
  switchButton: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4 },
  switchText: { color: '#415936', fontSize: 15, textDecorationLine: 'underline' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.68 },
});
