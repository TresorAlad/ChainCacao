import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useAuth } from '@/hooks/use-auth';
import { LOTS_STORAGE_KEY, LOTS_UPDATED_EVENT } from '@/lib/storage-keys';

export { LOTS_STORAGE_KEY, LOTS_UPDATED_EVENT } from '@/lib/storage-keys';

export interface Lot {
  id: string;
  title: string;
  status: 'Terminé' | 'En cours' | 'Problème';
  date: string;
  poids: string;
  acheteur?: string;
  destination?: string;
  typeCacao?: string;
  synced: boolean; // true = confirmé blockchain, false = en attente de sync
}

type LotsByActor = Record<string, Lot[]>;

function parseStoredLots(
  raw: string | null,
  actorId: string | undefined
): { list: Lot[]; migratedMap: LotsByActor | null } {
  if (!raw || !actorId) return { list: [], migratedMap: null };
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) {
      const migratedMap: LotsByActor = { [actorId]: p as Lot[] };
      return { list: p as Lot[], migratedMap };
    }
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const map = p as LotsByActor;
      const row = map[actorId];
      return { list: Array.isArray(row) ? row : [], migratedMap: null };
    }
  } catch {
    /* ignore */
  }
  return { list: [], migratedMap: null };
}

/** Lecture disque pour la sync (USER_KEY + token déjà présents). */
export async function readLotsListForActor(actorId: string | undefined): Promise<Lot[]> {
  if (!actorId) return [];
  const raw = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
  const { list, migratedMap } = parseStoredLots(raw, actorId);
  if (migratedMap) {
    await AsyncStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(migratedMap));
  }
  return list;
}

export async function writeLotsListForActor(actorId: string | undefined, lots: Lot[]): Promise<void> {
  if (!actorId) return;
  const raw = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
  let map: LotsByActor = {};
  if (raw) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        map = {};
      } else if (p && typeof p === 'object' && !Array.isArray(p)) {
        map = { ...(p as LotsByActor) };
      }
    } catch {
      /* ignore */
    }
  }
  map[actorId] = lots;
  await AsyncStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(map));
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
      const raw = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
      const { list, migratedMap } = parseStoredLots(raw, actorId);
      if (migratedMap) {
        await AsyncStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(migratedMap));
      }
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
        const existing = await readLotsListForActor(actorId);
        const updated = [lot, ...existing.filter((l) => l.id !== lot.id)];
        await writeLotsListForActor(actorId, updated);
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
        const existing = await readLotsListForActor(actorId);
        const updated = existing.map((l) => (l.id === id ? { ...l, ...changes } : l));
        await writeLotsListForActor(actorId, updated);
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
        const existing = await readLotsListForActor(actorId);
        const updated = existing.filter((l) => l.id !== id);
        await writeLotsListForActor(actorId, updated);
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
