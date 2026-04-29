-- ChainCacao API — schema PostgreSQL (Neon / Docker compatible)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
    CREATE TYPE actor_role AS ENUM (
        'admin',
        'agriculteur',
        'cooperative',
        'transformateur',
        'distributeur'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS actors (
    id              TEXT PRIMARY KEY,
    nom             TEXT NOT NULL,
    email           TEXT UNIQUE,
    org_id          TEXT NOT NULL,
    role            actor_role NOT NULL,
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

-- Comptes demo (PIN; password_hash rempli au demarrage API)
INSERT INTO actors (id, nom, email, org_id, role, pin) VALUES
    ('actor-agri-001', 'Coop Agri Nord', 'agri@chaincacao.tg', 'AgriculteurMSP', 'agriculteur', '1111'),
    ('actor-coop-001', 'Cooperative Plateaux', 'coop@chaincacao.tg', 'CooperativeMSP', 'cooperative', '4444'),
    ('actor-trans-001', 'Usine Cacao Plus', 'transfo@chaincacao.tg', 'TransformateurMSP', 'transformateur', '2222'),
    ('actor-dist-001', 'Distrib Export SA', 'export@chaincacao.tg', 'DistributeurMSP', 'distributeur', '3333'),
    ('actor-admin-001', 'Admin Platform', 'admin@chaincacao.tg', 'PlatformMSP', 'admin', '9999')
ON CONFLICT (id) DO NOTHING;
