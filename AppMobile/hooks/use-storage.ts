import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';
import {
  deleteLotForActor,
  listLotsForActor,
  patchLotForActor,
  replaceLotsForActor,
} from '@/lib/offline-lots-repo';

export { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';

export interface Lot {
  id: string;
  title: string;
  status: 'Terminé' | 'En cours' | 'Problème';
  date: string;
  poids: string;
  acheteur?: string;
  destination?: string;
  /** Nom de parcelle saisi par l’utilisateur (CDC). */
  parcelle?: string;
  typeCacao?: string;
  synced: boolean;
  /** Phase sync CDC : données texte puis photo (mode 2G). */
  syncPhase?: 'pending' | 'data_synced' | 'photo_pending' | 'complete';
  chainStatut?: string;
  /** Copie locale (documentDirectory) pour sync hors ligne après prise de vue. */
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  /** Intégrité ECDSA (CDC §14). */
  signature?: string;
  payload_hash?: string;
  signer_pubkey?: string;
}

/** Lecture disque SQLite pour la sync. */
export async function readLotsListForActor(actorId: string | undefined): Promise<Lot[]> {
  if (!actorId) return [];
  return listLotsForActor(actorId);
}

export async function writeLotsListForActor(actorId: string | undefined, lots: Lot[]): Promise<void> {
  if (!actorId) return;
  await replaceLotsForActor(actorId, lots);
}

export function useLots() {
  const { user } = useAuth();
  const actorId = user?.id;

  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLots = useCallback(async () => {
    setLoading(true);
    try {
      if (!actorId) {
        setLots([]);
        return;
      }
      const list = await listLotsForActor(actorId);
      setLots(list);
    } catch (e) {
      console.error('Erreur lecture lots:', e);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  const saveLot = useCallback(
    async (lot: Lot) => {
      if (!actorId) return;
      try {
        const existing = await listLotsForActor(actorId);
        const updated = [lot, ...existing.filter((l) => l.id !== lot.id)];
        await replaceLotsForActor(actorId, updated);
        setLots(updated);
      } catch (e) {
        console.error('Erreur sauvegarde lot:', e);
      }
    },
    [actorId]
  );

  const updateLot = useCallback(
    async (id: string, changes: Partial<Lot>) => {
      if (!actorId) return;
      try {
        await patchLotForActor(actorId, id, changes);
        const updated = await listLotsForActor(actorId);
        setLots(updated);
      } catch (e) {
        console.error('Erreur mise à jour lot:', e);
      }
    },
    [actorId]
  );

  const deleteLot = useCallback(
    async (id: string) => {
      if (!actorId) return;
      try {
        await deleteLotForActor(actorId, id);
        const updated = await listLotsForActor(actorId);
        setLots(updated);
      } catch (e) {
        console.error('Erreur suppression lot:', e);
      }
    },
    [actorId]
  );

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(LOTS_UPDATED_EVENT, () => {
      loadLots();
    });
    return () => sub.remove();
  }, [loadLots]);

  return { lots, loading, saveLot, updateLot, deleteLot, loadLots };
}
