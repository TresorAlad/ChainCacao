DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'chaincacao') THEN
    GRANT SELECT, INSERT ON TABLE wallet_transactions TO chaincacao;
    GRANT USAGE, SELECT ON SEQUENCE wallet_transactions_id_seq TO chaincacao;
  END IF;
END $$;
