package fabric

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"tracabilite-api/pkg/models"
)

type Client interface {
	CreateBatch(ctx context.Context, batch models.Batch, actorID string) (txHash string, created models.Batch, err error)
	TransferBatch(ctx context.Context, batchID, fromActorID, toActorID, commentaire string) (txHash string, updated models.Batch, err error)
	UpdateBatchWeight(ctx context.Context, batchID, actorID string, newWeight float64, justification string) (txHash string, updated models.Batch, err error)
	MarkBatchExported(ctx context.Context, batchID, actorID string) (txHash string, updated models.Batch, err error)
	GetBatch(ctx context.Context, batchID string) (models.Batch, error)
	GetHistory(ctx context.Context, batchID string) ([]models.BatchHistoryEvent, error)
	GetStats(ctx context.Context) map[string]any
}

// InMemoryClient simule Fabric pour le dev local et tests d'integration API.
type InMemoryClient struct {
	mu      sync.RWMutex
	batches map[string]models.Batch
	history map[string][]models.BatchHistoryEvent
}

func NewInMemoryClient() *InMemoryClient {
	return &InMemoryClient{
		batches: make(map[string]models.Batch),
		history: make(map[string][]models.BatchHistoryEvent),
	}
}

func (c *InMemoryClient) CreateBatch(_ context.Context, batch models.Batch, actorID string) (string, models.Batch, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, exists := c.batches[batch.ID]; exists {
		return "", models.Batch{}, errors.New("batch deja existant")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	batch.Timestamp = now
	batch.Statut = "cree"
	c.batches[batch.ID] = batch

	txHash := newTxHash()
	c.history[batch.ID] = append(c.history[batch.ID], models.BatchHistoryEvent{
		BatchID:      batch.ID,
		Type:         "creation",
		ActorID:      actorID,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})
	return txHash, batch, nil
}

func (c *InMemoryClient) TransferBatch(_ context.Context, batchID, fromActorID, toActorID, commentaire string) (string, models.Batch, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	batch, exists := c.batches[batchID]
	if !exists {
		return "", models.Batch{}, errors.New("batch introuvable")
	}
	if batch.Proprietaire != fromActorID {
		return "", models.Batch{}, errors.New("seul le proprietaire courant peut transferer")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	batch.Proprietaire = toActorID
	batch.Statut = "transfere"
	batch.Timestamp = now
	c.batches[batchID] = batch

	txHash := newTxHash()
	c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "transfert",
		FromActorID:  fromActorID,
		ToActorID:    toActorID,
		Commentaire:  commentaire,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})

	return txHash, batch, nil
}

func (c *InMemoryClient) GetBatch(_ context.Context, batchID string) (models.Batch, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return models.Batch{}, errors.New("batch introuvable")
	}
	return batch, nil
}

func (c *InMemoryClient) UpdateBatchWeight(_ context.Context, batchID, actorID string, newWeight float64, justification string) (string, models.Batch, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return "", models.Batch{}, errors.New("batch introuvable")
	}
	if newWeight <= 0 {
		return "", models.Batch{}, errors.New("poids invalide")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Quantite = newWeight
	batch.Timestamp = now
	c.batches[batchID] = batch
	txHash := newTxHash()
	c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "maj_poids",
		ActorID:      actorID,
		Commentaire:  justification,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})
	return txHash, batch, nil
}

func (c *InMemoryClient) MarkBatchExported(_ context.Context, batchID, actorID string) (string, models.Batch, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return "", models.Batch{}, errors.New("batch introuvable")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Statut = "exporte"
	batch.Timestamp = now
	c.batches[batchID] = batch
	txHash := newTxHash()
	c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "export",
		ActorID:      actorID,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})
	return txHash, batch, nil
}

func (c *InMemoryClient) GetHistory(_ context.Context, batchID string) ([]models.BatchHistoryEvent, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	events, exists := c.history[batchID]
	if !exists {
		return nil, errors.New("historique introuvable")
	}
	cp := make([]models.BatchHistoryEvent, len(events))
	copy(cp, events)
	return cp, nil
}

func (c *InMemoryClient) GetStats(_ context.Context) map[string]any {
	c.mu.RLock()
	defer c.mu.RUnlock()
	byStatus := map[string]int{}
	for _, b := range c.batches {
		byStatus[b.Statut]++
	}
	return map[string]any{
		"total_lots":       len(c.batches),
		"lots_by_statut":   byStatus,
		"generated_at_utc": time.Now().UTC().Format(time.RFC3339),
	}
}

func newTxHash() string {
	return fmt.Sprintf("0x%s", uuid.New().String())
}
