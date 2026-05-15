package notifications

import "tracabilite-api/pkg/models"

// ResolveSellerID retourne l'acteur crédité lors d'un paiement (vendeur).
func ResolveSellerID(events []models.BatchHistoryEvent, lot models.Batch) string {
	for i := len(events) - 1; i >= 0; i-- {
		e := events[i]
		if e.Type == "transfert" && e.FromActorID != "" {
			return e.FromActorID
		}
	}
	for _, e := range events {
		if e.Type == "creation" && e.ActorID != "" {
			return e.ActorID
		}
	}
	return lot.Proprietaire
}

// ResolveTransferSender retourne l'expéditeur d'un lot en transit (dernier transfert).
func ResolveTransferSender(events []models.BatchHistoryEvent) string {
	for i := len(events) - 1; i >= 0; i-- {
		e := events[i]
		if e.Type == "transfert" && e.FromActorID != "" {
			return e.FromActorID
		}
	}
	return ""
}
