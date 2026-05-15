/**
 * pin-local.ts — Gestion du PIN de déverrouillage local.
 */
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'chaincacao_local_pin';
const PIN_SET_KEY = 'chaincacao_pin_set';

export async function savePinLocally(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
  await SecureStore.setItemAsync(PIN_SET_KEY, 'true');
}

export async function verifyLocalPin(pin: string): Promise<boolean> {
  try {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    return stored === pin;
  } catch {
    return false;
  }
}

export async function isPinSet(): Promise<boolean> {
  try {
    const flag = await SecureStore.getItemAsync(PIN_SET_KEY);
    return flag === 'true';
  } catch {
    return false;
  }
}

export async function clearLocalPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(PIN_SET_KEY);
}
