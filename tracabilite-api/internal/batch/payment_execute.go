package batch

import (
	"context"
	"errors"

	"tracabilite-api/internal/fabric"
	"tracabilite-api/internal/groupedlist"
	"tracabilite-api/internal/wallet"
)

func (s *Service) GetCooperativeMargin(ctx context.Context, orgID string) (float64, error) {
	return s.GetCooperativeMarginPct(ctx, orgID)
}

func paymentLinesToFabric(lines []PaymentLine) []fabric.PaymentCreditLine {
	out := make([]fabric.PaymentCreditLine, len(lines))
	for i, ln := range lines {
		out[i] = fabric.PaymentCreditLine{
			BatchID:  ln.LotID,
			SellerID: ln.SellerID,
			Brut:     ln.MontantBrut,
			Marge:    ln.MargeFCFA,
			Net:      ln.MontantNet,
		}
	}
	return out
}

func (s *Service) ExecutePaymentSummary(ctx context.Context, payerID string, coop CooperativeContext, summary PaymentSummary, eventType, listID string) (string, error) {
	if summary.MontantBrut <= 0 {
		return "", errors.New("montant invalide")
	}
	if s.wallets != nil {
		return s.executePaymentSummaryPG(ctx, payerID, coop, summary, eventType, listID)
	}
	bal, err := s.fabricClient.GetWalletBalance(ctx, payerID)
	if err != nil {
		return "", err
	}
	if bal < summary.MontantBrut {
		return "", errors.New("solde insuffisant")
	}
	coopActor := coop.CoopActorID
	if coopActor == "" {
		coopActor = "actor-coop-001"
	}
	return s.fabricClient.ExecutePayment(ctx, fabric.PaymentCreditInput{
		PayerID:     payerID,
		CoopActorID: coopActor,
		TotalBrut:   summary.MontantBrut,
		TotalMarge:  summary.MargeFCFA,
		Lines:       paymentLinesToFabric(summary.Lines),
		EventType:   eventType,
		ListID:      listID,
	})
}

func (s *Service) executePaymentSummaryPG(ctx context.Context, payerID string, coop CooperativeContext, summary PaymentSummary, eventType, listID string) (string, error) {
	coopActor := coop.CoopActorID
	if coopActor == "" {
		coopActor = "actor-coop-001"
	}
	credits := make([]wallet.CreditLine, 0, len(summary.Lines)+1)
	for _, ln := range summary.Lines {
		if ln.MontantNet > 0 && ln.SellerID != "" {
			credits = append(credits, wallet.CreditLine{ActorID: ln.SellerID, Amount: ln.MontantNet})
		}
	}
	if summary.MargeFCFA > 0 && coopActor != "" {
		credits = append(credits, wallet.CreditLine{ActorID: coopActor, Amount: summary.MargeFCFA})
	}
	if err := s.wallets.ApplyPayment(ctx, payerID, summary.MontantBrut, credits); err != nil {
		return "", err
	}
	return s.fabricClient.RecordPaymentOnLedger(ctx, fabric.PaymentCreditInput{
		PayerID:     payerID,
		CoopActorID: coopActor,
		TotalBrut:   summary.MontantBrut,
		TotalMarge:  summary.MargeFCFA,
		Lines:       paymentLinesToFabric(summary.Lines),
		EventType:   eventType,
		ListID:      listID,
	})
}

func (s *Service) ConfirmBatchReceiptWithSummary(ctx context.Context, batchID, actorID string, prixParKg float64) (string, PaymentSummary, error) {
	if prixParKg > 0 {
		if _, err := s.fabricClient.SetBatchPrice(ctx, batchID, actorID, prixParKg); err != nil {
			return "", PaymentSummary{}, err
		}
	} else {
		p, err := s.fabricClient.GetBatchPrice(ctx, batchID)
		if err != nil || p <= 0 {
			return "", PaymentSummary{}, errors.New("aucun prix defini pour ce lot")
		}
		prixParKg = p
	}
	summary, err := s.PreviewLotPayment(ctx, batchID, prixParKg)
	if err != nil {
		return "", PaymentSummary{}, err
	}
	lot, err := s.fabricClient.GetBatch(ctx, batchID)
	if err != nil {
		return "", PaymentSummary{}, err
	}
	coop, err := s.ResolveCooperativeForBatch(ctx, lot)
	if err != nil {
		return "", PaymentSummary{}, err
	}
	txHash, err := s.ExecutePaymentSummary(ctx, actorID, coop, summary, "paiement", "")
	if err != nil {
		return "", PaymentSummary{}, err
	}
	return txHash, summary, nil
}

func (s *Service) PayGroupedListAtomic(ctx context.Context, list groupedlist.List, actorID string, prixParKg float64) (string, PaymentSummary, error) {
	if prixParKg <= 0 {
		return "", PaymentSummary{}, errors.New("prix_par_kg invalide")
	}
	coop, err := s.ResolveCooperativeForList(ctx, list, actorID)
	if err != nil {
		return "", PaymentSummary{}, err
	}
	for _, bid := range list.BatchIDs {
		if _, err := s.fabricClient.SetBatchPrice(ctx, bid, actorID, prixParKg); err != nil {
			return "", PaymentSummary{}, err
		}
	}
	summary, err := s.PreviewGroupedListPayment(ctx, list.BatchIDs, prixParKg, coop.OrgID)
	if err != nil {
		return "", PaymentSummary{}, err
	}
	txHash, err := s.ExecutePaymentSummary(ctx, actorID, coop, summary, "paiement_liste", list.ID)
	if err != nil {
		return "", PaymentSummary{}, err
	}
	return txHash, summary, nil
}
