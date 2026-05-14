import { useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Route legacy : redirige vers la création de lot (agriculteur).
 */
export default function CreationLotRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(agriculteur)/nouveaulot' as any);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator size="large" color="#1B5E20" />
    </View>
  );
}
