package batch

// PaymentLine détail financier d'un lot pour un paiement.
type PaymentLine struct {
	LotID      string  `json:"lot_id"`
	SellerID   string  `json:"seller_id,omitempty"`
	PoidsKg    float64 `json:"poids_kg"`
	MontantBrut float64 `json:"montant_brut"`
	MargeFCFA  float64 `json:"marge_fcfa"`
	MontantNet float64 `json:"montant_net"`
}

// PaymentSummary agrégat d'un paiement (lot unique ou liste groupée).
type PaymentSummary struct {
	PrixParKg               float64 `json:"prix_par_kg"`
	MargePct                float64 `json:"marge_pct"`
	MargeFCFA               float64 `json:"marge_fcfa"`
	MontantBrut             float64 `json:"montant_brut"`
	MontantNetAgriculteurs  float64 `json:"montant_net_agriculteurs"`
	MontantTotalDebite      float64 `json:"montant_total_debite"`
	NbAgriculteurs          int     `json:"nb_agriculteurs,omitempty"`
	PoidsTotalKg            float64 `json:"poids_total_kg,omitempty"`
	Lines                   []PaymentLine `json:"lots,omitempty"`
}

// ComputeLine calcule brut, marge et net pour une ligne.
func ComputeLine(prixParKg, qtyKg, margePct float64) (brut, marge, net float64) {
	brut = prixParKg * qtyKg
	if margePct <= 0 {
		return brut, 0, brut
	}
	marge = brut * (margePct / 100)
	net = brut - marge
	return brut, marge, net
}

func aggregateLines(lines []PaymentLine, prixParKg, margePct float64) PaymentSummary {
	var s PaymentSummary
	s.PrixParKg = prixParKg
	s.MargePct = margePct
	s.Lines = lines
	sellers := make(map[string]struct{})
	for _, ln := range lines {
		s.MontantBrut += ln.MontantBrut
		s.MargeFCFA += ln.MargeFCFA
		s.MontantNetAgriculteurs += ln.MontantNet
		s.PoidsTotalKg += ln.PoidsKg
		if ln.SellerID != "" {
			sellers[ln.SellerID] = struct{}{}
		}
	}
	s.MontantTotalDebite = s.MontantBrut
	s.NbAgriculteurs = len(sellers)
	return s
}
