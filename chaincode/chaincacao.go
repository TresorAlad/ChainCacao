package main

import (
	"encoding/json"
	"fmt"
	"log"
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

func historyKey(batchID string) string {
	return "HISTORY:" + batchID
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
	batch.Statut = "transfere"
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
		Type:         "transfert",
		FromActorID:  prev,
		ToActorID:    toActorID,
		Commentaire:  commentaire,
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
