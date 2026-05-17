-- Droits applicatifs sur grouped_lists (rôle chaincacao Docker / déploiements courants).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'chaincacao') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE grouped_lists TO chaincacao;
  END IF;
END $$;
