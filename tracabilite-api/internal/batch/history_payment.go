package batch

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"tracabilite-api/internal/wallet"
	"tracabilite-api/pkg/models"
)

func historyHasPayment(events []models.BatchHistoryEvent) bool {
	for _, e := range events {
		t := strings.ToLower(strings.TrimSpace(e.Type))
		if t == "paiement" || t == "paiement_liste" {
			return true
		}
	}
	return false
}

func mergeWalletPaymentHistory(batchID string, events []models.BatchHistoryEvent, txs []wallet.Transaction) []models.BatchHistoryEvent {
	for _, tx := range txs {
		evtType := "paiement"
		if strings.Contains(strings.ToLower(tx.Reference), "liste") || tx.ListID != "" {
			evtType = "paiement_liste"
		}
		events = append(events, models.BatchHistoryEvent{
			BatchID:      batchID,
			Type:         evtType,
			ActorID:      tx.CounterpartyID,
			TxHash:       fmt.Sprintf("pg-wallet-%d", tx.ID),
			CreatedAtISO: tx.CreatedAt.UTC().Format(time.RFC3339),
			Commentaire:  fmt.Sprintf(`{"montant_net":%.2f,"source":"portefeuille"}`, tx.Amount),
		})
	}
	sort.Slice(events, func(i, j int) bool {
		return events[i].CreatedAtISO < events[j].CreatedAtISO
	})
	return events
}
