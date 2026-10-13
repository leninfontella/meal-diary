import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { ConfirmDialogProvider } from '@/providers/ConfirmDialogProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function RootLayout() {
  const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:8081').replace(/\/$/, '');
  const title = 'Diário Alimentar';
  const description = 'Registre suas refeições em um diário alimentar simples e pessoal.';
  const socialImage = `${siteUrl}/social-share.png`;

  return (
    <SafeAreaProvider>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#365333" />
        <meta name="application-name" content={title} />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={socialImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Diário Alimentar com folhas e uma refeição saudável" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={socialImage} />
      </Head>
      <AuthProvider>
        <ConfirmDialogProvider>
          <NotificationProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
          </NotificationProvider>
        </ConfirmDialogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
