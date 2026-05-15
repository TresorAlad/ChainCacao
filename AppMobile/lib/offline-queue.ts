import { DeviceEventEmitter } from 'react-native';

import { getDb } from '@/lib/db';
import { OFFLINE_QUEUE_UPDATED_EVENT } from '@/lib/storage-keys';

export type PendingTransfer = {
  id: string;
  batch_id: string;
  to_actor_id: string;
  commentaire?: string;
  actor_id: string;
  created_at: string;
  retries: number;
};

export type PendingCoopReception = {
  id: string;
  lot_id: string;
  pin: string;
  poids_constate?: number;
  actor_id: string;
  created_at: string;
  retries: number;
};

type TransferRow = PendingTransfer;
type CoopRow = PendingCoopReception;

function emitQueueUpdated(): void {
  DeviceEventEmitter.emit(OFFLINE_QUEUE_UPDATED_EVENT);
}

export async function enqueueTransfer(
  item: Omit<PendingTransfer, 'id' | 'created_at' | 'retries'>
): Promise<void> {
  const db = await getDb();
  const id = `txf_${Date.now()}`;
  const created_at = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO pending_transfers (id, batch_id, to_actor_id, commentaire, actor_id, created_at, retries)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [id, item.batch_id, item.to_actor_id, item.commentaire ?? null, item.actor_id, created_at]
  );
  emitQueueUpdated();
}

export async function dequeueTransfer(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_transfers WHERE id = ?', [id]);
  emitQueueUpdated();
}

export async function listPendingTransfers(actorId?: string): Promise<PendingTransfer[]> {
  const db = await getDb();
  if (actorId) {
    return db.getAllAsync<TransferRow>(
      'SELECT * FROM pending_transfers WHERE actor_id = ? ORDER BY created_at ASC',
      [actorId]
    );
  }
  return db.getAllAsync<TransferRow>('SELECT * FROM pending_transfers ORDER BY created_at ASC');
}

export async function enqueueCoopReception(
  item: Omit<PendingCoopReception, 'id' | 'created_at' | 'retries'>
): Promise<void> {
  const db = await getDb();
  const id = `rcpt_${Date.now()}`;
  const created_at = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO pending_coop_receptions (id, lot_id, pin, poids_constate, actor_id, created_at, retries)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      item.lot_id,
      item.pin,
      item.poids_constate ?? null,
      item.actor_id,
      created_at,
    ]
  );
  emitQueueUpdated();
}

export async function dequeueCoopReception(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_coop_receptions WHERE id = ?', [id]);
  emitQueueUpdated();
}

export async function listPendingCoopReceptions(actorId?: string): Promise<PendingCoopReception[]> {
  const db = await getDb();
  if (actorId) {
    return db.getAllAsync<CoopRow>(
      'SELECT * FROM pending_coop_receptions WHERE actor_id = ? ORDER BY created_at ASC',
      [actorId]
    );
  }
  return db.getAllAsync<CoopRow>(
    'SELECT * FROM pending_coop_receptions ORDER BY created_at ASC'
  );
}

export async function incrementTransferRetry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE pending_transfers SET retries = retries + 1 WHERE id = ?', [id]);
  emitQueueUpdated();
}

export async function incrementCoopRetry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE pending_coop_receptions SET retries = retries + 1 WHERE id = ?', [id]);
  emitQueueUpdated();
}
