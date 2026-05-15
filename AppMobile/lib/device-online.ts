/**
 * device-online.ts — DÉSACTIVÉ (mode online forcé)
 *
 * Les fonctions retournent toujours `true` pour ne jamais bloquer les requêtes API.
 * La détection NetInfo génère des faux négatifs sur Android (4G / Vodafone) ce qui
 * provoquait des blocages d'inscription et de connexion alors que le réseau est actif.
 *
 * À réactiver lorsque le problème NetInfo Android sera résolu.
 */

import type { NetInfoState } from '@react-native-community/netinfo';

/** Toujours `true` — pré-vérification réseau désactivée. */
export function isNetworkLikelyAvailable(_state: NetInfoState): boolean {
  return true;
}

/** Toujours `true` — détection hors-ligne désactivée. */
export function isDeviceOnline(_state: NetInfoState): boolean {
  return true;
}
