import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';

/** Émis après synchronisation batch hors-ligne ([`use-sync.ts`](hooks/use-sync.ts)). */
export const LOTS_UPDATED_EVENT = 'chaincacao:lotsUpdated';

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

export const LOTS_STORAGE_KEY = 'chaincacao_lots';

export function useLots() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLots = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
      if (data) setLots(JSON.parse(data));
    } catch (e) {
      console.error('Erreur lecture lots:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveLot = useCallback(async (lot: Lot) => {
    try {
      const current = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
      const existing: Lot[] = current ? JSON.parse(current) : [];
      const updated = [lot, ...existing.filter(l => l.id !== lot.id)];
      await AsyncStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updated));
      setLots(updated);
    } catch (e) {
      console.error('Erreur sauvegarde lot:', e);
    }
  }, []);

  const updateLot = useCallback(async (id: string, changes: Partial<Lot>) => {
    try {
      const current = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
      const existing: Lot[] = current ? JSON.parse(current) : [];
      const updated = existing.map(l => l.id === id ? { ...l, ...changes } : l);
      await AsyncStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updated));
      setLots(updated);
    } catch (e) {
      console.error('Erreur mise à jour lot:', e);
    }
  }, []);

  const deleteLot = useCallback(async (id: string) => {
    try {
      const current = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
      const existing: Lot[] = current ? JSON.parse(current) : [];
      const updated = existing.filter(l => l.id !== id);
      await AsyncStorage.setItem(LOTS_STORAGE_KEY, JSON.stringify(updated));
      setLots(updated);
    } catch (e) {
      console.error('Erreur suppression lot:', e);
    }
  }, []);

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
