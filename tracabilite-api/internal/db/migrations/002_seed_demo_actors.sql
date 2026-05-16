-- Comptes demo (PIN en clair ; pin_hash rempli au premier login ou par migration 010)
-- Email exportateur : export-demo@… pour éviter collision UNIQUE(email) avec un compte
-- signup utilisant export@chaincacao.tg.
INSERT INTO actors (id, nom, email, org_id, role, pin) VALUES
    ('actor-agri-001', 'Coop Agri Nord', 'agri@chaincacao.tg', 'AgriculteurMSP', 'agriculteur', '1111'),
    ('actor-coop-001', 'Cooperative Plateaux', 'coop@chaincacao.tg', 'CooperativeMSP', 'cooperative', '4444'),
    ('actor-trans-001', 'Usine Cacao Plus', 'transfo@chaincacao.tg', 'TransformateurMSP', 'transformateur', '2222'),
    ('actor-exp-001', 'Exportateur SA', 'export-demo@chaincacao.tg', 'ExportateurMSP', 'exportateur', '3333'),
    ('actor-min-001', 'Ministère Agriculture', 'ministere@chaincacao.tg', 'MinistereMSP', 'ministere', '8888'),
    ('actor-admin-001', 'Admin Platform', 'admin@chaincacao.tg', 'PlatformMSP', 'admin', '9999')
ON CONFLICT (id) DO UPDATE SET
    nom = EXCLUDED.nom,
    email = EXCLUDED.email,
    org_id = EXCLUDED.org_id,
    role = EXCLUDED.role;
