package fabric

// PaymentCreditLine distribution portefeuille pour un lot.
type PaymentCreditLine struct {
	BatchID  string  `json:"BatchID"`
	SellerID string  `json:"SellerID"`
	Brut     float64 `json:"Brut"`
	Marge    float64 `json:"Marge"`
	Net      float64 `json:"Net"`
}

// PaymentCreditInput paiement avec split marge coopérative.
type PaymentCreditInput struct {
	PayerID     string              `json:"PayerID"`
	CoopActorID string              `json:"CoopActorID"`
	TotalBrut   float64             `json:"TotalBrut"`
	TotalMarge  float64             `json:"TotalMarge"`
	Lines       []PaymentCreditLine `json:"Lines"`
	EventType   string              `json:"EventType"` // paiement | paiement_liste
	ListID      string              `json:"ListID"`
	// SkipWallet : enregistrement ledger uniquement (portefeuille PostgreSQL déjà débité).
	SkipWallet bool `json:"SkipWallet,omitempty"`
}
