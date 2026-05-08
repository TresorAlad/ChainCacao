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
	// GetBatchesByOwner retourne tous les lots dont Proprietaire == actorID.
	GetBatchesByOwner(ctx context.Context, actorID string) ([]models.Batch, error)
	GetStats(ctx context.Context) map[string]any
	GetRecentTransfers(ctx context.Context) ([]map[string]any, error)
	GetActivityChart(ctx context.Context) ([]map[string]any, error)
	GetEUDRCompliance(ctx context.Context) (map[string]any, error)
	GetAlertsCount(ctx context.Context) (map[string]any, error)

	UpdateBatch(ctx context.Context, batchID, actorID string, variete, parcelle, notes string, poids float64, justification string) (txHash string, updated models.Batch, err error)
	SetBatchPrice(ctx context.Context, batchID, actorID string, price float64) (txHash string, err error)
	ConfirmBatchReceipt(ctx context.Context, batchID, actorID string) (txHash string, err error)
	GetPaymentStatus(ctx context.Context, batchID string) (map[string]any, error)
	CreateGroupedList(ctx context.Context, listID string, batchIDs []string, actorID string) (txHash string, err error)
	PayGroupedList(ctx context.Context, listID, actorID string) (txHash string, err error)
	SetCooperativeMargin(ctx context.Context, orgID string, margin float64, actorID string) (txHash string, err error)
	GetWalletBalance(ctx context.Context, actorID string) (float64, error)
	DepositWallet(ctx context.Context, actorID string, amount float64) (txHash string, err error)
	WithdrawWallet(ctx context.Context, actorID string, amount float64) (txHash string, err error)
}

// InMemoryClient simule Fabric pour le dev local et tests d'integration API.
type InMemoryClient struct {
	mu           sync.RWMutex
	batches      map[string]models.Batch
	history      map[string][]models.BatchHistoryEvent
	groupedLists map[string][]string // listID -> batchIDs
	wallets      map[string]float64  // actorID -> balance
	margins      map[string]float64  // orgID -> margin
	prices       map[string]float64  // batchID -> price
	payments     map[string]string   // batchID -> status
}

func NewInMemoryClient() *InMemoryClient {
	return &InMemoryClient{
		batches:      make(map[string]models.Batch),
		history:      make(map[string][]models.BatchHistoryEvent),
		groupedLists: make(map[string][]string),
		wallets:      make(map[string]float64),
		margins:      make(map[string]float64),
		prices:       make(map[string]float64),
		payments:     make(map[string]string),
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

func (c *InMemoryClient) GetBatchesByOwner(_ context.Context, actorID string) ([]models.Batch, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	var result []models.Batch
	for _, b := range c.batches {
		if b.Proprietaire == actorID {
			result = append(result, b)
		}
	}
	return result, nil
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

func (c *InMemoryClient) GetRecentTransfers(_ context.Context) ([]map[string]any, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	// Extraire les vrais evenements de transfert depuis l'historique en memoire.
	var transfers []map[string]any
	for batchID, events := range c.history {
		for _, ev := range events {
			if ev.Type != "transfert" {
				continue
			}
			transfers = append(transfers, map[string]any{
				"id":         batchID,
				"date":       ev.CreatedAtISO,
				"from_actor": ev.FromActorID,
				"to_actor":   ev.ToActorID,
				"tx_hash":    ev.TxHash,
				"status":     "VALIDÉ",
				"commentaire": ev.Commentaire,
			})
		}
	}
	return transfers, nil
}

func (c *InMemoryClient) GetActivityChart(_ context.Context) ([]map[string]any, error) {
	return []map[string]any{
		{"day": "Lun", "value": 142, "width": "85%"},
		{"day": "Mar", "value": 176, "width": "100%"},
		{"day": "Mer", "value": 124, "width": "70%"},
		{"day": "Jeu", "value": 188, "width": "95%"},
		{"day": "Ven", "value": 156, "width": "90%"},
		{"day": "Sam", "value": 87, "width": "50%"},
		{"day": "Dim", "value": 55, "width": "35%"},
	}, nil
}

func (c *InMemoryClient) GetEUDRCompliance(_ context.Context) (map[string]any, error) {
	return map[string]any{
		"percentage": 94,
		"status":     "Objectif Atteint",
	}, nil
}

func (c *InMemoryClient) GetAlertsCount(_ context.Context) (map[string]any, error) {
	return map[string]any{
		"total":  38,
		"urgent": 5,
	}, nil
}

func (c *InMemoryClient) UpdateBatch(_ context.Context, batchID, actorID string, variete, parcelle, notes string, poids float64, justification string) (string, models.Batch, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return "", models.Batch{}, errors.New("batch introuvable")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	if variete != "" { batch.Variete = variete }
	if parcelle != "" { batch.Parcelle = parcelle }
	if notes != "" { batch.Notes = notes }
	if poids > 0 { batch.Quantite = poids }
	batch.Timestamp = now
	c.batches[batchID] = batch
	txHash := newTxHash()
	c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "correction",
		ActorID:      actorID,
		Commentaire:  justification,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})
	return txHash, batch, nil
}

func (c *InMemoryClient) SetBatchPrice(_ context.Context, batchID, actorID string, price float64) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, exists := c.batches[batchID]; !exists {
		return "", errors.New("batch introuvable")
	}
	c.prices[batchID] = price
	return newTxHash(), nil
}

func (c *InMemoryClient) ConfirmBatchReceipt(_ context.Context, batchID, actorID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return "", errors.New("batch introuvable")
	}
	
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Statut = "paye"
	batch.Timestamp = now
	c.batches[batchID] = batch
	c.payments[batchID] = "paye"

	price := c.prices[batchID]
	if price <= 0 {
		price = 1500 // Prix par defaut si non defini
	}
	amount := price * batch.Quantite
	// Debiter l'acheteur avant de crediter l'agriculteur (mode demo).
	if c.wallets[actorID] < amount {
		return "", errors.New("solde insuffisant")
	}
	c.wallets[actorID] -= amount
	
	// Simuler le paiement a l'agriculteur (on ne debite pas l'acheteur ici, just credit)
	c.wallets[batch.Proprietaire] += amount

	txHash := newTxHash()
	c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "paiement",
		ActorID:      actorID,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})
	return txHash, nil
}

func (c *InMemoryClient) GetPaymentStatus(_ context.Context, batchID string) (map[string]any, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	status, exists := c.payments[batchID]
	if !exists {
		status = "en_attente"
	}
	return map[string]any{"batch_id": batchID, "status": status}, nil
}

func (c *InMemoryClient) CreateGroupedList(_ context.Context, listID string, batchIDs []string, actorID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.groupedLists[listID] = batchIDs
	return newTxHash(), nil
}

func (c *InMemoryClient) PayGroupedList(_ context.Context, listID, actorID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	batchIDs, exists := c.groupedLists[listID]
	if !exists {
		return "", errors.New("liste introuvable")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	txHash := newTxHash()
	for _, batchID := range batchIDs {
		if b, ok := c.batches[batchID]; ok {
			b.Statut = "paye"
			b.Timestamp = now
			c.batches[batchID] = b
			c.payments[batchID] = "paye"
			price := c.prices[batchID]
			if price <= 0 { price = 1500 }
			c.wallets[b.Proprietaire] += price * b.Quantite
			
			c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
				BatchID:      batchID,
				Type:         "paiement_liste",
				ActorID:      actorID,
				TxHash:       txHash,
				CreatedAtISO: now,
				Payload:      b,
			})
		}
	}
	return txHash, nil
}

func (c *InMemoryClient) SetCooperativeMargin(_ context.Context, orgID string, margin float64, actorID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.margins[orgID] = margin
	return newTxHash(), nil
}

func (c *InMemoryClient) GetWalletBalance(_ context.Context, actorID string) (float64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.wallets[actorID], nil
}

func (c *InMemoryClient) DepositWallet(_ context.Context, actorID string, amount float64) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.wallets[actorID] += amount
	return newTxHash(), nil
}

func (c *InMemoryClient) WithdrawWallet(_ context.Context, actorID string, amount float64) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.wallets[actorID] < amount {
		return "", errors.New("solde insuffisant")
	}
	c.wallets[actorID] -= amount
	return newTxHash(), nil
}

func newTxHash() string {
	return fmt.Sprintf("0x%s", uuid.New().String())
}
