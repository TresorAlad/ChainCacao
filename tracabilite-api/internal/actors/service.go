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

func (s *Service) Authenticate(ctx context.Context, actorID, pin string) (models.Actor, error) {
	actor, err := s.store.FindByID(ctx, actorID)
	if err != nil {
		return models.Actor{}, err
	}
	if actor.PIN != pin {
		return models.Actor{}, errors.New("identifiants invalides")
	}
	return actor, nil
}

func (s *Service) AuthenticateByEmail(ctx context.Context, email, password string) (models.Actor, error) {
	actor, err := s.store.FindByEmail(ctx, email)
	if err != nil {
		return models.Actor{}, err
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

// InitMemoryWebPasswords active le login email sur le store memoire (meme secret que PIN).
func InitMemoryWebPasswords(store Store) error {
	m, ok := store.(*memoryStore)
	if !ok {
		return nil
	}
	for i := range m.actors {
		hash, err := bcrypt.GenerateFromPassword([]byte(m.actors[i].PIN), bcrypt.DefaultCost)
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
