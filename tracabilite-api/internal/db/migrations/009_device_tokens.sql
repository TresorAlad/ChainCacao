-- Tokens FCM par acteur (persistants entre redémarrages API)

CREATE TABLE IF NOT EXISTS device_tokens (
    actor_id    TEXT NOT NULL,
    token       TEXT NOT NULL,
    platform    TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (actor_id, token)
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_actor_id ON device_tokens(actor_id);
