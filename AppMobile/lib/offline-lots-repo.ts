import { DeviceEventEmitter } from 'react-native';

import type { SQLiteDatabase } from 'expo-sqlite';

import { getDb } from '@/lib/db';
import type { Lot } from '@/hooks/use-storage';
import { LOTS_UPDATED_EVENT } from '@/lib/storage-keys';

type LotRow = {
  id: string;
  actor_id: string;
  title: string;
  status: string;
  date: string;
  poids: string;
  acheteur: string | null;
  destination: string | null;
  parcelle: string | null;
  type_cacao: string | null;
  synced: number;
  sync_phase: string | null;
  chain_statut: string | null;
  photo_uri: string | null;
  latitude: number | null;
  longitude: number | null;
  signature: string | null;
  payload_hash: string | null;
  signer_pubkey: string | null;
};

function rowToLot(row: LotRow): Lot {
  return {
    id: row.id,
    title: row.title,
    status: row.status as Lot['status'],
    date: row.date,
    poids: row.poids,
    acheteur: row.acheteur ?? undefined,
    destination: row.destination ?? undefined,
    parcelle: row.parcelle ?? undefined,
    typeCacao: row.type_cacao ?? undefined,
    synced: row.synced === 1,
    syncPhase: (row.sync_phase as Lot['syncPhase']) ?? undefined,
    chainStatut: row.chain_statut ?? undefined,
    photoUri: row.photo_uri ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    signature: row.signature ?? undefined,
    payload_hash: row.payload_hash ?? undefined,
    signer_pubkey: row.signer_pubkey ?? undefined,
  };
}

const INSERT_LOT_SQL = `
INSERT OR REPLACE INTO local_lots (
  id, actor_id, title, status, date, poids, acheteur, destination, parcelle, type_cacao,
  synced, sync_phase, chain_statut, photo_uri, latitude, longitude,
  signature, payload_hash, signer_pubkey, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

async function insertLot(db: SQLiteDatabase, actorId: string, lot: Lot, now: string): Promise<void> {
  await db.runAsync(INSERT_LOT_SQL, [
    lot.id,
    actorId,
    lot.title,
    lot.status,
    lot.date,
    lot.poids,
    lot.acheteur ?? null,
    lot.destination ?? null,
    lot.parcelle ?? null,
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
  ]);
}

export async function listLotsForActor(actorId: string): Promise<Lot[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<LotRow>(
    'SELECT * FROM local_lots WHERE actor_id = ? ORDER BY updated_at DESC',
    [actorId]
  );
  return rows.map(rowToLot);
}

export async function replaceLotsForActor(actorId: string, lots: Lot[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM local_lots WHERE actor_id = ?', [actorId]);
    for (const lot of lots) {
      await insertLot(db, actorId, lot, now);
    }
  });
  DeviceEventEmitter.emit(LOTS_UPDATED_EVENT);
}

export async function upsertLotForActor(actorId: string, lot: Lot): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await insertLot(db, actorId, lot, now);
  DeviceEventEmitter.emit(LOTS_UPDATED_EVENT);
}

export async function patchLotForActor(actorId: string, id: string, changes: Partial<Lot>): Promise<void> {
  const rows = await listLotsForActor(actorId);
  const existing = rows.find((l) => l.id === id);
  if (!existing) return;
  await upsertLotForActor(actorId, { ...existing, ...changes });
}

export async function deleteLotForActor(actorId: string, id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM local_lots WHERE actor_id = ? AND id = ?', [actorId, id]);
  DeviceEventEmitter.emit(LOTS_UPDATED_EVENT);
}
