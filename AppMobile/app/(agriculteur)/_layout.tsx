import { Stack } from 'expo-router';

/**
 * Stack dédié au rôle agriculteur : stabilise la résolution des routes du groupe `(agriculteur)`
 * et l’historique retour depuis « Nouveau lot », QR, etc.
 */
export default function AgriculteurLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
