package batch

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"tracabilite-api/internal/fabric"
	"tracabilite-api/pkg/models"
)

// ActorLookup verifie qu'un destinataire existe.
type ActorLookup interface {
	FindByID(ctx context.Context, id string) (models.Actor, error)
}

type CreateBatchInput struct {
	Culture       string  `json:"culture"`
	Variete       string  `json:"variete"`
	Quantite      float64 `json:"quantite"`
	Lieu          string  `json:"lieu"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Region        string  `json:"region"`
	Village       string  `json:"village"`
	Parcelle      string  `json:"parcelle"`
	DateRecolte   string  `json:"date_recolte"`
	CertificatURL string  `json:"certificat_url"`
	PhotoURL      string  `json:"photo_url"`
	Notes         string  `json:"notes"`
}

type TransferBatchInput struct {
	BatchID     string `json:"batch_id"`
	ToActorID   string `json:"to_actor_id"`
	Commentaire string `json:"commentaire"`
}

type UpdateWeightInput struct {
	BatchID        string  `json:"batch_id"`
	NewWeight      float64 `json:"new_weight"`
	Justification  string  `json:"justification"`
}

type Service struct {
	fabricClient fabric.Client
	actors       ActorLookup
}

func NewService(fabricClient fabric.Client, actors ActorLookup) *Service {
	return &Service{
		fabricClient: fabricClient,
		actors:       actors,
	}
}

func (s *Service) Create(ctx context.Context, input CreateBatchInput, actorID, orgID string) (string, models.Batch, error) {
	_ = ctx
	if strings.TrimSpace(input.Culture) == "" || strings.TrimSpace(input.Lieu) == "" || strings.TrimSpace(input.DateRecolte) == "" {
		return "", models.Batch{}, errors.New("culture, lieu et date_recolte sont obligatoires")
	}
	if input.Quantite <= 0 {
		return "", models.Batch{}, errors.New("quantite doit etre superieure a 0")
	}

	batch := models.Batch{
		ID:            buildBatchID(),
		Culture:       strings.TrimSpace(input.Culture),
		Variete:       strings.TrimSpace(input.Variete),
		Quantite:      input.Quantite,
		Lieu:          strings.TrimSpace(input.Lieu),
		Latitude:      input.Latitude,
		Longitude:     input.Longitude,
		Region:        strings.TrimSpace(input.Region),
		Village:       strings.TrimSpace(input.Village),
		Parcelle:      strings.TrimSpace(input.Parcelle),
		DateRecolte:   strings.TrimSpace(input.DateRecolte),
		Proprietaire:  actorID,
		OrgID:         orgID,
		CertificatURL: strings.TrimSpace(input.CertificatURL),
		PhotoURL:      strings.TrimSpace(input.PhotoURL),
		Notes:         strings.TrimSpace(input.Notes),
	}
	txHash, created, err := s.fabricClient.CreateBatch(batch, actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	return txHash, created, nil
}

func (s *Service) Transfer(ctx context.Context, input TransferBatchInput, fromActorID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.BatchID) == "" || strings.TrimSpace(input.ToActorID) == "" {
		return "", models.Batch{}, errors.New("batch_id et to_actor_id sont obligatoires")
	}
	if input.ToActorID == fromActorID {
		return "", models.Batch{}, errors.New("transfert vers soi-meme interdit")
	}
	if _, err := s.actors.FindByID(ctx, input.ToActorID); err != nil {
		return "", models.Batch{}, errors.New("destinataire invalide")
	}
	return s.fabricClient.TransferBatch(strings.TrimSpace(input.BatchID), fromActorID, input.ToActorID, strings.TrimSpace(input.Commentaire))
}

func (s *Service) GetBatch(ctx context.Context, id string) (models.Batch, error) {
	_ = ctx
	return s.fabricClient.GetBatch(id)
}

func (s *Service) GetHistory(ctx context.Context, id string) ([]models.BatchHistoryEvent, error) {
	_ = ctx
	return s.fabricClient.GetHistory(id)
}

func (s *Service) UpdateWeight(ctx context.Context, input UpdateWeightInput, actorID string) (string, models.Batch, error) {
	_ = ctx
	if strings.TrimSpace(input.BatchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	if strings.TrimSpace(input.Justification) == "" {
		return "", models.Batch{}, errors.New("justification obligatoire")
	}
	return s.fabricClient.UpdateBatchWeight(strings.TrimSpace(input.BatchID), actorID, input.NewWeight, strings.TrimSpace(input.Justification))
}

func (s *Service) MarkExported(ctx context.Context, batchID, actorID string) (string, models.Batch, error) {
	_ = ctx
	if strings.TrimSpace(batchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	return s.fabricClient.MarkBatchExported(strings.TrimSpace(batchID), actorID)
}

func (s *Service) BuildEUDRReport(ctx context.Context, batchID string) (map[string]any, error) {
	lot, err := s.GetBatch(ctx, batchID)
	if err != nil {
		return nil, err
	}
	history, err := s.GetHistory(ctx, batchID)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"lot_id":         lot.ID,
		"origin":         map[string]any{"region": lot.Region, "village": lot.Village, "latitude": lot.Latitude, "longitude": lot.Longitude},
		"date_recolte":   lot.DateRecolte,
		"proprietaire":   lot.Proprietaire,
		"blockchain_txs": len(history),
		"history":        history,
		"generated_at":   time.Now().UTC().Format(time.RFC3339),
		"format":         "json-report-simulating-pdf-payload",
	}, nil
}

func (s *Service) GetStats(ctx context.Context) map[string]any {
	_ = ctx
	return s.fabricClient.GetStats()
}

func buildBatchID() string {
	datePart := time.Now().UTC().Format("20060102")
	return fmt.Sprintf("TC-%s-%05d", datePart, time.Now().UTC().Nanosecond()%100000)
}
