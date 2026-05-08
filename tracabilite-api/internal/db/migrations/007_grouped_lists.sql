CREATE TABLE IF NOT EXISTS grouped_lists (
    id          TEXT PRIMARY KEY,
    created_by  TEXT NOT NULL,
    batch_ids   JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

