import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/hooks/use-auth';
import { SessionInvalidateBridge } from '@/components/session-invalidate-bridge';
import { SyncBootstrap } from '@/components/sync-bootstrap';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <SyncBootstrap />
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <SessionInvalidateBridge />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(agriculteur)" />
            <Stack.Screen name="(cooperative)" />
            <Stack.Screen name="(exportateur)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="historique" />
            <Stack.Screen name="transfert" />
            <Stack.Screen name="production" />
            <Stack.Screen name="creationlot" />
            <Stack.Screen name="caracteristiqueslot" />
            <Stack.Screen name="confirmer-reception-lot" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
