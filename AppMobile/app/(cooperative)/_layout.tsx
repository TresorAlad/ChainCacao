import { Stack } from 'expo-router';

/** Stack coopérative — navigation basse unifiée via CoopBottomNav sur chaque écran. */
export default function CooperativeLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
