package actors

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
	"tracabilite-api/pkg/models"
)

// Store persiste et lit les acteurs (PostgreSQL ou memoire).
type Store interface {
	List(ctx context.Context) ([]models.Actor, error)
	FindByID(ctx context.Context, id string) (models.Actor, error)
	FindByEmail(ctx context.Context, email string) (models.Actor, error)
	Register(ctx context.Context, nom, email, password, orgID string, role models.Role) (models.Actor, error)
}

type memoryStore struct {
	actors []models.Actor
}

// NewMemoryStore retourne le store demo en RAM.
func NewMemoryStore() Store {
	return newMemoryStore()
}

func newMemoryStore() *memoryStore {
	return &memoryStore{
		actors: []models.Actor{
			{ID: "actor-agri-001", Nom: "Coop Agri Nord", Email: "agri@chaincacao.tg", OrgID: "AgriculteurMSP", Role: models.RoleAgriculteur, PIN: "1111"},
			{ID: "actor-coop-001", Nom: "Cooperative Plateaux", Email: "coop@chaincacao.tg", OrgID: "CooperativeMSP", Role: models.RoleCooperative, PIN: "4444"},
			{ID: "actor-trans-001", Nom: "Usine Cacao Plus", Email: "transfo@chaincacao.tg", OrgID: "TransformateurMSP", Role: models.RoleTransformateur, PIN: "2222"},
			{ID: "actor-dist-001", Nom: "Distrib Export SA", Email: "export@chaincacao.tg", OrgID: "DistributeurMSP", Role: models.RoleDistributeur, PIN: "3333"},
			{ID: "actor-admin-001", Nom: "Admin Platform", Email: "admin@chaincacao.tg", OrgID: "PlatformMSP", Role: models.RoleAdmin, PIN: "9999"},
		},
	}
}

func (m *memoryStore) List(_ context.Context) ([]models.Actor, error) {
	out := make([]models.Actor, len(m.actors))
	copy(out, m.actors)
	return out, nil
}

func (m *memoryStore) FindByID(_ context.Context, id string) (models.Actor, error) {
	for _, a := range m.actors {
		if a.ID == id {
			return a, nil
		}
	}
	return models.Actor{}, errors.New("acteur introuvable")
}

func (m *memoryStore) FindByEmail(_ context.Context, email string) (models.Actor, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	for _, a := range m.actors {
		if strings.ToLower(a.Email) == email {
			return a, nil
		}
	}
	return models.Actor{}, errors.New("acteur introuvable")
}

func (m *memoryStore) Register(_ context.Context, nom, email, password, orgID string, role models.Role) (models.Actor, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || strings.TrimSpace(password) == "" || strings.TrimSpace(nom) == "" {
		return models.Actor{}, errors.New("nom, email et mot de passe sont obligatoires")
	}
	for _, a := range m.actors {
		if strings.EqualFold(a.Email, email) {
			return models.Actor{}, errors.New("email deja utilise")
		}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return models.Actor{}, errors.New("echec hash mot de passe")
	}
	actor := models.Actor{
		ID:           "actor-" + uuid.NewString()[:8],
		Nom:          strings.TrimSpace(nom),
		Email:        email,
		OrgID:        strings.TrimSpace(orgID),
		Role:         role,
		PasswordHash: string(hash),
	}
	m.actors = append(m.actors, actor)
	return actor, nil
}

type pgStore struct {
	pool *pgxpool.Pool
}

// NewPGStore persiste les acteurs dans PostgreSQL.
func NewPGStore(pool *pgxpool.Pool) Store {
	return newPGStore(pool)
}

func newPGStore(pool *pgxpool.Pool) *pgStore {
	return &pgStore{pool: pool}
}

// SeedDemoPasswordsForPG remplit password_hash pour les comptes seed (meme valeur que PIN).
func SeedDemoPasswordsForPG(ctx context.Context, pool *pgxpool.Pool) error {
	pairs := []struct {
		id       string
		password string
	}{
		{"actor-agri-001", "1111"},
		{"actor-coop-001", "4444"},
		{"actor-trans-001", "2222"},
		{"actor-dist-001", "3333"},
		{"actor-admin-001", "9999"},
	}
	for _, p := range pairs {
		hash, err := bcrypt.GenerateFromPassword([]byte(p.password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		_, err = pool.Exec(ctx, `UPDATE actors SET password_hash=$2 WHERE id=$1 AND (password_hash IS NULL OR password_hash='')`, p.id, string(hash))
		if err != nil {
			return err
		}
	}
	return nil
}

func (p *pgStore) List(ctx context.Context) ([]models.Actor, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(pin,''), COALESCE(password_hash,'') FROM actors ORDER BY nom`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Actor
	for rows.Next() {
		var a models.Actor
		if err := rows.Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.PIN, &a.PasswordHash); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (p *pgStore) FindByID(ctx context.Context, id string) (models.Actor, error) {
	var a models.Actor
	err := p.pool.QueryRow(ctx,
		`SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(pin,''), COALESCE(password_hash,'') FROM actors WHERE id=$1`,
		id,
	).Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.PIN, &a.PasswordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Actor{}, errors.New("acteur introuvable")
	}
	if err != nil {
		return models.Actor{}, err
	}
	return a, nil
}

func (p *pgStore) FindByEmail(ctx context.Context, email string) (models.Actor, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var a models.Actor
	err := p.pool.QueryRow(ctx,
		`SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(pin,''), COALESCE(password_hash,'') FROM actors WHERE lower(email)=$1`,
		email,
	).Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.PIN, &a.PasswordHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Actor{}, errors.New("acteur introuvable")
	}
	if err != nil {
		return models.Actor{}, err
	}
	return a, nil
}

func (p *pgStore) Register(ctx context.Context, nom, email, password, orgID string, role models.Role) (models.Actor, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || strings.TrimSpace(password) == "" || strings.TrimSpace(nom) == "" {
		return models.Actor{}, errors.New("nom, email et mot de passe sont obligatoires")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return models.Actor{}, errors.New("echec hash mot de passe")
	}
	id := "actor-" + uuid.NewString()[:8]
	_, err = p.pool.Exec(ctx,
		`INSERT INTO actors (id, nom, email, org_id, role, password_hash) VALUES ($1,$2,$3,$4,$5::actor_role,$6)`,
		id, strings.TrimSpace(nom), email, strings.TrimSpace(orgID), string(role), string(hash),
	)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return models.Actor{}, errors.New("email deja utilise")
		}
		return models.Actor{}, err
	}
	return models.Actor{ID: id, Nom: strings.TrimSpace(nom), Email: email, OrgID: strings.TrimSpace(orgID), Role: role}, nil
}
