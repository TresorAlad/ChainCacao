import { Stack } from 'expo-router';

/** Stack dédié aux écrans agriculteur — évite les écrans noirs si la racine ne déclare pas toutes les routes. */
export default function AgriculteurLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
