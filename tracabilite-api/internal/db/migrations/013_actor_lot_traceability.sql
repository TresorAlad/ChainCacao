-- Index de traçabilité : lots auxquels un acteur a participé (création, transfert, réception).
-- Complète GetBatchesByOwner Fabric quand le chaincode déployé est ancien.
CREATE TABLE IF NOT EXISTS actor_lot_traceability (
    actor_id   TEXT NOT NULL,
    batch_id   TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (actor_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_actor_lot_traceability_batch ON actor_lot_traceability (batch_id);
