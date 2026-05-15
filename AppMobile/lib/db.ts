import * as SQLite from 'expo-sqlite';

const DB_NAME = 'chaincacao_offline.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_lots (
  id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  date TEXT NOT NULL,
  poids TEXT NOT NULL,
  acheteur TEXT,
  destination TEXT,
  type_cacao TEXT,
  synced INTEGER NOT NULL DEFAULT 0,
  sync_phase TEXT,
  chain_statut TEXT,
  photo_uri TEXT,
  latitude REAL,
  longitude REAL,
  signature TEXT,
  payload_hash TEXT,
  signer_pubkey TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (id, actor_id)
);

CREATE INDEX IF NOT EXISTS idx_local_lots_actor ON local_lots(actor_id);
CREATE INDEX IF NOT EXISTS idx_local_lots_synced ON local_lots(actor_id, synced);

CREATE TABLE IF NOT EXISTS pending_transfers (
  id TEXT PRIMARY KEY NOT NULL,
  batch_id TEXT NOT NULL,
  to_actor_id TEXT NOT NULL,
  commentaire TEXT,
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pending_transfers_actor ON pending_transfers(actor_id);

CREATE TABLE IF NOT EXISTS pending_coop_receptions (
  id TEXT PRIMARY KEY NOT NULL,
  lot_id TEXT NOT NULL,
  pin TEXT NOT NULL,
  poids_constate REAL,
  actor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retries INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pending_coop_actor ON pending_coop_receptions(actor_id);

CREATE TABLE IF NOT EXISTS coop_lots_cache (
  actor_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  cached_at TEXT NOT NULL
);
`;

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(SCHEMA_SQL);
  const alters = [
    'ALTER TABLE pending_coop_receptions ADD COLUMN poids_constate REAL',
    'ALTER TABLE local_lots ADD COLUMN parcelle TEXT',
    'ALTER TABLE local_lots ADD COLUMN culture TEXT',
    'ALTER TABLE local_lots ADD COLUMN variete TEXT',
  ];
  for (const sql of alters) {
    try {
      await db.execAsync(sql);
    } catch {
      /* colonne déjà présente */
    }
  }
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await initSchema(db);
      const { migrateFromAsyncStorageIfNeeded } = await import('@/lib/offline-migrate');
      await migrateFromAsyncStorageIfNeeded();
      return db;
    })();
  }
  return dbPromise;
}

/** Réinitialise le singleton (tests uniquement). */
export function resetDbForTests(): void {
  dbPromise = null;
}
