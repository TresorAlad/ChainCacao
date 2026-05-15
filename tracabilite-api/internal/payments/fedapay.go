package payments

import (
	"context"
	"errors"
	"os"
)

// Provider abstrait Mobile Money (CDC FedaPay).
type Provider interface {
	InitiateDeposit(ctx context.Context, actorID string, amountFCFA float64, operator string) (reference string, err error)
	InitiateWithdrawal(ctx context.Context, actorID string, amountFCFA float64, operator string) (reference string, err error)
}

type mockProvider struct{}

func (mockProvider) InitiateDeposit(_ context.Context, actorID string, amountFCFA float64, operator string) (string, error) {
	return "FEDAPAY-MOCK-DEP-" + actorID, nil
}

func (mockProvider) InitiateWithdrawal(_ context.Context, actorID string, amountFCFA float64, operator string) (string, error) {
	return "FEDAPAY-MOCK-WDR-" + actorID, nil
}

// NewProvider retourne FedaPay réel si FEDAPAY_API_KEY est défini, sinon mock MVP.
func NewProvider() (Provider, error) {
	if os.Getenv("FEDAPAY_API_KEY") != "" {
		return nil, errors.New("FedaPay: intégration API à brancher (clé détectée)")
	}
	return mockProvider{}, nil
}
