/**
 * Stockage et vérification locale du PIN (fallback hors-ligne).
 *
 * Le hash est stocké dans SecureStore (chiffré par le keystore Android / iOS Keychain).
 * On utilise un simple hash SHA-256 avec sel statique — suffisant pour une vérification locale
 * sur un appareil où le trousseau est déjà accessible. Le vrai contrôle d'autorité reste côté API.
 */
import * as SecureStore from 'expo-secure-store';

const SECURE_KEY = 'chaincacao_pin_hash_v1';
const SALT = 'chaincacao::pin::v1';

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Persiste le hash du PIN dans SecureStore. Appeler lors du set/update du PIN. */
export async function storePinHash(pin: string): Promise<void> {
  const hash = await sha256Hex(SALT + pin);
  await SecureStore.setItemAsync(SECURE_KEY, hash);
}

/** Vérifie le PIN contre le hash stocké localement. Retourne `null` si aucun hash enregistré. */
export async function verifyPinLocal(pin: string): Promise<boolean | null> {
  const stored = await SecureStore.getItemAsync(SECURE_KEY);
  if (!stored) return null;
  const hash = await sha256Hex(SALT + pin);
  return hash === stored;
}

/** Supprime le hash local (lors du logout ou reset). */
export async function clearPinHash(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEY);
  } catch {
    /* ignoré si la clé n'existe pas */
  }
}
