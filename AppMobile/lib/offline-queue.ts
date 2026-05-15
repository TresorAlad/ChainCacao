/**
 * offline-queue.ts — File d'attente locale (SQLite via AsyncStorage)
 * pour les transferts et réceptions coopérative hors-ligne.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { OFFLINE_QUEUE_KEY, OFFLINE_QUEUE_UPDATED_EVENT } from '@/lib/storage-keys';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingTransfer {
  id: string;
  actor_id: string;
  batch_id: string;
  to_actor_id: string;
  commentaire?: string;
  retries: number;
  created_at: string;
}

export interface PendingCoopReception {
  id: string;
  actor_id: string;
  lot_id: string;
  pin: string;
  poids_constate?: number;
  retries: number;
  created_at: string;
}

interface OfflineQueue {
  transfers: PendingTransfer[];
  coopReceptions: PendingCoopReception[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readQueue(): Promise<OfflineQueue> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return { transfers: [], coopReceptions: [] };
    return JSON.parse(raw) as OfflineQueue;
  } catch {
    return { transfers: [], coopReceptions: [] };
  }
}

async function writeQueue(q: OfflineQueue): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
  DeviceEventEmitter.emit(OFFLINE_QUEUE_UPDATED_EVENT);
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export async function enqueueTransfer(
  payload: Omit<PendingTransfer, 'id' | 'retries' | 'created_at'>
): Promise<void> {
  const q = await readQueue();
  q.transfers.push({
    ...payload,
    id: `tr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    retries: 0,
    created_at: new Date().toISOString(),
  });
  await writeQueue(q);
}

export async function listPendingTransfers(actorId?: string): Promise<PendingTransfer[]> {
  const q = await readQueue();
  if (!actorId) return q.transfers;
  return q.transfers.filter((t) => t.actor_id === actorId);
}

export async function dequeueTransfer(id: string): Promise<void> {
  const q = await readQueue();
  q.transfers = q.transfers.filter((t) => t.id !== id);
  await writeQueue(q);
}

export async function incrementTransferRetry(id: string): Promise<void> {
  const q = await readQueue();
  const t = q.transfers.find((x) => x.id === id);
  if (t) t.retries += 1;
  await writeQueue(q);
}

// ─── Coop Receptions ─────────────────────────────────────────────────────────

export async function enqueueCoopReception(
  payload: Omit<PendingCoopReception, 'id' | 'retries' | 'created_at'>
): Promise<void> {
  const q = await readQueue();
  q.coopReceptions.push({
    ...payload,
    id: `cr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    retries: 0,
    created_at: new Date().toISOString(),
  });
  await writeQueue(q);
}

export async function listPendingCoopReceptions(actorId?: string): Promise<PendingCoopReception[]> {
  const q = await readQueue();
  if (!actorId) return q.coopReceptions;
  return q.coopReceptions.filter((r) => r.actor_id === actorId);
}

export async function dequeueCoopReception(id: string): Promise<void> {
  const q = await readQueue();
  q.coopReceptions = q.coopReceptions.filter((r) => r.id !== id);
  await writeQueue(q);
}

export async function incrementCoopRetry(id: string): Promise<void> {
  const q = await readQueue();
  const r = q.coopReceptions.find((x) => x.id === id);
  if (r) r.retries += 1;
  await writeQueue(q);
}
