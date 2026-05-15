import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDb } from '@/lib/db';
import type { Lot } from '@/hooks/use-storage';
import {
  COOP_LOTS_CACHE_KEY,
  LOTS_STORAGE_KEY,
  OFFLINE_QUEUE_KEY,
} from '@/lib/storage-keys';
import { USER_KEY } from '@/services/api';
import type { BatchResponse } from '@/services/api';

const MIGRATION_KEY = 'async_migrated_v1';

type LotsByActor = Record<string, Lot[]>;

type LegacyQueue = {
  transfers?: Array<{
    id: string;
    batch_id: string;
    to_actor_id: string;
    commentaire?: string;
    actor_id: string;
    created_at: string;
    retries: number;
  }>;
  coopReceptions?: Array<{
    id: string;
    lot_id: string;
    pin: string;
    actor_id: string;
    created_at: string;
    retries: number;
  }>;
};

async function isMigrated(): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [MIGRATION_KEY]
  );
  return row?.value === '1';
}

function parseLotsMap(raw: string | null): LotsByActor {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) {
      return {};
    }
    if (p && typeof p === 'object') {
      return p as LotsByActor;
    }
  } catch {
    /* ignore */
  }
  return {};
}

async function migrateLots(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  const raw = await AsyncStorage.getItem(LOTS_STORAGE_KEY);
  if (!raw) return;

  let map = parseLotsMap(raw);
  try {
    const p = JSON.parse(raw) as unknown;
    if (Array.isArray(p)) {
      const userRaw = await AsyncStorage.getItem(USER_KEY);
      if (userRaw) {
        const u = JSON.parse(userRaw) as { id?: string };
        if (u.id) map = { [u.id]: p as Lot[] };
      }
    }
  } catch {
    return;
  }

  const now = new Date().toISOString();
  for (const [actorId, lots] of Object.entries(map)) {
    if (!Array.isArray(lots)) continue;
    for (const lot of lots) {
      await db.runAsync(
        `INSERT OR IGNORE INTO local_lots (
          id, actor_id, title, status, date, poids, acheteur, destination, type_cacao,
          synced, sync_phase, chain_statut, photo_uri, latitude, longitude,
          signature, payload_hash, signer_pubkey, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lot.id,
          actorId,
          lot.title,
          lot.status,
          lot.date,
          lot.poids,
          lot.acheteur ?? null,
          lot.destination ?? null,
          lot.typeCacao ?? null,
          lot.synced ? 1 : 0,
          lot.syncPhase ?? null,
          lot.chainStatut ?? null,
          lot.photoUri ?? null,
          lot.latitude ?? null,
          lot.longitude ?? null,
          lot.signature ?? null,
          lot.payload_hash ?? null,
          lot.signer_pubkey ?? null,
          now,
          now,
        ]
      );
    }
  }
}

async function migrateQueue(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return;
  try {
    const q = JSON.parse(raw) as LegacyQueue;
    for (const t of q.transfers ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO pending_transfers
         (id, batch_id, to_actor_id, commentaire, actor_id, created_at, retries)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id,
          t.batch_id,
          t.to_actor_id,
          t.commentaire ?? null,
          t.actor_id,
          t.created_at,
          t.retries ?? 0,
        ]
      );
    }
    for (const r of q.coopReceptions ?? []) {
      await db.runAsync(
        `INSERT OR IGNORE INTO pending_coop_receptions
         (id, lot_id, pin, poids_constate, actor_id, created_at, retries)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id,
          r.lot_id,
          r.pin,
          (r as { poids_constate?: number }).poids_constate ?? null,
          r.actor_id,
          r.created_at,
          r.retries ?? 0,
        ]
      );
    }
  } catch {
    /* ignore */
  }
}

async function migrateCoopCache(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  const raw = await AsyncStorage.getItem(COOP_LOTS_CACHE_KEY);
  if (!raw) return;
  let actorId = '__global__';
  const userRaw = await AsyncStorage.getItem(USER_KEY);
  if (userRaw) {
    try {
      const u = JSON.parse(userRaw) as { id?: string };
      if (u.id) actorId = u.id;
    } catch {
      /* ignore */
    }
  }
  try {
    const parsed = JSON.parse(raw) as { lots?: BatchResponse[] };
    const lots = parsed.lots ?? [];
    await db.runAsync(
      `INSERT OR REPLACE INTO coop_lots_cache (actor_id, payload, cached_at) VALUES (?, ?, ?)`,
      [actorId, JSON.stringify(lots), new Date().toISOString()]
    );
  } catch {
    /* ignore */
  }
}

/** Importe une fois les données AsyncStorage vers SQLite (CDC). */
export async function migrateFromAsyncStorageIfNeeded(): Promise<void> {
  if (await isMigrated()) return;
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await migrateLots(db);
    await migrateQueue(db);
    await migrateCoopCache(db);
    await db.runAsync('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)', [
      MIGRATION_KEY,
      '1',
    ]);
  });
  await AsyncStorage.multiRemove([LOTS_STORAGE_KEY, OFFLINE_QUEUE_KEY, COOP_LOTS_CACHE_KEY]);
}
