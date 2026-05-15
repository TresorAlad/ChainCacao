-- Réparation : DB prod créée sans toutes les colonnes de 001_init / migrations suivantes
ALTER TABLE actors ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS pin_hash TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS pin_failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS gps_location TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS field_surface TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS org_name TEXT;
