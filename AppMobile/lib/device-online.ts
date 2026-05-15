import type { NetInfoState } from '@react-native-community/netinfo';

/**
 * Retourne `true` uniquement si la connectivité est confirmée explicitement.
 *
 * `isConnected === null` (état initial Android au démarrage) est traité comme
 * "inconnu / hors-ligne" pour éviter de lancer des syncs prématurées.
 * `isInternetReachable === null` est toléré (Android ne le renseigne pas toujours)
 * tant que `isConnected === true`.
 */
export function isDeviceOnline(state: NetInfoState): boolean {
  if (state.isConnected !== true) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}
