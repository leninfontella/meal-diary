import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { ConfirmDialogProvider } from '@/providers/ConfirmDialogProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
