package batch

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"tracabilite-api/internal/actors"
	"tracabilite-api/internal/fabric"
	"tracabilite-api/pkg/models"
)

type CreateBatchInput struct {
	Culture       string  `json:"culture"`
	Quantite      float64 `json:"quantite"`
	Lieu          string  `json:"lieu"`
	DateRecolte   string  `json:"date_recolte"`
	CertificatURL string  `json:"certificat_url"`
	Notes         string  `json:"notes"`
}

type TransferBatchInput struct {
	BatchID     string `json:"batch_id"`
	ToActorID   string `json:"to_actor_id"`
	Commentaire string `json:"commentaire"`
}

type Service struct {
	fabricClient fabric.Client
	actorService *actors.Service
}

func NewService(fabricClient fabric.Client, actorService *actors.Service) *Service {
	return &Service{
		fabricClient: fabricClient,
		actorService: actorService,
	}
}

func (s *Service) Create(input CreateBatchInput, actorID, orgID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.Culture) == "" || strings.TrimSpace(input.Lieu) == "" || strings.TrimSpace(input.DateRecolte) == "" {
		return "", models.Batch{}, errors.New("culture, lieu et date_recolte sont obligatoires")
	}
	if input.Quantite <= 0 {
		return "", models.Batch{}, errors.New("quantite doit etre superieure a 0")
	}

	batch := models.Batch{
		ID:            uuid.NewString(),
		Culture:       strings.TrimSpace(input.Culture),
		Quantite:      input.Quantite,
		Lieu:          strings.TrimSpace(input.Lieu),
		DateRecolte:   strings.TrimSpace(input.DateRecolte),
		Proprietaire:  actorID,
		OrgID:         orgID,
		CertificatURL: strings.TrimSpace(input.CertificatURL),
		Notes:         strings.TrimSpace(input.Notes),
	}
	txHash, created, err := s.fabricClient.CreateBatch(batch, actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	return txHash, created, nil
}

func (s *Service) Transfer(input TransferBatchInput, fromActorID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.BatchID) == "" || strings.TrimSpace(input.ToActorID) == "" {
		return "", models.Batch{}, errors.New("batch_id et to_actor_id sont obligatoires")
	}
	if input.ToActorID == fromActorID {
		return "", models.Batch{}, errors.New("transfert vers soi-meme interdit")
	}
	if _, err := s.actorService.FindByID(input.ToActorID); err != nil {
		return "", models.Batch{}, errors.New("destinataire invalide")
	}
	return s.fabricClient.TransferBatch(strings.TrimSpace(input.BatchID), fromActorID, input.ToActorID, strings.TrimSpace(input.Commentaire))
}

func (s *Service) GetBatch(id string) (models.Batch, error) {
	return s.fabricClient.GetBatch(id)
}

func (s *Service) GetHistory(id string) ([]models.BatchHistoryEvent, error) {
	return s.fabricClient.GetHistory(id)
}
