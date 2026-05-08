-- ChainCacao API — schema PostgreSQL (Neon / Docker compatible)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE actor_role AS ENUM (
        'admin',
        'agriculteur',
        'cooperative',
        'transformateur',
        'exportateur',
        'ministere'
    );
EXCEPTION
    WHEN duplicate_object THEN
        -- Le type existe déjà: on s'assure que toutes les valeurs attendues sont présentes.
        ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'admin';
        ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'agriculteur';
        ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'cooperative';
        ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'transformateur';
        ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'exportateur';
        ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'ministere';
END $$;

CREATE TABLE IF NOT EXISTS actors (
    id              TEXT PRIMARY KEY,
    nom             TEXT NOT NULL,
    email           TEXT UNIQUE,
    org_id          TEXT NOT NULL,
    role            actor_role NOT NULL,
    suspended       BOOLEAN NOT NULL DEFAULT FALSE,
    pin             TEXT,
    password_hash   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lot_media (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id              TEXT NOT NULL,
    cloudinary_public_id TEXT,
    secure_url          TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lot_media_lot_id ON lot_media(lot_id);
