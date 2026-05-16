import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import UpdateModal from '@/components/UpdateModal';
import { SessionInvalidateBridge } from '@/components/session-invalidate-bridge';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import {
  handleInitialNotification,
  registerForPushNotifications,
  setupNotificationListeners,
} from '@/services/push-notifications';

function PushAndUpdatesBootstrap() {
  const { user, isAuthenticated, initialized } = useAuth();
  const [updateVisible, setUpdateVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!initialized || !isAuthenticated || !user) return;
    void registerForPushNotifications();
    const cleanup = setupNotificationListeners(user);
    void handleInitialNotification(user);
    return cleanup;
  }, [initialized, isAuthenticated, user?.id]);

  useEffect(() => {
    if (__DEV__) return;
    void (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          setUpdateVisible(true);
        }
      } catch {
        /* expo-updates indisponible en dev local */
      }
    })();
  }, []);

  const onApplyUpdate = useCallback(async () => {
    setDownloading(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setDownloading(false);
    }
  }, []);

  return <UpdateModal visible={updateVisible} downloading={downloading} onUpdate={onApplyUpdate} />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <PushAndUpdatesBootstrap />
        <SafeAreaProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SessionInvalidateBridge />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
