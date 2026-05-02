package batch

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync/atomic"
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
		OrgID:         orgID, // proprietaire courant (org) cote API
		CertificatURL: strings.TrimSpace(input.CertificatURL),
		PhotoURL:      strings.TrimSpace(input.PhotoURL),
		Notes:         strings.TrimSpace(input.Notes),
	}
	txHash, created, err := s.fabricClient.CreateBatch(ctx, batch, actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	created = s.enrichOwnerOrg(ctx, created)
	return txHash, created, nil
}

func (s *Service) Transfer(ctx context.Context, input TransferBatchInput, fromActorID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.BatchID) == "" || strings.TrimSpace(input.ToActorID) == "" {
		return "", models.Batch{}, errors.New("batch_id et to_actor_id sont obligatoires")
	}
	if input.ToActorID == fromActorID {
		return "", models.Batch{}, errors.New("transfert vers soi-meme interdit")
	}

	// Respecte la regle metier Fabric: seul le proprietaire courant peut transferer.
	current, err := s.fabricClient.GetBatch(ctx, strings.TrimSpace(input.BatchID))
	if err != nil {
		return "", models.Batch{}, err
	}
	if current.Proprietaire != fromActorID {
		return "", models.Batch{}, errors.New("seul le proprietaire courant peut transferer")
	}

	toActor, err := s.actors.FindByID(ctx, input.ToActorID)
	if err != nil {
		return "", models.Batch{}, errors.New("destinataire invalide")
	}
	txHash, updated, err := s.fabricClient.TransferBatch(ctx, strings.TrimSpace(input.BatchID), fromActorID, input.ToActorID, strings.TrimSpace(input.Commentaire))
	if err != nil {
		return "", models.Batch{}, err
	}
	// Harmonisation API: org proprietaire derive de l'acteur proprietaire (destinataire).
	updated.OrgID = toActor.OrgID
	return txHash, updated, nil
}

func (s *Service) GetBatch(ctx context.Context, id string) (models.Batch, error) {
	b, err := s.fabricClient.GetBatch(ctx, id)
	if err != nil {
		return models.Batch{}, err
	}
	return s.enrichOwnerOrg(ctx, b), nil
}

func (s *Service) GetHistory(ctx context.Context, id string) ([]models.BatchHistoryEvent, error) {
	return s.fabricClient.GetHistory(ctx, id)
}

func (s *Service) UpdateWeight(ctx context.Context, input UpdateWeightInput, actorID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.BatchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	if strings.TrimSpace(input.Justification) == "" {
		return "", models.Batch{}, errors.New("justification obligatoire")
	}
	txHash, updated, err := s.fabricClient.UpdateBatchWeight(ctx, strings.TrimSpace(input.BatchID), actorID, input.NewWeight, strings.TrimSpace(input.Justification))
	if err != nil {
		return "", models.Batch{}, err
	}
	updated = s.enrichOwnerOrg(ctx, updated)
	return txHash, updated, nil
}

func (s *Service) MarkExported(ctx context.Context, batchID, actorID string) (string, models.Batch, error) {
	if strings.TrimSpace(batchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	current, err := s.fabricClient.GetBatch(ctx, strings.TrimSpace(batchID))
	if err != nil {
		return "", models.Batch{}, err
	}
	if current.Proprietaire != actorID {
		return "", models.Batch{}, errors.New("seul le proprietaire courant peut marquer comme exporte")
	}
	txHash, updated, err := s.fabricClient.MarkBatchExported(ctx, strings.TrimSpace(batchID), actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	updated = s.enrichOwnerOrg(ctx, updated)
	return txHash, updated, nil
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

	// Enrichissement "humain": noms + orgs depuis la base off-chain.
	type actorView struct {
		ID    string `json:"id"`
		Nom   string `json:"nom,omitempty"`
		OrgID string `json:"org_id,omitempty"`
		Role  string `json:"role,omitempty"`
	}
	resolveActor := func(id string) actorView {
		if strings.TrimSpace(id) == "" {
			return actorView{}
		}
		a, err := s.actors.FindByID(ctx, id)
		if err != nil {
			return actorView{ID: id}
		}
		return actorView{ID: a.ID, Nom: a.Nom, OrgID: a.OrgID, Role: string(a.Role)}
	}

	var (
		lastTxHash    string
		originActorID string
	)
	if len(history) > 0 {
		lastTxHash = history[len(history)-1].TxHash
		for _, e := range history {
			if e.Type == "creation" && e.ActorID != "" {
				originActorID = e.ActorID
				break
			}
		}
	}

	// Conformite EUDR (heuristique minimale, faute de couche carto/anti-deforestation ici).
	// Rationale: il faut au moins une geolocalisation + une chronologie non vide.
	eudrOk := lot.Latitude != 0 && lot.Longitude != 0 && strings.TrimSpace(lot.Region) != "" && strings.TrimSpace(lot.Village) != "" && len(history) > 0
	var eudrReasons []string
	if lot.Latitude == 0 || lot.Longitude == 0 {
		eudrReasons = append(eudrReasons, "coordonnees GPS manquantes")
	}
	if strings.TrimSpace(lot.Region) == "" || strings.TrimSpace(lot.Village) == "" {
		eudrReasons = append(eudrReasons, "region/village manquants")
	}
	if len(history) == 0 {
		eudrReasons = append(eudrReasons, "historique blockchain absent")
	}

	// Chronologie "lisible" pour rapport.
	transfers := make([]map[string]any, 0, len(history))
	for _, e := range history {
		transfers = append(transfers, map[string]any{
			"type":        e.Type,
			"tx_hash":     e.TxHash,
			"created_at":  e.CreatedAtISO,
			"actor":       resolveActor(e.ActorID),
			"from_actor":  resolveActor(e.FromActorID),
			"to_actor":    resolveActor(e.ToActorID),
			"commentaire": e.Commentaire,
			"payload":     e.Payload,
		})
	}

	return map[string]any{
		"lot_id": lot.ID,
		"origin": map[string]any{
			"actor":     resolveActor(originActorID),
			"region":    lot.Region,
			"village":   lot.Village,
			"parcelle":  lot.Parcelle,
			"latitude":  lot.Latitude,
			"longitude": lot.Longitude,
			"photo_url": lot.PhotoURL,
		},
		"date_recolte": lot.DateRecolte,
		"product": map[string]any{
			"culture":  lot.Culture,
			"variete":  lot.Variete,
			"quantite": lot.Quantite,
		},
		"current_owner": map[string]any{
			"actor": resolveActor(lot.Proprietaire),
			"org_id": lot.OrgID,
		},
		"eudr": map[string]any{
			"conforme": eudrOk,
			"reasons":  eudrReasons,
		},
		"blockchain": map[string]any{
			"tx_count":     len(history),
			"last_tx_hash": lastTxHash,
		},
		"timeline":     transfers,
		"generated_at": time.Now().UTC().Format(time.RFC3339),
	}, nil
}

func (s *Service) GetMyLots(ctx context.Context, actorID string) ([]models.Batch, error) {
	batches, err := s.fabricClient.GetBatchesByOwner(ctx, actorID)
	if err != nil {
		return nil, err
	}
	// Enrichir l'orgID depuis la table acteurs pour chaque lot.
	enriched := make([]models.Batch, 0, len(batches))
	for _, b := range batches {
		enriched = append(enriched, s.enrichOwnerOrg(ctx, b))
	}
	return enriched, nil
}

func (s *Service) GetStats(ctx context.Context) map[string]any {
	return s.fabricClient.GetStats(ctx)
}

func (s *Service) GetRecentTransfers(ctx context.Context) ([]map[string]any, error) {
	return s.fabricClient.GetRecentTransfers(ctx)
}

func (s *Service) GetActivityChart(ctx context.Context) ([]map[string]any, error) {
	return s.fabricClient.GetActivityChart(ctx)
}

func (s *Service) GetEUDRCompliance(ctx context.Context) (map[string]any, error) {
	return s.fabricClient.GetEUDRCompliance(ctx)
}

func (s *Service) GetAlertsCount(ctx context.Context) (map[string]any, error) {
	return s.fabricClient.GetAlertsCount(ctx)
}

func (s *Service) enrichOwnerOrg(ctx context.Context, b models.Batch) models.Batch {
	owner, err := s.actors.FindByID(ctx, b.Proprietaire)
	if err != nil {
		return b
	}
	b.OrgID = owner.OrgID
	return b
}

var (
	lastBatchDate atomic.Value // string YYYYMMDD
	batchSeq      atomic.Uint32
)

func buildBatchID() string {
	datePart := time.Now().UTC().Format("20060102")
	if v := lastBatchDate.Load(); v == nil || v.(string) != datePart {
		lastBatchDate.Store(datePart)
		// Seed non deterministe raisonnable, sans dependance externe.
		batchSeq.Store(uint32(time.Now().UTC().UnixNano() % 100000))
	}
	n := batchSeq.Add(1) % 100000
	return fmt.Sprintf("TC-%s-%05d", datePart, n)
}
