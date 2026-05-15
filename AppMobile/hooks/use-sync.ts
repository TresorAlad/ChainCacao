import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { DeviceEventEmitter } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';
import {
  batchApi,
  isNetworkError,
  syncApi,
  TOKEN_KEY,
  USER_KEY,
  lotActionApi,
  type SyncBatchInput,
} from '@/services/api';
import { readLotsListForActor, writeLotsListForActor, type Lot } from '@/hooks/use-storage';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';
import { verifyLotPayload } from '@/lib/lot-crypto';
import type { LotSignPayload } from '@/lib/lot-payload';
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

function convertDateToISO(frDate: string): string {
  const parts = frDate.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

function lotToSignPayload(lot: Lot, actorId: string): LotSignPayload | null {
  const lat = lot.latitude;
  const lon = lot.longitude;
  if (lat == null || lon == null || lat === 0 || lon === 0) return null;
  const lieu = (lot.destination || '').trim();
  if (!lieu) return null;
  const parcelleName = (lot.parcelle || lot.destination || '').trim();
  return {
    client_lot_id: lot.id,
    culture: (lot.typeCacao || '').trim() || 'Cacao',
    variete: lot.typeCacao,
    quantite: parseFloat(String(lot.poids).replace(',', '.')) || 0,
    lieu,
    latitude: lat,
    longitude: lon,
    parcelle: parcelleName || undefined,
    date_recolte: convertDateToISO(lot.date),
    notes: lot.title !== lot.typeCacao ? lot.title : undefined,
    actor_id: actorId,
  };
}

function lotToSyncInput(lot: Lot, actorId: string): SyncBatchInput | null {
  const p = lotToSignPayload(lot, actorId);
  if (!p) return null;
  return {
    client_lot_id: p.client_lot_id,
    culture: p.culture,
    variete: p.variete,
    quantite: p.quantite,
    lieu: p.lieu,
    latitude: p.latitude,
    longitude: p.longitude,
    parcelle: p.parcelle,
    date_recolte: p.date_recolte,
    notes: p.notes,
    payload_hash: lot.payload_hash,
    signature: lot.signature,
    signer_pubkey: lot.signer_pubkey,
  };
}

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

async function syncPendingLots(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const actorId = await getActorIdFromStorage();
    if (!actorId) return;

    await syncPendingTransfers(actorId);
    await syncPendingCoopReceptions(actorId);

    const lots = await readLotsListForActor(actorId);
    const needWork = lots.filter(
      (l) =>
        !l.synced ||
        l.syncPhase === 'data_synced' ||
        l.syncPhase === 'photo_pending' ||
        (l.synced && l.photoUri)
    );
    if (needWork.length === 0) return;

    let changed = false;
    const updated = [...lots];

    for (const lot of needWork) {
      const idx = updated.findIndex((l) => l.id === lot.id);
      if (idx === -1) continue;

      // Étape 2G — photo en arrière-plan (lot déjà créé côté serveur)
      if (lot.syncPhase === 'data_synced' || lot.syncPhase === 'photo_pending' || (lot.synced && lot.photoUri)) {
        if (!lot.photoUri) continue;
        try {
          const dateISO = convertDateToISO(lot.date);
          const culture = (lot.typeCacao || '').trim() || 'Cacao';
          const lieu = (lot.destination || '').trim();
          if (lot.id.startsWith('local_')) continue;
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
        continue;
      }

      if (lot.synced) continue;

      try {
        const signPayload = lotToSignPayload(lot, actorId);
        if (signPayload && lot.signature && lot.signer_pubkey) {
          const ok = await verifyLotPayload(signPayload, lot.signature, lot.signer_pubkey);
          if (!ok) {
            updated[idx] = { ...updated[idx], status: 'Problème' };
            changed = true;
            continue;
          }
        }

        // Mode 2G : d’abord JSON (texte), photo plus tard si présente
        if (lot.photoUri) {
          const syncItem = lotToSyncInput(lot, actorId);
          if (!syncItem) {
            updated[idx] = { ...updated[idx], status: 'Problème' };
            changed = true;
            continue;
          }
          const { data } = await syncApi.pushLots([syncItem]);
          const res = data.results?.[0];
          if (res?.error) {
            updated[idx] = { ...updated[idx], status: 'Problème' };
            changed = true;
            continue;
          }
          const serverId = res?.lot_id ?? lot.id;
          updated[idx] = {
            ...updated[idx],
            id: serverId,
            synced: true,
            syncPhase: 'photo_pending',
            chainStatut: 'cree',
            status: 'En cours',
          };
          changed = true;
          continue;
        }

        // Sans photo : sync JSON uniquement
        const syncItem = lotToSyncInput(lot, actorId);
        if (!syncItem) {
          updated[idx] = { ...updated[idx], status: 'Problème' };
          changed = true;
          continue;
        }
        const { data } = await syncApi.pushLots([syncItem]);
        const res = data.results?.[0];
        if (res?.error) {
          updated[idx] = { ...updated[idx], status: 'Problème' };
          changed = true;
          continue;
        }
        const serverId = res?.lot_id ?? lot.id;
        updated[idx] = {
          ...updated[idx],
          id: serverId,
          synced: true,
          syncPhase: 'complete',
          chainStatut: 'cree',
          status: 'Terminé',
        };
        changed = true;
      } catch (e) {
        if (isNetworkError(e)) break;
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], status: 'Problème' };
          changed = true;
        }
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
