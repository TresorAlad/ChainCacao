import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';
import { myLotsApi, type BatchResponse } from '@/services/api';

export { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';

export interface Lot {
  id: string;
  title: string;
  status: 'Terminé' | 'En cours' | 'Problème';
  date: string;
  poids: string;
  acheteur?: string;
  destination?: string;
  parcelle?: string;
  culture?: string;
  variete?: string;
  typeCacao?: string;
  synced: boolean;
  syncPhase?: 'pending' | 'data_synced' | 'photo_pending' | 'complete';
  chainStatut?: string;
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  signature?: string;
  payload_hash?: string;
  signer_pubkey?: string;
}

export function batchResponseToLot(b: BatchResponse): Lot {
  const culture = b.culture ?? 'Lot';
  const lieu = b.lieu ?? '';
  const title = `${culture} — ${lieu}`.trim() || b.id;
  return {
    id: b.id,
    title,
    status: 'Terminé',
    date: b.date_recolte ?? b.timestamp ?? '',
    poids: String(b.quantite ?? 0),
    destination: lieu || undefined,
    culture: b.culture,
    synced: true,
    chainStatut: b.statut,
    syncPhase: 'complete',
  };
}

/** Charge les lots depuis l’API (session requise). */
export async function readLotsListForActor(actorId: string | undefined): Promise<Lot[]> {
  if (!actorId) return [];
  try {
    const { data } = await myLotsApi.list();
    return (data.lots ?? []).map(batchResponseToLot);
  } catch {
    return [];
  }
}

/** Plus de persistance locale des lots — les données viennent du serveur. */
export async function writeLotsListForActor(_actorId: string | undefined, _lots: Lot[]): Promise<void> {
  /* no-op */
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
      const { data } = await myLotsApi.list();
      setLots((data.lots ?? []).map(batchResponseToLot));
    } catch (e) {
      console.error('Erreur chargement lots (API):', e);
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  const saveLot = useCallback(
    async (_lot?: Lot) => {
      await loadLots();
      DeviceEventEmitter.emit(LOTS_UPDATED_EVENT);
    },
    [loadLots]
  );

  const updateLot = useCallback(
    async (id: string, changes: Partial<Lot>) => {
      setLots((prev) => prev.map((l) => (l.id === id ? { ...l, ...changes } : l)));
    },
    []
  );

  const deleteLot = useCallback(async () => {
    await loadLots();
  }, [loadLots]);

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
