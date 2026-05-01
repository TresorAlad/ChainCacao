import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { DeviceEventEmitter } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';
import { batchApi, isNetworkError, TOKEN_KEY, USER_KEY } from '@/services/api';
import { readLotsListForActor, writeLotsListForActor } from '@/hooks/use-storage';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';

const SYNC_INTERVAL_MS = 30000; // 30 secondes (requis par le CDC)

async function getActorIdFromStorage(): Promise<string | undefined> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return undefined;
  try {
    const u = JSON.parse(raw) as { id?: string };
    return u.id;
  } catch {
    return undefined;
  }
}

async function syncPendingLots(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const actorId = await getActorIdFromStorage();
    if (!actorId) return;

    const lots = await readLotsListForActor(actorId);
    const pending = lots.filter((l) => !l.synced);
    if (pending.length === 0) return;

    let changed = false;
    const updated = [...lots];

    for (const lot of pending) {
      try {
        const dateISO = convertDateToISO(lot.date);
        const culture = (lot.typeCacao || '').trim() || 'Cacao';
        const lieu = (lot.destination || '').trim();
        if (!lieu) continue;

        const idx = updated.findIndex((l) => l.id === lot.id);

        const { data } = await batchApi.create({
          culture,
          quantite: parseFloat(lot.poids) || 0,
          lieu,
          date_recolte: dateISO,
          notes: lot.title !== lot.typeCacao ? lot.title : undefined,
        });

        const serverId = data.batch?.id ?? lot.id;

        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            id: serverId,
            synced: true,
          };
          changed = true;
        }
      } catch (e) {
        if (isNetworkError(e)) break;
        const idx = updated.findIndex((l) => l.id === lot.id);
        if (idx !== -1 && !isNetworkError(e)) {
          updated[idx] = { ...updated[idx], status: 'Problème' };
          changed = true;
        }
      }
    }

    if (changed) {
      await writeLotsListForActor(actorId, updated);
      DeviceEventEmitter.emit(LOTS_UPDATED_EVENT);
    }
  } catch (_) {}
}

function convertDateToISO(frDate: string): string {
  const parts = frDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

export function useSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerSync = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      await syncPendingLots();
    }
  }, []);

  useEffect(() => {
    triggerSync();

    intervalRef.current = setInterval(triggerSync, SYNC_INTERVAL_MS);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncPendingLots();
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      unsubscribe();
    };
  }, [triggerSync]);

  return { triggerSync };
}
