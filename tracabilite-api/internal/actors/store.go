package actors

import (
	"context"
	"errors"
	"strings"
	"time"

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
	Update(ctx context.Context, id string, in UpdateInput) (models.Actor, error)
	SetPIN(ctx context.Context, id string, pin string) (models.Actor, error)
	VerifyPIN(ctx context.Context, actorID, pin string) (models.Actor, error)
}

type UpdateInput struct {
	Nom          *string      `json:"nom,omitempty"`
	Email        *string      `json:"email,omitempty"`
	OrgID        *string      `json:"org_id,omitempty"`
	Role         *models.Role `json:"role,omitempty"`
	Suspended    *bool        `json:"suspended,omitempty"`
	GPSLocation  *string      `json:"gps_location,omitempty"`
	FieldSurface *string      `json:"field_surface,omitempty"`
	OrgName      *string      `json:"org_name,omitempty"`
}

type memoryStore struct {
	actors []models.Actor
}

// NewMemoryStore retourne le store demo en RAM.
func NewMemoryStore() Store {
	return newMemoryStore()
}

func newMemoryStore() *memoryStore {
	demos := []struct {
		id    string
		nom   string
		email string
		org   string
		role  models.Role
		pin   string
	}{
		{"actor-agri-001", "Coop Agri Nord", "agri@chaincacao.tg", "AgriculteurMSP", models.RoleAgriculteur, "1111"},
		{"actor-coop-001", "Cooperative Plateaux", "coop@chaincacao.tg", "CooperativeMSP", models.RoleCooperative, "4444"},
		{"actor-trans-001", "Usine Cacao Plus", "transfo@chaincacao.tg", "TransformateurMSP", models.RoleTransformateur, "2222"},
		{"actor-exp-001", "Exportateur SA", "export@chaincacao.tg", "ExportateurMSP", models.RoleExportateur, "3333"},
		{"actor-min-001", "Ministère Agriculture", "ministere@chaincacao.tg", "MinistereMSP", models.RoleMinistere, "8888"},
		{"actor-admin-001", "Admin Platform", "admin@chaincacao.tg", "PlatformMSP", models.RoleAdmin, "9999"},
	}
	var actors []models.Actor
	for _, d := range demos {
		hash, err := bcrypt.GenerateFromPassword([]byte(d.pin), bcrypt.DefaultCost)
		if err != nil {
			panic("actors demo pin hash: " + err.Error())
		}
		actors = append(actors, models.Actor{
			ID:      d.id,
			Nom:     d.nom,
			Email:   d.email,
			OrgID:   d.org,
			Role:    d.role,
			PIN:     "",
			PINHash: string(hash),
		})
	}
	return &memoryStore{actors: actors}
}

func (m *memoryStore) List(_ context.Context) ([]models.Actor, error) {
	out := make([]models.Actor, len(m.actors))
	copy(out, m.actors)
	for i := range out {
		out[i].PIN = ""
		out[i].PINHash = ""
		out[i].PasswordHash = ""
	}
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

func (m *memoryStore) Update(_ context.Context, id string, in UpdateInput) (models.Actor, error) {
	for i := range m.actors {
		if m.actors[i].ID != id {
			continue
		}
		if in.Nom != nil {
			m.actors[i].Nom = strings.TrimSpace(*in.Nom)
		}
		if in.Email != nil {
			m.actors[i].Email = strings.ToLower(strings.TrimSpace(*in.Email))
		}
		if in.OrgID != nil {
			m.actors[i].OrgID = strings.TrimSpace(*in.OrgID)
		}
		if in.Role != nil {
			m.actors[i].Role = *in.Role
		}
		if in.Suspended != nil {
			m.actors[i].Suspended = *in.Suspended
		}
		if in.GPSLocation != nil {
			m.actors[i].GPSLocation = strings.TrimSpace(*in.GPSLocation)
		}
		if in.FieldSurface != nil {
			m.actors[i].FieldSurface = strings.TrimSpace(*in.FieldSurface)
		}
		if in.OrgName != nil {
			m.actors[i].OrgName = strings.TrimSpace(*in.OrgName)
		}
		return m.actors[i], nil
	}
	return models.Actor{}, errors.New("acteur introuvable")
}

func (m *memoryStore) SetPIN(_ context.Context, id string, pin string) (models.Actor, error) {
	pin = strings.TrimSpace(pin)
	if pin == "" {
		return models.Actor{}, errors.New("pin obligatoire")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return models.Actor{}, errors.New("echec hash pin")
	}
	for i := range m.actors {
		if m.actors[i].ID == id {
			m.actors[i].PIN = ""
			m.actors[i].PINHash = string(hash)
			return m.actors[i], nil
		}
	}
	return models.Actor{}, errors.New("acteur introuvable")
}

func (m *memoryStore) VerifyPIN(_ context.Context, actorID, pin string) (models.Actor, error) {
	pin = strings.TrimSpace(pin)
	if pin == "" {
		return models.Actor{}, errors.New("pin obligatoire")
	}
	a, err := m.FindByID(context.Background(), actorID)
	if err != nil {
		return models.Actor{}, err
	}
	if a.PINHash == "" {
		return models.Actor{}, errors.New("pin non configure")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(a.PINHash), []byte(pin)); err != nil {
		return models.Actor{}, errors.New("identifiants invalides")
	}
	return a, nil
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
		{"actor-exp-001", "3333"},
		{"actor-min-001", "8888"},
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
		// PIN hash: remplir pin_hash si absent, et effacer le pin en clair si present.
		_, err = pool.Exec(ctx, `UPDATE actors SET pin_hash=$2, pin=NULL WHERE id=$1 AND (pin_hash IS NULL OR pin_hash='')`, p.id, string(hash))
		if err != nil {
			return err
		}
	}
	return nil
}

func (p *pgStore) List(ctx context.Context) ([]models.Actor, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(suspended,false),
		COALESCE(pin_hash,''), COALESCE(password_hash,''),
		COALESCE(gps_location,''), COALESCE(field_surface,''), COALESCE(org_name,'')
		FROM actors ORDER BY nom`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []models.Actor
	for rows.Next() {
		var a models.Actor
		if err := rows.Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.Suspended, &a.PINHash, &a.PasswordHash, &a.GPSLocation, &a.FieldSurface, &a.OrgName); err != nil {
			return nil, err
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

func (p *pgStore) FindByID(ctx context.Context, id string) (models.Actor, error) {
	var a models.Actor
	err := p.pool.QueryRow(ctx,
		`SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(suspended,false),
			COALESCE(pin_hash,''), COALESCE(password_hash,''),
			COALESCE(gps_location,''), COALESCE(field_surface,''), COALESCE(org_name,'')
			FROM actors WHERE id=$1`,
		id,
	).Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.Suspended, &a.PINHash, &a.PasswordHash, &a.GPSLocation, &a.FieldSurface, &a.OrgName)
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
		`SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(suspended,false),
			COALESCE(pin_hash,''), COALESCE(password_hash,''),
			COALESCE(gps_location,''), COALESCE(field_surface,''), COALESCE(org_name,'')
			FROM actors WHERE lower(email)=$1`,
		email,
	).Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.Suspended, &a.PINHash, &a.PasswordHash, &a.GPSLocation, &a.FieldSurface, &a.OrgName)
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

func (p *pgStore) Update(ctx context.Context, id string, in UpdateInput) (models.Actor, error) {
	cur, err := p.FindByID(ctx, id)
	if err != nil {
		return models.Actor{}, err
	}
	if in.Nom != nil {
		cur.Nom = strings.TrimSpace(*in.Nom)
	}
	if in.Email != nil {
		cur.Email = strings.ToLower(strings.TrimSpace(*in.Email))
	}
	if in.OrgID != nil {
		cur.OrgID = strings.TrimSpace(*in.OrgID)
	}
	if in.Role != nil {
		cur.Role = *in.Role
	}
	if in.Suspended != nil {
		cur.Suspended = *in.Suspended
	}
	if in.GPSLocation != nil {
		cur.GPSLocation = strings.TrimSpace(*in.GPSLocation)
	}
	if in.FieldSurface != nil {
		cur.FieldSurface = strings.TrimSpace(*in.FieldSurface)
	}
	if in.OrgName != nil {
		cur.OrgName = strings.TrimSpace(*in.OrgName)
	}

	_, err = p.pool.Exec(ctx, `UPDATE actors SET nom=$2, email=$3, org_id=$4, role=$5::actor_role, suspended=$6, gps_location=$7, field_surface=$8, org_name=$9 WHERE id=$1`,
		id, cur.Nom, nullIfEmpty(cur.Email), cur.OrgID, string(cur.Role), cur.Suspended,
		nullIfEmpty(cur.GPSLocation), nullIfEmpty(cur.FieldSurface), nullIfEmpty(cur.OrgName),
	)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return models.Actor{}, errors.New("email deja utilise")
		}
		return models.Actor{}, err
	}
	return p.FindByID(ctx, id)
}

func (p *pgStore) SetPIN(ctx context.Context, id string, pin string) (models.Actor, error) {
	pin = strings.TrimSpace(pin)
	if pin == "" {
		return models.Actor{}, errors.New("pin obligatoire")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pin), bcrypt.DefaultCost)
	if err != nil {
		return models.Actor{}, errors.New("echec hash mot de passe")
	}
	_, err = p.pool.Exec(ctx, `UPDATE actors SET pin_hash=$2, pin=NULL WHERE id=$1`, id, string(hash))
	if err != nil {
		return models.Actor{}, err
	}
	return p.FindByID(ctx, id)
}

func (p *pgStore) VerifyPIN(ctx context.Context, actorID, pin string) (models.Actor, error) {
	pin = strings.TrimSpace(pin)
	if pin == "" {
		return models.Actor{}, errors.New("pin obligatoire")
	}

	var (
		a             models.Actor
		failed        int
		lockedUntil   *time.Time
		legacyPin     string
	)
	err := p.pool.QueryRow(ctx, `
		SELECT id, nom, COALESCE(email,''), org_id, role::text, COALESCE(suspended,false),
		       COALESCE(pin_hash,''), COALESCE(pin,''), COALESCE(password_hash,''),
		       pin_failed_attempts, pin_locked_until
		FROM actors WHERE id=$1
	`, actorID).Scan(&a.ID, &a.Nom, &a.Email, &a.OrgID, &a.Role, &a.Suspended, &a.PINHash, &legacyPin, &a.PasswordHash, &failed, &lockedUntil)
	if errors.Is(err, pgx.ErrNoRows) {
		return models.Actor{}, errors.New("acteur introuvable")
	}
	if err != nil {
		return models.Actor{}, err
	}

	if a.Suspended {
		return models.Actor{}, errors.New("compte suspendu")
	}
	now := time.Now().UTC()
	if lockedUntil != nil && lockedUntil.After(now) {
		return models.Actor{}, errors.New("compte bloque temporairement")
	}

	// Migration progressive: si pin_hash absent mais pin legacy present, le hasher.
	if a.PINHash == "" && strings.TrimSpace(legacyPin) != "" {
		hash, _ := bcrypt.GenerateFromPassword([]byte(strings.TrimSpace(legacyPin)), bcrypt.DefaultCost)
		_, _ = p.pool.Exec(ctx, `UPDATE actors SET pin_hash=$2, pin=NULL WHERE id=$1`, actorID, string(hash))
		a.PINHash = string(hash)
	}
	if a.PINHash == "" {
		return models.Actor{}, errors.New("pin non configure")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(a.PINHash), []byte(pin)); err != nil {
		// increment attempts + lockout after 3 failures for 30 min
		failed++
		var newLocked *time.Time
		if failed >= 3 {
			t := now.Add(30 * time.Minute)
			newLocked = &t
		}
		_, _ = p.pool.Exec(ctx, `UPDATE actors SET pin_failed_attempts=$2, pin_locked_until=$3 WHERE id=$1`, actorID, failed, newLocked)
		return models.Actor{}, errors.New("identifiants invalides")
	}
	// success: reset attempts
	_, _ = p.pool.Exec(ctx, `UPDATE actors SET pin_failed_attempts=0, pin_locked_until=NULL WHERE id=$1`, actorID)
	return a, nil
}

func nullIfEmpty(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}
