-- Ajout des roles manquants dans l'enum actor_role (idempotent)
-- IF NOT EXISTS disponible depuis PostgreSQL 9.3 (Neon = PG 16+)

ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'verificateur';
ALTER TYPE actor_role ADD VALUE IF NOT EXISTS 'exportateur';
