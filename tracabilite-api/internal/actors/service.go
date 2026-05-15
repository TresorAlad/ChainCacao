package actors

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"tracabilite-api/pkg/models"
)

type Service struct {
	store Store
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (s *Service) List(ctx context.Context) ([]models.Actor, error) {
	return s.store.List(ctx)
}

func (s *Service) FindByID(ctx context.Context, id string) (models.Actor, error) {
	return s.store.FindByID(ctx, id)
}

func (s *Service) FindByIDs(ctx context.Context, ids []string) (map[string]models.Actor, error) {
	return s.store.FindByIDs(ctx, ids)
}

func (s *Service) Authenticate(ctx context.Context, actorID, pin string) (models.Actor, error) {
	return s.store.VerifyPIN(ctx, actorID, pin)
}

func (s *Service) AuthenticateByEmail(ctx context.Context, email, password string) (models.Actor, error) {
	actor, err := s.store.FindByEmail(ctx, email)
	if err != nil {
		return models.Actor{}, err
	}
	if actor.Suspended {
		return models.Actor{}, errors.New("compte suspendu")
	}
	if actor.PasswordHash == "" {
		return models.Actor{}, errors.New("authentification email non activee pour cet acteur")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(actor.PasswordHash), []byte(password)); err != nil {
		return models.Actor{}, errors.New("identifiants invalides")
	}
	return actor, nil
}

func (s *Service) Register(ctx context.Context, nom, email, password, orgID string, role models.Role) (models.Actor, error) {
	return s.store.Register(ctx, nom, email, password, orgID, role)
}

func (s *Service) Update(ctx context.Context, id string, in UpdateInput) (models.Actor, error) {
	return s.store.Update(ctx, id, in)
}

func (s *Service) SetPIN(ctx context.Context, id string, pin string) (models.Actor, error) {
	return s.store.SetPIN(ctx, id, pin)
}

// InitMemoryWebPasswords active le login email sur le store memoire (meme secret que PIN demo).
func InitMemoryWebPasswords(store Store) error {
	m, ok := store.(*memoryStore)
	if !ok {
		return nil
	}
	demoPass := map[string]string{
		"actor-agri-001":  "1111",
		"actor-coop-001":  "4444",
		"actor-trans-001": "2222",
		"actor-exp-001":   "3333",
		"actor-min-001":   "8888",
		"actor-admin-001": "9999",
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := range m.actors {
		pass := demoPass[m.actors[i].ID]
		if pass == "" {
			pass = "changeme"
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		m.actors[i].PasswordHash = string(hash)
	}
	return nil
}

// NormalizeEmail helper
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
