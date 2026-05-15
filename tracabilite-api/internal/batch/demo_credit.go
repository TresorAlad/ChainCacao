package batch

import (
	"context"
	"log"
	"os"
	"strconv"

	"tracabilite-api/pkg/models"
)

// DemoInitialCreditAmount lit DEMO_INITIAL_CREDIT_AMOUNT ou retourne 2_000_000 FCFA.
func DemoInitialCreditAmount() float64 {
	initial := 2000000.0
	if v := os.Getenv("DEMO_INITIAL_CREDIT_AMOUNT"); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil && f > 0 {
			initial = f
		}
	}
	return initial
}

func demoCreditEnabled() bool {
	return os.Getenv("DEMO_INITIAL_CREDIT") != "false"
}

func isDemoWalletRole(role models.Role) bool {
	return role == models.RoleExportateur || role == models.RoleTransformateur
}

// EnsureDemoWalletCredit crédite exportateur / transformateur jusqu'au plafond demo.
// Retourne le solde final et une éventuelle erreur de dépôt (pour affichage client).
func (s *Service) EnsureDemoWalletCredit(ctx context.Context, actorID string, role models.Role) (float64, error) {
	bal, err := s.GetWalletBalance(ctx, actorID)
	if err != nil {
		bal = 0
	}
	if !demoCreditEnabled() || !isDemoWalletRole(role) {
		return bal, nil
	}
	initial := DemoInitialCreditAmount()
	if bal >= initial {
		return bal, nil
	}
	need := initial - bal
	if _, err := s.DepositWallet(ctx, actorID, need); err != nil {
		log.Printf("demo wallet: échec crédit %s (+%.0f FCFA): %v", actorID, need, err)
		return bal, err
	}
	final, err := s.GetWalletBalance(ctx, actorID)
	if err != nil {
		return initial, nil
	}
	return final, nil
}
