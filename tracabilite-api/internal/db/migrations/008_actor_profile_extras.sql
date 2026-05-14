-- Profil acteur (signup mobile : GPS, surface, nom d'organisation)
ALTER TABLE actors ADD COLUMN IF NOT EXISTS gps_location TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS field_surface TEXT;
ALTER TABLE actors ADD COLUMN IF NOT EXISTS org_name TEXT;
