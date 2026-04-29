package fabric

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"tracabilite-api/pkg/models"
)

type Client interface {
	CreateBatch(batch models.Batch, actorID string) (txHash string, created models.Batch, err error)
	TransferBatch(batchID, fromActorID, toActorID, commentaire string) (txHash string, updated models.Batch, err error)
	GetBatch(batchID string) (models.Batch, error)
	GetHistory(batchID string) ([]models.BatchHistoryEvent, error)
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

func (c *InMemoryClient) CreateBatch(batch models.Batch, actorID string) (string, models.Batch, error) {
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

func (c *InMemoryClient) TransferBatch(batchID, fromActorID, toActorID, commentaire string) (string, models.Batch, error) {
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

func (c *InMemoryClient) GetBatch(batchID string) (models.Batch, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return models.Batch{}, errors.New("batch introuvable")
	}
	return batch, nil
}

func (c *InMemoryClient) GetHistory(batchID string) ([]models.BatchHistoryEvent, error) {
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

func newTxHash() string {
	return fmt.Sprintf("0x%s", uuid.New().String())
}
