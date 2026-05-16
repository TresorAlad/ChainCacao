package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Batch représente un lot de café/cacao sur le ledger.
// Note: aucun omitempty pour que le schéma fabric-contract-api-go ne marque pas de champ comme requis absent.
type Batch struct {
	ID            string  `json:"id"`
	Culture       string  `json:"culture"`
	Variete       string  `json:"variete"`
	Quantite      float64 `json:"quantite"`
	Lieu          string  `json:"lieu"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Region        string  `json:"region"`
	Village       string  `json:"village"`
	Parcelle      string  `json:"parcelle"`
	DateRecolte   string  `json:"date_recolte"`
	Proprietaire  string  `json:"proprietaire_id"`
	OrgID         string  `json:"org_id"`
	Statut        string  `json:"statut"`
	EUDRConforme  bool    `json:"eudr_conforme"`
	Timestamp     string  `json:"timestamp"`
	CertificatURL string  `json:"certificat_url"`
	PhotoURL      string  `json:"photo_url"`
	Notes         string  `json:"notes"`
}

// BatchHistoryEvent représente un événement de l'historique d'un lot.
type BatchHistoryEvent struct {
	BatchID      string `json:"batch_id"`
	Type         string `json:"type"`
	FromActorID  string `json:"from_actor_id"`
	ToActorID    string `json:"to_actor_id"`
	Commentaire  string `json:"commentaire"`
	TxHash       string `json:"tx_hash"`
	ActorID      string `json:"actor_id"`
	CreatedAtISO string `json:"created_at"`
	Payload      Batch  `json:"payload"`
}

// SmartContract implémente le chaincode ChainCacao.
type SmartContract struct {
	contractapi.Contract
}

const (
	defaultPricePerKg    = 1500.0
	defaultCoopOrgMargin = "CooperativeMSP"
	defaultCoopActorID   = "actor-coop-001"
)

func historyKey(batchID string) string {
	return "HISTORY:" + batchID
}

func priceKey(batchID string) string {
	return "PRICE:" + batchID
}

func paymentMetaKey(batchID string) string {
	return "PAYMENT:" + batchID
}

func marginKey(orgID string) string {
	return "MARGIN:" + orgID
}

func groupedListKey(listID string) string {
	return "GROUPEDLIST:" + listID
}

func walletKey(actorID string) string {
	return "WALLET:" + actorID
}

func sellerKey(batchID string) string {
	return "SELLER:" + batchID
}

func putSellerTrack(ctx contractapi.TransactionContextInterface, batchID, sellerActorID string) error {
	raw, err := json.Marshal(sellerActorID)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(sellerKey(batchID), raw)
}

func readSellerID(ctx contractapi.TransactionContextInterface, batchID string) (string, error) {
	raw, err := ctx.GetStub().GetState(sellerKey(batchID))
	if err != nil {
		return "", err
	}
	if raw == nil {
		return "", nil
	}
	var sid string
	if err := json.Unmarshal(raw, &sid); err != nil {
		return "", nil
	}
	return sid, nil
}

func (s *SmartContract) readHistory(ctx contractapi.TransactionContextInterface, batchID string) ([]BatchHistoryEvent, error) {
	raw, err := ctx.GetStub().GetState(historyKey(batchID))
	if err != nil {
		return nil, err
	}
	if raw == nil {
		return []BatchHistoryEvent{}, nil
	}
	var events []BatchHistoryEvent
	if err := json.Unmarshal(raw, &events); err != nil {
		return nil, err
	}
	return events, nil
}

func (s *SmartContract) appendHistory(ctx contractapi.TransactionContextInterface, event BatchHistoryEvent) error {
	events, err := s.readHistory(ctx, event.BatchID)
	if err != nil {
		return err
	}
	events = append(events, event)
	raw, err := json.Marshal(events)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(historyKey(event.BatchID), raw)
}

func (s *SmartContract) walletGet(ctx contractapi.TransactionContextInterface, actorID string) (float64, error) {
	raw, err := ctx.GetStub().GetState(walletKey(actorID))
	if err != nil {
		return 0, err
	}
	if raw == nil {
		return 0, nil
	}
	var v float64
	if err := json.Unmarshal(raw, &v); err != nil {
		return 0, nil
	}
	return v, nil
}

func (s *SmartContract) walletPut(ctx contractapi.TransactionContextInterface, actorID string, balance float64) error {
	raw, err := json.Marshal(balance)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(walletKey(actorID), raw)
}

func (s *SmartContract) marginGet(ctx contractapi.TransactionContextInterface, orgID string) (float64, error) {
	raw, err := ctx.GetStub().GetState(marginKey(orgID))
	if err != nil {
		return 0, err
	}
	if raw == nil {
		return 0, nil
	}
	var v float64
	if err := json.Unmarshal(raw, &v); err != nil {
		return 0, nil
	}
	return v, nil
}

func (s *SmartContract) priceGet(ctx contractapi.TransactionContextInterface, batchID string) (float64, error) {
	raw, err := ctx.GetStub().GetState(priceKey(batchID))
	if err != nil {
		return 0, err
	}
	if raw == nil {
		return 0, nil
	}
	var v float64
	if err := json.Unmarshal(raw, &v); err != nil {
		return 0, nil
	}
	return v, nil
}

func brutMargeNet(prixParKg, qty, margePct float64) (brut, marge, net float64) {
	brut = prixParKg * qty
	if margePct <= 0 {
		return brut, 0, brut
	}
	marge = brut * (margePct / 100)
	return brut, marge, brut - marge
}

func marginPctFromAmounts(brut, marge float64) float64 {
	if brut <= 0 || marge <= 0 {
		return 0
	}
	return (marge / brut) * 100
}

// paymentLine / paymentInput : JSON produit par tracabilite-api (champs exportés Go).
type paymentLine struct {
	BatchID  string  `json:"BatchID"`
	SellerID string  `json:"SellerID"`
	Brut     float64 `json:"Brut"`
	Marge    float64 `json:"Marge"`
	Net      float64 `json:"Net"`
}

type paymentInput struct {
	PayerID     string        `json:"PayerID"`
	CoopActorID string        `json:"CoopActorID"`
	TotalBrut   float64       `json:"TotalBrut"`
	TotalMarge  float64       `json:"TotalMarge"`
	Lines       []paymentLine `json:"Lines"`
	EventType   string        `json:"EventType"`
	ListID      string        `json:"ListID"`
}

func (s *SmartContract) executePaymentCore(ctx contractapi.TransactionContextInterface, in paymentInput) error {
	if strings.TrimSpace(in.PayerID) == "" || len(in.Lines) == 0 {
		return fmt.Errorf("paiement invalide")
	}
	totalBrut := in.TotalBrut
	totalMarge := in.TotalMarge
	if totalBrut <= 0 {
		for _, ln := range in.Lines {
			totalBrut += ln.Brut
			totalMarge += ln.Marge
		}
	}
	bal, err := s.walletGet(ctx, in.PayerID)
	if err != nil {
		return err
	}
	if bal < totalBrut-1e-9 {
		return fmt.Errorf("solde insuffisant")
	}
	if err := s.walletPut(ctx, in.PayerID, bal-totalBrut); err != nil {
		return err
	}
	for _, ln := range in.Lines {
		if ln.Net > 0 && strings.TrimSpace(ln.SellerID) != "" {
			sb, _ := s.walletGet(ctx, ln.SellerID)
			if err := s.walletPut(ctx, ln.SellerID, sb+ln.Net); err != nil {
				return err
			}
		}
	}
	if strings.TrimSpace(in.CoopActorID) != "" && totalMarge > 0 {
		cb, _ := s.walletGet(ctx, in.CoopActorID)
		if err := s.walletPut(ctx, in.CoopActorID, cb+totalMarge); err != nil {
			return err
		}
	}
	now := time.Now().UTC().Format(time.RFC3339)
	txID := ctx.GetStub().GetTxID()
	evtType := in.EventType
	if evtType == "" {
		evtType = "paiement"
	}
	for _, ln := range in.Lines {
		raw, err := ctx.GetStub().GetState(ln.BatchID)
		if err != nil {
			return err
		}
		if raw == nil {
			return fmt.Errorf("lot introuvable: %s", ln.BatchID)
		}
		var b Batch
		if err := json.Unmarshal(raw, &b); err != nil {
			return err
		}
		if b.Statut == "en_transit" {
			return fmt.Errorf("lot %s en transit: reception non confirmee", ln.BatchID)
		}
		if b.Statut == "paye" {
			return fmt.Errorf("lot %s deja paye", ln.BatchID)
		}
		b.Statut = "paye"
		b.Timestamp = now
		newRaw, err := json.Marshal(b)
		if err != nil {
			return err
		}
		if err := ctx.GetStub().PutState(ln.BatchID, newRaw); err != nil {
			return err
		}
		meta := map[string]interface{}{
			"batch_id": ln.BatchID,
			"status":   "paye",
			"tx_hash":  txID,
		}
		metaRaw, _ := json.Marshal(meta)
		if err := ctx.GetStub().PutState(paymentMetaKey(ln.BatchID), metaRaw); err != nil {
			return err
		}
		pct := marginPctFromAmounts(ln.Brut, ln.Marge)
		comment := fmt.Sprintf(`{"montant_brut":%.2f,"marge_fcfa":%.2f,"marge_pct":%.2f,"montant_net":%.2f}`, ln.Brut, ln.Marge, pct, ln.Net)
		if err := s.appendHistory(ctx, BatchHistoryEvent{
			BatchID:      ln.BatchID,
			Type:         evtType,
			ActorID:      in.PayerID,
			TxHash:       txID,
			CreatedAtISO: now,
			Commentaire:  comment,
			Payload:      b,
		}); err != nil {
			return err
		}
	}
	return nil
}

// CreateBatch crée un nouveau lot sur le ledger.
func (s *SmartContract) CreateBatch(ctx contractapi.TransactionContextInterface, batchJSON string, actorID string) error {
	var batch Batch
	if err := json.Unmarshal([]byte(batchJSON), &batch); err != nil {
		return fmt.Errorf("JSON batch invalide: %w", err)
	}
	existing, err := ctx.GetStub().GetState(batch.ID)
	if err != nil {
		return err
	}
	if existing != nil {
		return fmt.Errorf("lot %s existe deja", batch.ID)
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Timestamp = now
	batch.Statut = "cree"

	raw, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(batch.ID, raw); err != nil {
		return err
	}
	if err := putSellerTrack(ctx, batch.ID, actorID); err != nil {
		return err
	}
	txID := ctx.GetStub().GetTxID()
	return s.appendHistory(ctx, BatchHistoryEvent{
		BatchID:      batch.ID,
		Type:         "creation",
		ActorID:      actorID,
		TxHash:       txID,
		CreatedAtISO: now,
		Payload:      batch,
	})
}

// TransferBatch transfère la propriété d'un lot.
func (s *SmartContract) TransferBatch(ctx contractapi.TransactionContextInterface, batchID, fromActorID, toActorID, commentaire string) error {
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	var batch Batch
	if err := json.Unmarshal(raw, &batch); err != nil {
		return err
	}
	if batch.Proprietaire != fromActorID {
		return fmt.Errorf("seul le proprietaire courant peut transferer")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	prev := batch.Proprietaire
	batch.Proprietaire = toActorID
	// Le destinataire doit confirmer la reception physique avant paiement / operations finales.
	batch.Statut = "en_transit"
	batch.Timestamp = now

	newRaw, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(batchID, newRaw); err != nil {
		return err
	}
	if err := putSellerTrack(ctx, batchID, fromActorID); err != nil {
		return err
	}
	txID := ctx.GetStub().GetTxID()
	return s.appendHistory(ctx, BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "transfert",
		FromActorID:  prev,
		ToActorID:    toActorID,
		Commentaire:  commentaire,
		TxHash:       txID,
		CreatedAtISO: now,
		Payload:      batch,
	})
}

// ConfirmPhysicalReceipt : le proprietaire actuel (destinataire du transfert) confirme avoir recu le lot.
func (s *SmartContract) ConfirmPhysicalReceipt(ctx contractapi.TransactionContextInterface, batchID, actorID string) error {
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	var batch Batch
	if err := json.Unmarshal(raw, &batch); err != nil {
		return err
	}
	if batch.Proprietaire != actorID {
		return fmt.Errorf("seul le destinataire (proprietaire actuel) peut confirmer la reception")
	}
	if batch.Statut != "en_transit" {
		return fmt.Errorf("le lot n'est pas en attente de reception (statut: %s)", batch.Statut)
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Statut = "recu"
	batch.Timestamp = now

	newRaw, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(batchID, newRaw); err != nil {
		return err
	}
	txID := ctx.GetStub().GetTxID()
	return s.appendHistory(ctx, BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "reception",
		ActorID:      actorID,
		TxHash:       txID,
		CreatedAtISO: now,
		Payload:      batch,
	})
}

// UpdateBatchWeight met à jour le poids d'un lot avec justification.
func (s *SmartContract) UpdateBatchWeight(ctx contractapi.TransactionContextInterface, batchID, actorID, newWeightStr, justification string) error {
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	var batch Batch
	if err := json.Unmarshal(raw, &batch); err != nil {
		return err
	}
	var newWeight float64
	if _, err := fmt.Sscanf(newWeightStr, "%f", &newWeight); err != nil || newWeight <= 0 {
		return fmt.Errorf("poids invalide: %s", newWeightStr)
	}
	if justification == "" {
		return fmt.Errorf("justification obligatoire")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Quantite = newWeight
	batch.Timestamp = now

	newRaw, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(batchID, newRaw); err != nil {
		return err
	}
	txID := ctx.GetStub().GetTxID()
	return s.appendHistory(ctx, BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "maj_poids",
		ActorID:      actorID,
		Commentaire:  justification,
		TxHash:       txID,
		CreatedAtISO: now,
		Payload:      batch,
	})
}

// MarkBatchExported marque un lot comme exporté.
func (s *SmartContract) MarkBatchExported(ctx contractapi.TransactionContextInterface, batchID, actorID string) error {
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	var batch Batch
	if err := json.Unmarshal(raw, &batch); err != nil {
		return err
	}
	if batch.Proprietaire != actorID {
		return fmt.Errorf("seul le proprietaire courant peut marquer comme exporte")
	}
	now := time.Now().UTC().Format(time.RFC3339)
	batch.Statut = "exporte"
	batch.Timestamp = now

	newRaw, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(batchID, newRaw); err != nil {
		return err
	}
	txID := ctx.GetStub().GetTxID()
	return s.appendHistory(ctx, BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "export",
		ActorID:      actorID,
		TxHash:       txID,
		CreatedAtISO: now,
		Payload:      batch,
	})
}

// GetBatch retourne un lot par son identifiant.
func (s *SmartContract) GetBatch(ctx contractapi.TransactionContextInterface, batchID string) (*Batch, error) {
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return nil, err
	}
	if raw == nil {
		return nil, fmt.Errorf("lot %s introuvable", batchID)
	}
	var batch Batch
	if err := json.Unmarshal(raw, &batch); err != nil {
		return nil, err
	}
	return &batch, nil
}

// GetHistory retourne l'historique complet d'un lot.
func (s *SmartContract) GetHistory(ctx contractapi.TransactionContextInterface, batchID string) ([]BatchHistoryEvent, error) {
	return s.readHistory(ctx, batchID)
}

// GetBatchesByOwner retourne tous les lots dont le proprietaire courant est actorID (scan LevelDB TC-…).
func (s *SmartContract) GetBatchesByOwner(ctx contractapi.TransactionContextInterface, actorID string) ([]Batch, error) {
	actorID = strings.TrimSpace(actorID)
	if actorID == "" {
		return []Batch{}, nil
	}
	iter, err := ctx.GetStub().GetStateByRange("TC-", "TC~")
	if err != nil {
		return nil, err
	}
	defer iter.Close()
	var result []Batch
	for iter.HasNext() {
		res, err := iter.Next()
		if err != nil {
			return nil, err
		}
		var b Batch
		if err := json.Unmarshal(res.Value, &b); err != nil {
			continue
		}
		if b.Proprietaire == actorID {
			result = append(result, b)
		}
	}
	if result == nil {
		result = []Batch{}
	}
	return result, nil
}

// UpdateBatch met à jour variete, parcelle, notes, poids (optionnel) avec justification.
func (s *SmartContract) UpdateBatch(ctx contractapi.TransactionContextInterface, batchID, actorID, variete, parcelle, notes, poidsStr, justification string) error {
	if strings.TrimSpace(justification) == "" {
		return fmt.Errorf("justification obligatoire")
	}
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	var batch Batch
	if err := json.Unmarshal(raw, &batch); err != nil {
		return err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	if strings.TrimSpace(variete) != "" {
		batch.Variete = variete
	}
	if strings.TrimSpace(parcelle) != "" {
		batch.Parcelle = parcelle
	}
	if strings.TrimSpace(notes) != "" {
		batch.Notes = notes
	}
	if strings.TrimSpace(poidsStr) != "" {
		var p float64
		if _, err := fmt.Sscanf(poidsStr, "%f", &p); err == nil && p > 0 {
			batch.Quantite = p
		}
	}
	batch.Timestamp = now
	newRaw, err := json.Marshal(batch)
	if err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(batchID, newRaw); err != nil {
		return err
	}
	txID := ctx.GetStub().GetTxID()
	return s.appendHistory(ctx, BatchHistoryEvent{
		BatchID:      batchID,
		Type:         "correction",
		ActorID:      actorID,
		Commentaire:  justification,
		TxHash:       txID,
		CreatedAtISO: now,
		Payload:      batch,
	})
}

// SetBatchPrice définit le prix au kg pour un lot.
func (s *SmartContract) SetBatchPrice(ctx contractapi.TransactionContextInterface, batchID, actorID, priceStr string) error {
	_ = actorID
	price, err := strconv.ParseFloat(strings.TrimSpace(priceStr), 64)
	if err != nil || price <= 0 {
		return fmt.Errorf("prix invalide")
	}
	batchRaw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if batchRaw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	raw, err := json.Marshal(price)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(priceKey(batchID), raw)
}

// GetBatchPrice retourne le prix au kg (JSON nombre ou 0).
func (s *SmartContract) GetBatchPrice(ctx contractapi.TransactionContextInterface, batchID string) (float64, error) {
	p, err := s.priceGet(ctx, batchID)
	if err != nil {
		return 0, err
	}
	return p, nil
}

// ConfirmBatchReceipt enregistre le paiement d'un lot (proprietaire = payeur).
func (s *SmartContract) ConfirmBatchReceipt(ctx contractapi.TransactionContextInterface, batchID, actorID string) error {
	raw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("lot %s introuvable", batchID)
	}
	var b Batch
	if err := json.Unmarshal(raw, &b); err != nil {
		return err
	}
	if b.Proprietaire != actorID {
		return fmt.Errorf("seul le proprietaire courant peut payer ce lot")
	}
	price, err := s.priceGet(ctx, batchID)
	if err != nil {
		return err
	}
	if price <= 0 {
		price = defaultPricePerKg
	}
	margePct, err := s.marginGet(ctx, defaultCoopOrgMargin)
	if err != nil {
		return err
	}
	brut, marge, net := brutMargeNet(price, b.Quantite, margePct)
	seller, err := readSellerID(ctx, batchID)
	if err != nil {
		return err
	}
	if strings.TrimSpace(seller) == "" {
		seller = b.Proprietaire
	}
	in := paymentInput{
		PayerID:     actorID,
		CoopActorID: defaultCoopActorID,
		TotalBrut:   brut,
		TotalMarge:  marge,
		Lines: []paymentLine{{
			BatchID:  batchID,
			SellerID: seller,
			Brut:     brut,
			Marge:    marge,
			Net:      net,
		}},
		EventType: "paiement",
	}
	return s.executePaymentCore(ctx, in)
}

// GetPaymentStatus lit le statut de paiement d'un lot.
func (s *SmartContract) GetPaymentStatus(ctx contractapi.TransactionContextInterface, batchID string) (map[string]interface{}, error) {
	raw, err := ctx.GetStub().GetState(paymentMetaKey(batchID))
	if err != nil {
		return nil, err
	}
	if raw != nil {
		var m map[string]interface{}
		if err := json.Unmarshal(raw, &m); err == nil {
			return m, nil
		}
	}
	braw, err := ctx.GetStub().GetState(batchID)
	if err != nil {
		return nil, err
	}
	if braw == nil {
		return map[string]interface{}{"batch_id": batchID, "status": "inconnu"}, nil
	}
	var b Batch
	if err := json.Unmarshal(braw, &b); err != nil {
		return map[string]interface{}{"batch_id": batchID, "status": "inconnu"}, nil
	}
	st := strings.TrimSpace(b.Statut)
	if st == "paye" {
		return map[string]interface{}{"batch_id": batchID, "status": "paye"}, nil
	}
	return map[string]interface{}{"batch_id": batchID, "status": "en_attente"}, nil
}

// CreateGroupedList enregistre une liste de lots.
func (s *SmartContract) CreateGroupedList(ctx contractapi.TransactionContextInterface, listID, batchIDsJSON, actorID string) error {
	if strings.TrimSpace(listID) == "" || strings.TrimSpace(actorID) == "" {
		return fmt.Errorf("list_id et actor_id requis")
	}
	var ids []string
	if err := json.Unmarshal([]byte(batchIDsJSON), &ids); err != nil {
		return fmt.Errorf("batch_ids JSON invalide: %w", err)
	}
	if len(ids) == 0 {
		return fmt.Errorf("la liste doit contenir au moins un lot")
	}
	raw, err := json.Marshal(ids)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(groupedListKey(listID), raw)
}

// PayGroupedList paie tous les lots d'une liste (payer = actorID).
func (s *SmartContract) PayGroupedList(ctx contractapi.TransactionContextInterface, listID, actorID string) error {
	raw, err := ctx.GetStub().GetState(groupedListKey(listID))
	if err != nil {
		return err
	}
	if raw == nil {
		return fmt.Errorf("liste introuvable")
	}
	var batchIDs []string
	if err := json.Unmarshal(raw, &batchIDs); err != nil {
		return err
	}
	margePct, err := s.marginGet(ctx, defaultCoopOrgMargin)
	if err != nil {
		return err
	}
	var lines []paymentLine
	var totalBrut, totalMarge float64
	for _, bid := range batchIDs {
		braw, err := ctx.GetStub().GetState(bid)
		if err != nil {
			return err
		}
		if braw == nil {
			return fmt.Errorf("lot introuvable: %s", bid)
		}
		var b Batch
		if err := json.Unmarshal(braw, &b); err != nil {
			return err
		}
		price, err := s.priceGet(ctx, bid)
		if err != nil {
			return err
		}
		if price <= 0 {
			price = defaultPricePerKg
		}
		brut, marge, net := brutMargeNet(price, b.Quantite, margePct)
		seller, err := readSellerID(ctx, bid)
		if err != nil {
			return err
		}
		if strings.TrimSpace(seller) == "" {
			seller = b.Proprietaire
		}
		lines = append(lines, paymentLine{
			BatchID:  bid,
			SellerID: seller,
			Brut:     brut,
			Marge:    marge,
			Net:      net,
		})
		totalBrut += brut
		totalMarge += marge
	}
	in := paymentInput{
		PayerID:     actorID,
		CoopActorID: defaultCoopActorID,
		TotalBrut:   totalBrut,
		TotalMarge:  totalMarge,
		Lines:       lines,
		EventType:   "paiement_liste",
		ListID:      listID,
	}
	return s.executePaymentCore(ctx, in)
}

// SetCooperativeMargin enregistre la marge (%) pour une organisation.
func (s *SmartContract) SetCooperativeMargin(ctx contractapi.TransactionContextInterface, orgID, marginStr, actorID string) error {
	_ = actorID
	m, err := strconv.ParseFloat(strings.TrimSpace(marginStr), 64)
	if err != nil {
		return fmt.Errorf("marge invalide")
	}
	if m < 0 || m > 100 {
		return fmt.Errorf("marge hors plage 0-100")
	}
	raw, err := json.Marshal(m)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(marginKey(orgID), raw)
}

// GetCooperativeMargin retourne la marge pour une org (JSON {"margin":…}).
func (s *SmartContract) GetCooperativeMargin(ctx contractapi.TransactionContextInterface, orgID string) (map[string]interface{}, error) {
	m, err := s.marginGet(ctx, orgID)
	if err != nil {
		return map[string]interface{}{"margin": 0.0}, nil
	}
	return map[string]interface{}{"margin": m}, nil
}

// ExecutePayment exécute un paiement multi-lignes (JSON payload API).
func (s *SmartContract) ExecutePayment(ctx contractapi.TransactionContextInterface, payloadJSON string) error {
	var in paymentInput
	if err := json.Unmarshal([]byte(payloadJSON), &in); err != nil {
		return fmt.Errorf("payload paiement invalide: %w", err)
	}
	return s.executePaymentCore(ctx, in)
}

// GetWalletBalance retourne le solde portefeuille d'un acteur.
func (s *SmartContract) GetWalletBalance(ctx contractapi.TransactionContextInterface, actorID string) (map[string]interface{}, error) {
	bal, err := s.walletGet(ctx, actorID)
	if err != nil {
		return nil, err
	}
	return map[string]interface{}{"balance": bal}, nil
}

// DepositWallet crédite le portefeuille.
func (s *SmartContract) DepositWallet(ctx contractapi.TransactionContextInterface, actorID, amountStr string) error {
	amt, err := strconv.ParseFloat(strings.TrimSpace(amountStr), 64)
	if err != nil || amt <= 0 {
		return fmt.Errorf("montant invalide")
	}
	bal, err := s.walletGet(ctx, actorID)
	if err != nil {
		return err
	}
	return s.walletPut(ctx, actorID, bal+amt)
}

// WithdrawWallet débite le portefeuille.
func (s *SmartContract) WithdrawWallet(ctx contractapi.TransactionContextInterface, actorID, amountStr string) error {
	amt, err := strconv.ParseFloat(strings.TrimSpace(amountStr), 64)
	if err != nil || amt <= 0 {
		return fmt.Errorf("montant invalide")
	}
	bal, err := s.walletGet(ctx, actorID)
	if err != nil {
		return err
	}
	if bal < amt-1e-9 {
		return fmt.Errorf("solde insuffisant")
	}
	return s.walletPut(ctx, actorID, bal-amt)
}

// GetStats retourne des statistiques globales.
func (s *SmartContract) GetStats(ctx contractapi.TransactionContextInterface) (map[string]interface{}, error) {
	return map[string]interface{}{
		"status": "ok",
		"note":   "GetStats non implemente sur le ledger; utilisez le dashboard API",
	}, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Erreur creation chaincode: %v", err)
	}
	if err := chaincode.Start(); err != nil {
		log.Panicf("Erreur demarrage chaincode: %v", err)
	}
}
