package actors

import (
	"errors"

	"tracabilite-api/pkg/models"
)

type Service struct {
	actors []models.Actor
}

func NewService() *Service {
	return &Service{
		actors: []models.Actor{
			{ID: "actor-agri-001", Nom: "Coop Agri Nord", OrgID: "AgriculteurMSP", Role: models.RoleAgriculteur, PIN: "1111"},
			{ID: "actor-trans-001", Nom: "Usine Cacao Plus", OrgID: "TransformateurMSP", Role: models.RoleTransformateur, PIN: "2222"},
			{ID: "actor-dist-001", Nom: "Distrib Export SA", OrgID: "DistributeurMSP", Role: models.RoleDistributeur, PIN: "3333"},
			{ID: "actor-admin-001", Nom: "Admin Platform", OrgID: "PlatformMSP", Role: models.RoleAdmin, PIN: "9999"},
		},
	}
}

func (s *Service) List() []models.Actor {
	return s.actors
}

func (s *Service) FindByID(id string) (models.Actor, error) {
	for _, actor := range s.actors {
		if actor.ID == id {
			return actor, nil
		}
	}
	return models.Actor{}, errors.New("acteur introuvable")
}

func (s *Service) Authenticate(actorID, pin string) (models.Actor, error) {
	actor, err := s.FindByID(actorID)
	if err != nil {
		return models.Actor{}, err
	}
	if actor.PIN != pin {
		return models.Actor{}, errors.New("identifiants invalides")
	}
	return actor, nil
}
