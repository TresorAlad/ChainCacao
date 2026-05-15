/**
 * coop-cache-repo.ts — Cache AsyncStorage des lots coopérative.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COOP_LOTS_CACHE_KEY } from '@/lib/storage-keys';
import type { BatchResponse } from '@/services/api';

function cacheKey(actorId?: string): string {
  return `${COOP_LOTS_CACHE_KEY}_${actorId ?? 'unknown'}`;
}

export async function readCoopLotsCache(actorId?: string): Promise<BatchResponse[]> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(actorId));
    if (!raw) return [];
    return JSON.parse(raw) as BatchResponse[];
  } catch {
    return [];
  }
}

export async function writeCoopLotsCache(actorId?: string, lots?: BatchResponse[]): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(actorId), JSON.stringify(lots ?? []));
  } catch {
    /* ignore */
  }
}
