import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useCallback } from 'react';
import { batchApi, isNetworkError, TOKEN_KEY } from '@/services/api';
import { Lot } from '@/hooks/use-storage';

const STORAGE_KEY = 'chaincacao_lots';
const SYNC_INTERVAL_MS = 30000; // 30 secondes (requis par le CDC)

async function syncPendingLots(): Promise<void> {
  try {
    // Vérifier qu'on a un token JWT
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const lots: Lot[] = JSON.parse(raw);
    const pending = lots.filter(l => !l.synced);
    if (pending.length === 0) return;

    let changed = false;
    const updated = [...lots];

    for (const lot of pending) {
      try {
        const dateISO = convertDateToISO(lot.date);
        const { data } = await batchApi.create({
          culture: lot.typeCacao || lot.title,
          quantite: parseFloat(lot.poids) || 0,
          lieu: lot.destination || 'Non définie',
          dateRecolte: dateISO,
          notes: lot.title !== lot.typeCacao ? lot.title : undefined,
        });

        // Mettre à jour le lot avec l'UUID blockchain et le marquer synced
        const idx = updated.findIndex(l => l.id === lot.id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            id: data.id || updated[idx].id,
            synced: true,
          };
          changed = true;
        }
      } catch (e) {
        // Erreur réseau → arrêter la sync (réessayer au prochain cycle)
        if (isNetworkError(e)) break;
        // Erreur API spécifique (ex: doublon) → marquer comme problème
        const idx = updated.findIndex(l => l.id === lot.id);
        if (idx !== -1 && !isNetworkError(e)) {
          updated[idx] = { ...updated[idx], status: 'Problème' };
          changed = true;
        }
      }
    }

    if (changed) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (_) {}
}

function convertDateToISO(frDate: string): string {
  // Convertir JJ/MM/AAAA → AAAA-MM-JJ
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
    // Lancer une sync immédiate au montage
    triggerSync();

    // Sync toutes les 30 secondes (CDC §6.2)
    intervalRef.current = setInterval(triggerSync, SYNC_INTERVAL_MS);

    // Sync dès qu'on se reconnecte
    const unsubscribe = NetInfo.addEventListener(state => {
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
