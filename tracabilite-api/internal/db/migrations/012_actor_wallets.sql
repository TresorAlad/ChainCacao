-- Soldes portefeuille demo (persistants entre redémarrages API / nouveaux comptes)
CREATE TABLE IF NOT EXISTS actor_wallets (
    actor_id    TEXT PRIMARY KEY REFERENCES actors(id) ON DELETE CASCADE,
    balance     DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (balance >= 0),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actor_wallets_updated ON actor_wallets(updated_at);
