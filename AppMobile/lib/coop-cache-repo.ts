import type { BatchResponse } from '@/services/api';
import { getDb } from '@/lib/db';

export async function readCoopLotsCache(actorId: string | undefined): Promise<BatchResponse[]> {
  if (!actorId) return [];
  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM coop_lots_cache WHERE actor_id = ?',
    [actorId]
  );
  if (!row?.payload) return [];
  try {
    const lots = JSON.parse(row.payload) as BatchResponse[];
    return Array.isArray(lots) ? lots : [];
  } catch {
    return [];
  }
}

export async function writeCoopLotsCache(actorId: string | undefined, lots: BatchResponse[]): Promise<void> {
  if (!actorId) return;
  const db = await getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO coop_lots_cache (actor_id, payload, cached_at) VALUES (?, ?, ?)',
    [actorId, JSON.stringify(lots), new Date().toISOString()]
  );
}
