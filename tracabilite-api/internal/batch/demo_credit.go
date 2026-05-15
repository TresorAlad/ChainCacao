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
func (s *Service) EnsureDemoWalletCredit(ctx context.Context, actorID string, role models.Role) {
	if !demoCreditEnabled() || !isDemoWalletRole(role) {
		return
	}
	initial := DemoInitialCreditAmount()
	bal, err := s.GetWalletBalance(ctx, actorID)
	if err != nil {
		log.Printf("demo wallet: solde %s illisible (%v), crédit quand même", actorID, err)
		bal = 0
	}
	if bal >= initial {
		return
	}
	if _, err := s.DepositWallet(ctx, actorID, initial-bal); err != nil {
		log.Printf("demo wallet: échec crédit %s (+%.0f FCFA): %v", actorID, initial-bal, err)
	}
}
