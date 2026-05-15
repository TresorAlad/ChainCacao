package fabric

// PaymentCreditLine distribution portefeuille pour un lot.
type PaymentCreditLine struct {
	BatchID  string
	SellerID string
	Brut     float64
	Marge    float64
	Net      float64
}

// PaymentCreditInput paiement avec split marge coopérative.
type PaymentCreditInput struct {
	PayerID     string
	CoopActorID string
	TotalBrut   float64
	TotalMarge  float64
	Lines       []PaymentCreditLine
	EventType   string // paiement | paiement_liste
	ListID      string
}
