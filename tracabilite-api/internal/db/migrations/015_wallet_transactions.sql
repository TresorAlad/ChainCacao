-- Historique portefeuille (dépôts, retraits, paiements reçus / envoyés)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id              BIGSERIAL PRIMARY KEY,
    actor_id        TEXT NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL,
    amount          DOUBLE PRECISION NOT NULL,
    counterparty_id TEXT,
    lot_id          TEXT,
    list_id         TEXT,
    reference       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_actor_created ON wallet_transactions(actor_id, created_at DESC);
