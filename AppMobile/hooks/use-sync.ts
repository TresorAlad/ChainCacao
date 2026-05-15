/**
 * use-sync.ts — Synchronisation des lots locaux et de la file d'attente hors-ligne.
 *
 * NetInfo retiré — sync déclenchée uniquement par l'intervalle de 30s
 * pour éviter les faux positifs de détection réseau Android (Vodafone / 4G).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';
import {
  batchApi,
  isNetworkError,
  TOKEN_KEY,
  USER_KEY,
  lotActionApi,
} from '@/services/api';
import { readLotsListForActor, writeLotsListForActor, type Lot } from '@/hooks/use-storage';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';
import {
  listPendingTransfers,
  dequeueTransfer,
  incrementTransferRetry,
  listPendingCoopReceptions,
  dequeueCoopReception,
  incrementCoopRetry,
} from '@/lib/offline-queue';

const SYNC_INTERVAL_MS = 30000;

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

// ─── Transferts en attente ─────────────────────────────────────────────────────

async function syncPendingTransfers(actorId: string): Promise<void> {
  const pending = await listPendingTransfers(actorId);
  for (const t of pending) {
    if (t.retries > 8) continue;
    try {
      await batchApi.transfer({
        batch_id: t.batch_id,
        to_actor_id: t.to_actor_id,
        commentaire: t.commentaire,
      });
      await dequeueTransfer(t.id);
    } catch (e) {
      if (isNetworkError(e)) break;
      await incrementTransferRetry(t.id);
    }
  }
}

// ─── Réceptions coopérative en attente ────────────────────────────────────────

async function syncPendingCoopReceptions(actorId: string): Promise<void> {
  const pending = await listPendingCoopReceptions(actorId);
  for (const r of pending) {
    if (r.retries > 8) continue;
    try {
      await lotActionApi.confirmerReception(r.lot_id, {
        pin: r.pin,
        poids_constate: r.poids_constate,
      });
      await dequeueCoopReception(r.id);
    } catch (e) {
      if (isNetworkError(e)) break;
      await incrementCoopRetry(r.id);
    }
  }
}

// ─── Lots locaux (photos en attente) ──────────────────────────────────────────

async function syncPendingLots(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const actorId = await getActorIdFromStorage();
    if (!actorId) return;

    await syncPendingTransfers(actorId);
    await syncPendingCoopReceptions(actorId);

    // Synchronise uniquement les photos en attente (lots déjà créés côté serveur).
    const lots = await readLotsListForActor(actorId);
    const photoPending = lots.filter(
      (l) =>
        l.synced &&
        l.photoUri &&
        (l.syncPhase === 'photo_pending' || l.syncPhase === 'data_synced')
    );
    if (photoPending.length === 0) return;

    let changed = false;
    const updated = [...lots];

    for (const lot of photoPending) {
      const idx = updated.findIndex((l) => l.id === lot.id);
      if (idx === -1 || !lot.photoUri || lot.id.startsWith('local_')) continue;
      try {
        await batchApi.uploadPhoto(lot.id, lot.photoUri);
        updated[idx] = {
          ...updated[idx],
          photoUri: undefined,
          syncPhase: 'complete',
          status: 'Terminé',
        };
        changed = true;
      } catch (e) {
        if (isNetworkError(e)) break;
      }
    }

    if (changed) {
      await writeLotsListForActor(actorId, updated);
      DeviceEventEmitter.emit(LOTS_UPDATED_EVENT);
    }
  } catch {
    /* ignore */
  }
}

// ─── Export public ────────────────────────────────────────────────────────────

/** Déclenche manuellement une passe de synchronisation. */
export async function runPendingSync(): Promise<void> {
  await syncPendingLots();
}

export function useSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const triggerSync = useCallback(async () => {
    await runPendingSync();
  }, []);

  useEffect(() => {
    triggerSync();
    intervalRef.current = setInterval(triggerSync, SYNC_INTERVAL_MS);
    // NetInfo.addEventListener retiré — faux positifs Android (Vodafone / 4G).
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [triggerSync]);

  return { triggerSync };
}
