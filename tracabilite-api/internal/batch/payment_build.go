package batch

import (
	"context"
	"fmt"
	"strings"

	"tracabilite-api/pkg/models"
)

func (s *Service) sellerIDForBatch(ctx context.Context, lot models.Batch) string {
	owner := strings.TrimSpace(lot.Proprietaire)
	creator := strings.TrimSpace(lot.CreateurID)
	// Après transfert, le propriétaire est l’acheteur (coop / exportateur) : créditer l’agriculteur.
	if creator != "" && creator != owner {
		return creator
	}
	if events, err := s.fabricClient.GetHistory(ctx, lot.ID); err == nil {
		for i := len(events) - 1; i >= 0; i-- {
			ev := events[i]
			if strings.EqualFold(strings.TrimSpace(ev.Type), "transfert") {
				if from := strings.TrimSpace(ev.FromActorID); from != "" && from != owner {
					return from
				}
			}
		}
	}
	return owner
}

func (s *Service) BuildPaymentLines(ctx context.Context, batchIDs []string, prixParKg, margePct float64) ([]PaymentLine, error) {
	lines := make([]PaymentLine, 0, len(batchIDs))
	for _, bid := range batchIDs {
		lot, err := s.fabricClient.GetBatch(ctx, bid)
		if err != nil {
			return nil, fmt.Errorf("lot introuvable: %s", bid)
		}
		if strings.EqualFold(strings.TrimSpace(lot.Statut), "en_transit") {
			return nil, fmt.Errorf("lot %s encore en transit", bid)
		}
		brut, marge, net := ComputeLine(prixParKg, lot.Quantite, margePct)
		lines = append(lines, PaymentLine{
			LotID:       bid,
			SellerID:    s.sellerIDForBatch(ctx, lot),
			PoidsKg:     lot.Quantite,
			MontantBrut: brut,
			MargeFCFA:   marge,
			MontantNet:  net,
		})
	}
	return lines, nil
}

func (s *Service) PreviewGroupedListPayment(ctx context.Context, batchIDs []string, prixParKg float64, coopOrgID string) (PaymentSummary, error) {
	if prixParKg <= 0 {
		return PaymentSummary{}, fmt.Errorf("prix_par_kg invalide")
	}
	margePct, err := s.GetCooperativeMarginPct(ctx, coopOrgID)
	if err != nil {
		return PaymentSummary{}, err
	}
	lines, err := s.BuildPaymentLines(ctx, batchIDs, prixParKg, margePct)
	if err != nil {
		return PaymentSummary{}, err
	}
	return aggregateLines(lines, prixParKg, margePct), nil
}

func (s *Service) PreviewLotPayment(ctx context.Context, batchID string, prixParKg float64) (PaymentSummary, error) {
	if prixParKg <= 0 {
		return PaymentSummary{}, fmt.Errorf("prix_par_kg invalide")
	}
	lot, err := s.fabricClient.GetBatch(ctx, batchID)
	if err != nil {
		return PaymentSummary{}, err
	}
	coop, err := s.ResolveCooperativeForBatch(ctx, lot)
	if err != nil {
		return PaymentSummary{}, err
	}
	margePct, err := s.GetCooperativeMarginPct(ctx, coop.OrgID)
	if err != nil {
		return PaymentSummary{}, err
	}
	lines, err := s.BuildPaymentLines(ctx, []string{batchID}, prixParKg, margePct)
	if err != nil {
		return PaymentSummary{}, err
	}
	return aggregateLines(lines, prixParKg, margePct), nil
}
