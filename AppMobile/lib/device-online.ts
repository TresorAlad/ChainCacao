import type { NetInfoState } from '@react-native-community/netinfo';

/**
 * NetInfo sur mobile renvoie souvent `isConnected: null` ou `isInternetReachable: null`
 * alors que le réseau fonctionne. On ne considère « hors ligne » que si c’est explicitement false.
 */
export function isDeviceOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}
