-- Réparation idempotente des 6 acteurs démo (PostgreSQL).
-- Usage depuis la racine tracabilite-api ou dépôt :
--   docker compose exec postgres psql -U chaincacao -d chaincacao -f - < scripts/fix-seed-demo.sql
-- ou :
--   docker compose exec -T postgres psql -U chaincacao -d chaincacao < scripts/fix-seed-demo.sql
--
-- Ne modifie pas pin_hash existant : en cas de conflit (id), met à jour nom/email/org_id/role seulement.
-- Les nouvelles lignes reçoivent le PIN clair (1111, 4444, …) pour premier login comme le seed 002.

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

-- Si la ligne existait sans pin ni pin_hash, permettre le PIN démo (sinon ne pas écraser un hash)
UPDATE actors a
SET pin = v.pin
FROM (VALUES
    ('actor-agri-001', '1111'),
    ('actor-coop-001', '4444'),
    ('actor-trans-001', '2222'),
    ('actor-exp-001', '3333'),
    ('actor-min-001', '8888'),
    ('actor-admin-001', '9999')
) AS v(id, pin)
WHERE a.id = v.id
  AND (a.pin_hash IS NULL OR a.pin_hash = '')
  AND (a.pin IS NULL OR trim(a.pin) = '');

SELECT id, nom, email, role FROM actors
WHERE id LIKE 'actor-%-001'
ORDER BY id;
