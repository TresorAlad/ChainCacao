package fabric

import (
	"context"
	"encoding/json"
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
	GetAlertsCount(ctx context.Context) (map[string]any, error)

	UpdateBatch(ctx context.Context, batchID, actorID string, variete, parcelle, notes string, poids float64, justification string) (txHash string, updated models.Batch, err error)
	SetBatchPrice(ctx context.Context, batchID, actorID string, price float64) (txHash string, err error)
	// GetBatchPrice retourne le prix au kg (>0) ou 0 si non defini.
	GetBatchPrice(ctx context.Context, batchID string) (float64, error)
	// ConfirmPhysicalReceipt : le proprietaire actuel (destinataire) confirme la reception ; statut en_transit -> recu.
	ConfirmPhysicalReceipt(ctx context.Context, batchID, actorID string) (txHash string, updated models.Batch, err error)
	ConfirmBatchReceipt(ctx context.Context, batchID, actorID string) (txHash string, err error)
	GetPaymentStatus(ctx context.Context, batchID string) (map[string]any, error)
	CreateGroupedList(ctx context.Context, listID string, batchIDs []string, actorID string) (txHash string, err error)
	PayGroupedList(ctx context.Context, listID, actorID string) (txHash string, err error)
	// PayGroupedListWithDebit debite le payeur puis distribue les paiements (operation atomique cote ledger demo).
	PayGroupedListWithDebit(ctx context.Context, listID, actorID string, totalAmount float64) (txHash string, err error)
	SetCooperativeMargin(ctx context.Context, orgID string, margin float64, actorID string) (txHash string, err error)
	GetCooperativeMargin(ctx context.Context, orgID string) (float64, error)
	// ExecutePayment debite le payeur (total brut) et credite vendeurs (net) + coop (marge).
	ExecutePayment(ctx context.Context, in PaymentCreditInput) (txHash string, err error)
	// RecordPaymentOnLedger marque les lots payes sans mouvement portefeuille (soldes geres en PostgreSQL).
	RecordPaymentOnLedger(ctx context.Context, in PaymentCreditInput) (txHash string, err error)
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
	// sellers: dernier vendeur connu pour un lot (acteur qui a transfere vers le proprietaire actuel).
	// Permet de crediter le bon compte au paiement (le proprietaire courant est l'acheteur).
	sellers map[string]string // batchID -> actorID du vendeur
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
		sellers:      make(map[string]string),
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
	c.sellers[batch.ID] = actorID // createur = beneficiaire du paiement si aucun transfert

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
	batch.Statut = "en_transit"
	batch.Timestamp = now
	c.batches[batchID] = batch
	c.sellers[batchID] = fromActorID // vendeur = precedent proprietaire

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
	c.mu.RLock()
	defer c.mu.RUnlock()

	dayLabels := []string{"Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"}
	counts := make([]int, 7)
	now := time.Now().UTC()
	for _, events := range c.history {
		for _, ev := range events {
			if ev.Type != "creation" && ev.Type != "transfert" {
				continue
			}
			t, err := time.Parse(time.RFC3339, ev.CreatedAtISO)
			if err != nil {
				continue
			}
			if now.Sub(t) > 7*24*time.Hour {
				continue
			}
			wd := int(t.Weekday())
			counts[wd]++
		}
	}
	maxVal := 1
	for _, v := range counts {
		if v > maxVal {
			maxVal = v
		}
	}
	out := make([]map[string]any, 0, 7)
	for i := 0; i < 7; i++ {
		wd := (int(now.Weekday()) - 6 + i + 7) % 7
		v := counts[wd]
		width := "0%"
		if maxVal > 0 {
			width = fmt.Sprintf("%.0f%%", float64(v)/float64(maxVal)*100)
		}
		out = append(out, map[string]any{
			"day":   dayLabels[wd],
			"value": v,
			"width": width,
		})
	}
	return out, nil
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

func (c *InMemoryClient) GetBatchPrice(_ context.Context, batchID string) (float64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	p := c.prices[batchID]
	return p, nil
}

func (c *InMemoryClient) ConfirmPhysicalReceipt(_ context.Context, batchID, actorID string) (string, models.Batch, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	batch, exists := c.batches[batchID]
	if !exists {
		return "", models.Batch{}, errors.New("batch introuvable")
	}
	if batch.Proprietaire != actorID {
		return "", models.Batch{}, errors.New("seul le destinataire (proprietaire actuel) peut confirmer la reception")
	}
	if batch.Statut != "en_transit" {
		return "", models.Batch{}, fmt.Errorf("le lot n'est pas en attente de reception (statut: %s)", batch.Statut)
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Statut = "recu"
	batch.Timestamp = now
	c.batches[batchID] = batch

	txHash := newTxHash()
	c.history[batchID] = append(c.history[batchID], models.BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "reception",
		ActorID:      actorID,
		TxHash:       txHash,
		CreatedAtISO: now,
		Payload:      batch,
	})
	return txHash, batch, nil
}

func (c *InMemoryClient) ConfirmBatchReceipt(ctx context.Context, batchID, actorID string) (string, error) {
	c.mu.RLock()
	batch, exists := c.batches[batchID]
	price := c.prices[batchID]
	orgID := defaultCooperativeOrgID
	margePct := c.getMarginLocked(orgID)
	c.mu.RUnlock()
	if !exists {
		return "", errors.New("batch introuvable")
	}
	if price <= 0 {
		price = 1500
	}
	brut, marge, net := brutMargeNet(price, batch.Quantite, margePct)
	seller := batch.Proprietaire
	if s, ok := c.sellers[batchID]; ok && s != "" {
		seller = s
	}
	coopID := defaultCoopActorID
	return c.ExecutePayment(ctx, PaymentCreditInput{
		PayerID:     actorID,
		CoopActorID: coopID,
		TotalBrut:   brut,
		TotalMarge:  marge,
		Lines: []PaymentCreditLine{{
			BatchID: batchID, SellerID: seller, Brut: brut, Marge: marge, Net: net,
		}},
		EventType: "paiement",
	})
}

const defaultCooperativeOrgID = "CooperativeMSP"
const defaultCoopActorID = "actor-coop-001"

func brutMargeNet(prixParKg, qty, margePct float64) (brut, marge, net float64) {
	brut = prixParKg * qty
	if margePct <= 0 {
		return brut, 0, brut
	}
	marge = brut * (margePct / 100)
	return brut, marge, brut - marge
}

func (c *InMemoryClient) getMarginLocked(orgID string) float64 {
	if m, ok := c.margins[orgID]; ok {
		return m
	}
	return 0
}

func (c *InMemoryClient) GetCooperativeMargin(_ context.Context, orgID string) (float64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.getMarginLocked(orgID), nil
}

func (c *InMemoryClient) ExecutePayment(_ context.Context, in PaymentCreditInput) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if in.PayerID == "" || len(in.Lines) == 0 {
		return "", errors.New("paiement invalide")
	}
	if in.TotalBrut <= 0 {
		var tb, tm float64
		for _, ln := range in.Lines {
			tb += ln.Brut
			tm += ln.Marge
		}
		in.TotalBrut = tb
		if in.TotalMarge == 0 {
			in.TotalMarge = tm
		}
	}
	if c.wallets[in.PayerID] < in.TotalBrut {
		return "", errors.New("solde insuffisant")
	}
	c.wallets[in.PayerID] -= in.TotalBrut
	for _, ln := range in.Lines {
		seller := ln.SellerID
		if seller == "" {
			if b, ok := c.batches[ln.BatchID]; ok {
				seller = b.Proprietaire
			}
		}
		if ln.Net > 0 && seller != "" {
			c.wallets[seller] += ln.Net
		}
	}
	if in.CoopActorID != "" && in.TotalMarge > 0 {
		c.wallets[in.CoopActorID] += in.TotalMarge
	}
	now := time.Now().UTC().Format(time.RFC3339)
	txHash := newTxHash()
	evtType := in.EventType
	if evtType == "" {
		evtType = "paiement"
	}
	for _, ln := range in.Lines {
		b, ok := c.batches[ln.BatchID]
		if !ok {
			c.wallets[in.PayerID] += in.TotalBrut
			return "", fmt.Errorf("lot introuvable: %s", ln.BatchID)
		}
		if b.Statut == "en_transit" {
			c.refundPaymentLocked(in)
			return "", fmt.Errorf("lot %s en transit: reception non confirmee", ln.BatchID)
		}
		if b.Statut == "paye" {
			c.refundPaymentLocked(in)
			return "", fmt.Errorf("lot %s deja paye", ln.BatchID)
		}
		b.Statut = "paye"
		b.Timestamp = now
		c.batches[ln.BatchID] = b
		c.payments[ln.BatchID] = "paye"
		pct := marginPctFromAmounts(ln.Brut, ln.Marge)
		c.history[ln.BatchID] = append(c.history[ln.BatchID], models.BatchHistoryEvent{
			BatchID:      ln.BatchID,
			Type:         evtType,
			ActorID:      in.PayerID,
			TxHash:       txHash,
			CreatedAtISO: now,
			Commentaire:  fmt.Sprintf(`{"montant_brut":%.2f,"marge_fcfa":%.2f,"marge_pct":%.2f,"montant_net":%.2f}`, ln.Brut, ln.Marge, pct, ln.Net),
			Payload:      b,
		})
	}
	return txHash, nil
}

func (c *InMemoryClient) RecordPaymentOnLedger(_ context.Context, in PaymentCreditInput) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if in.PayerID == "" || len(in.Lines) == 0 {
		return "", errors.New("paiement invalide")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	txHash := newTxHash()
	evtType := in.EventType
	if evtType == "" {
		evtType = "paiement"
	}
	for _, ln := range in.Lines {
		b, ok := c.batches[ln.BatchID]
		if !ok {
			return "", fmt.Errorf("lot introuvable: %s", ln.BatchID)
		}
		if b.Statut == "en_transit" {
			return "", fmt.Errorf("lot %s en transit: reception non confirmee", ln.BatchID)
		}
		if b.Statut == "paye" {
			return "", fmt.Errorf("lot %s deja paye", ln.BatchID)
		}
		b.Statut = "paye"
		b.Timestamp = now
		c.batches[ln.BatchID] = b
		c.payments[ln.BatchID] = "paye"
		pct := marginPctFromAmounts(ln.Brut, ln.Marge)
		c.history[ln.BatchID] = append(c.history[ln.BatchID], models.BatchHistoryEvent{
			BatchID:      ln.BatchID,
			Type:         evtType,
			ActorID:      in.PayerID,
			TxHash:       txHash,
			CreatedAtISO: now,
			Commentaire:  fmt.Sprintf(`{"montant_brut":%.2f,"marge_fcfa":%.2f,"marge_pct":%.2f,"montant_net":%.2f}`, ln.Brut, ln.Marge, pct, ln.Net),
			Payload:      b,
		})
	}
	return txHash, nil
}

func marginPctFromAmounts(brut, marge float64) float64 {
	if brut <= 0 || marge <= 0 {
		return 0
	}
	return (marge / brut) * 100
}

func (c *InMemoryClient) refundPaymentLocked(in PaymentCreditInput) {
	c.wallets[in.PayerID] += in.TotalBrut
	for _, ln := range in.Lines {
		seller := ln.SellerID
		if seller == "" {
			if b, ok := c.batches[ln.BatchID]; ok {
				seller = b.Proprietaire
			}
		}
		if ln.Net > 0 && seller != "" {
			c.wallets[seller] -= ln.Net
		}
	}
	if in.CoopActorID != "" && in.TotalMarge > 0 {
		c.wallets[in.CoopActorID] -= in.TotalMarge
	}
}

func (c *InMemoryClient) GetPaymentStatus(_ context.Context, batchID string) (map[string]any, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	status, exists := c.payments[batchID]
	if !exists {
		status = "en_attente"
	}
	out := map[string]any{"batch_id": batchID, "status": status}
	for i := len(c.history[batchID]) - 1; i >= 0; i-- {
		ev := c.history[batchID][i]
		if ev.Type != "paiement" && ev.Type != "paiement_liste" {
			continue
		}
		out["tx_hash"] = ev.TxHash
		if ev.Commentaire != "" {
			var parsed map[string]any
			if json.Unmarshal([]byte(ev.Commentaire), &parsed) == nil {
				for k, v := range parsed {
					out[k] = v
				}
			}
		}
		break
	}
	return out, nil
}

func (c *InMemoryClient) CreateGroupedList(_ context.Context, listID string, batchIDs []string, actorID string) (string, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.groupedLists[listID] = batchIDs
	return newTxHash(), nil
}

func (c *InMemoryClient) PayGroupedList(ctx context.Context, listID, actorID string) (string, error) {
	return c.PayGroupedListWithDebit(ctx, listID, actorID, 0)
}

func (c *InMemoryClient) PayGroupedListWithDebit(ctx context.Context, listID, actorID string, totalAmount float64) (string, error) {
	_ = totalAmount
	c.mu.RLock()
	batchIDs, exists := c.groupedLists[listID]
	c.mu.RUnlock()
	if !exists {
		return "", errors.New("liste introuvable")
	}
	orgID := defaultCooperativeOrgID
	margePct, _ := c.GetCooperativeMargin(ctx, orgID)
	var lines []PaymentCreditLine
	var totalBrut, totalMarge float64
	c.mu.RLock()
	for _, batchID := range batchIDs {
		b, ok := c.batches[batchID]
		if !ok {
			c.mu.RUnlock()
			return "", fmt.Errorf("lot introuvable: %s", batchID)
		}
		price := c.prices[batchID]
		if price <= 0 {
			price = 1500
		}
		brut, marge, net := brutMargeNet(price, b.Quantite, margePct)
		seller := b.Proprietaire
		if s, ok := c.sellers[batchID]; ok && s != "" {
			seller = s
		}
		lines = append(lines, PaymentCreditLine{
			BatchID: batchID, SellerID: seller, Brut: brut, Marge: marge, Net: net,
		})
		totalBrut += brut
		totalMarge += marge
	}
	c.mu.RUnlock()
	return c.ExecutePayment(ctx, PaymentCreditInput{
		PayerID:     actorID,
		CoopActorID: defaultCoopActorID,
		TotalBrut:   totalBrut,
		TotalMarge:  totalMarge,
		Lines:       lines,
		EventType:   "paiement_liste",
		ListID:      listID,
	})
}

func (c *InMemoryClient) payGroupedListLocked(listID, actorID string, debitAmount float64, withDebit bool) (string, error) {
	_ = debitAmount
	_ = withDebit
	return "", errors.New("utiliser PayGroupedListWithDebit avec ExecutePayment")
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
