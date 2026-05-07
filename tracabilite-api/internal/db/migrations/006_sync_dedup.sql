CREATE TABLE IF NOT EXISTS sync_dedup (
    actor_id        TEXT NOT NULL,
    client_lot_id   TEXT NOT NULL,
    lot_id          TEXT NOT NULL,
    tx_hash         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (actor_id, client_lot_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_dedup_created_at ON sync_dedup(created_at DESC);

