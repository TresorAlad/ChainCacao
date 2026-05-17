package batch

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"tracabilite-api/internal/fabric"
	"tracabilite-api/internal/wallet"
	"tracabilite-api/pkg/models"
)

// ActorLookup verifie qu'un destinataire existe.
type ActorLookup interface {
	FindByID(ctx context.Context, id string) (models.Actor, error)
	FindByIDs(ctx context.Context, ids []string) (map[string]models.Actor, error)
}

type CreateBatchInput struct {
	ClientLotID   string  `json:"client_lot_id,omitempty"`
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
	PhotoURL      string  `json:"photo_url"`
	Notes         string  `json:"notes"`
	PayloadHash   string  `json:"payload_hash,omitempty"`
	Signature     string  `json:"signature,omitempty"`
	SignerPubKey  string  `json:"signer_pubkey,omitempty"`
}

type TransferBatchInput struct {
	BatchID     string `json:"batch_id"`
	ToActorID   string `json:"to_actor_id"`
	Commentaire string `json:"commentaire"`
}

type UpdateWeightInput struct {
	BatchID        string  `json:"batch_id"`
	NewWeight      float64 `json:"new_weight"`
	Justification  string  `json:"justification"`
}

type Service struct {
	fabricClient fabric.Client
	actors       ActorLookup
	wallets      *wallet.Store // optionnel : soldes persistants PostgreSQL
	traceIndex   TraceabilityIndex
}

func NewService(fabricClient fabric.Client, actors ActorLookup) *Service {
	return &Service{
		fabricClient: fabricClient,
		actors:       actors,
	}
}

// WithWalletStore active les opérations portefeuille sur PostgreSQL (demo persistante).
func (s *Service) WithWalletStore(store *wallet.Store) *Service {
	s.wallets = store
	return s
}

// WithTraceabilityIndex enregistre les liens acteur ↔ lot (lots transférés visibles après envoi).
func (s *Service) WithTraceabilityIndex(idx TraceabilityIndex) *Service {
	s.traceIndex = idx
	return s
}

func (s *Service) Create(ctx context.Context, input CreateBatchInput, actorID, orgID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.Culture) == "" || strings.TrimSpace(input.Lieu) == "" || strings.TrimSpace(input.DateRecolte) == "" {
		return "", models.Batch{}, errors.New("culture, lieu et date_recolte sont obligatoires")
	}
	if input.Quantite <= 0 {
		return "", models.Batch{}, errors.New("quantite doit etre superieure a 0")
	}
	// CDC: GPS obligatoire (via EXIF photo).
	if input.Latitude == 0 || input.Longitude == 0 {
		return "", models.Batch{}, errors.New("latitude et longitude sont obligatoires")
	}
	// CDC: date de recolte ne doit pas etre future (format attendu: YYYY-MM-DD).
	if t, err := time.Parse("2006-01-02", strings.TrimSpace(input.DateRecolte)); err == nil {
		today := time.Now().UTC().Truncate(24 * time.Hour)
		if t.After(today) {
			return "", models.Batch{}, errors.New("date_recolte ne peut pas etre dans le futur")
		}
	}

	batch := models.Batch{
		ID:            buildBatchID(),
		Culture:       strings.TrimSpace(input.Culture),
		Variete:       strings.TrimSpace(input.Variete),
		Quantite:      input.Quantite,
		Lieu:          strings.TrimSpace(input.Lieu),
		Latitude:      input.Latitude,
		Longitude:     input.Longitude,
		Region:        strings.TrimSpace(input.Region),
		Village:       strings.TrimSpace(input.Village),
		Parcelle:      strings.TrimSpace(input.Parcelle),
		DateRecolte:   strings.TrimSpace(input.DateRecolte),
		Proprietaire:  actorID,
		CreateurID:    actorID,
		OrgID:         orgID, // proprietaire courant (org) cote API
		PhotoURL:      strings.TrimSpace(input.PhotoURL),
		Notes:         strings.TrimSpace(input.Notes),
	}
	txHash, created, err := s.fabricClient.CreateBatch(ctx, batch, actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	created = s.enrichOwnerOrg(ctx, created)
	if s.traceIndex != nil {
		_ = s.traceIndex.Link(ctx, actorID, created.ID)
	}
	return txHash, created, nil
}

func (s *Service) Transfer(ctx context.Context, input TransferBatchInput, fromActorID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.BatchID) == "" || strings.TrimSpace(input.ToActorID) == "" {
		return "", models.Batch{}, errors.New("batch_id et to_actor_id sont obligatoires")
	}
	if input.ToActorID == fromActorID {
		return "", models.Batch{}, errors.New("transfert vers soi-meme interdit")
	}

	// Respecte la regle metier Fabric: seul le proprietaire courant peut transferer.
	current, err := s.fabricClient.GetBatch(ctx, strings.TrimSpace(input.BatchID))
	if err != nil {
		return "", models.Batch{}, err
	}
	if current.Proprietaire != fromActorID {
		return "", models.Batch{}, errors.New("seul le proprietaire courant peut transferer")
	}
	if strings.EqualFold(strings.TrimSpace(current.Statut), "en_transit") {
		return "", models.Batch{}, errors.New("le destinataire doit d'abord confirmer la reception physique du lot avant de le transferer")
	}

	toActor, err := s.actors.FindByID(ctx, input.ToActorID)
	if err != nil {
		return "", models.Batch{}, errors.New("destinataire invalide")
	}
	txHash, updated, err := s.fabricClient.TransferBatch(ctx, strings.TrimSpace(input.BatchID), fromActorID, input.ToActorID, strings.TrimSpace(input.Commentaire))
	if err != nil {
		return "", models.Batch{}, err
	}
	// Harmonisation API: org proprietaire derive de l'acteur proprietaire (destinataire).
	updated.OrgID = toActor.OrgID
	if s.traceIndex != nil {
		bid := strings.TrimSpace(input.BatchID)
		_ = s.traceIndex.Link(ctx, fromActorID, bid)
		_ = s.traceIndex.Link(ctx, input.ToActorID, bid)
	}
	return txHash, updated, nil
}

func (s *Service) GetBatch(ctx context.Context, id string) (models.Batch, error) {
	b, err := s.fabricClient.GetBatch(ctx, id)
	if err != nil {
		return models.Batch{}, err
	}
	return s.enrichOwnerOrg(ctx, b), nil
}

func (s *Service) GetHistory(ctx context.Context, id string) ([]models.BatchHistoryEvent, error) {
	events, err := s.fabricClient.GetHistory(ctx, id)
	if err != nil {
		return nil, err
	}
	if !historyHasPayment(events) && s.wallets != nil {
		txs, wErr := s.wallets.ListTransactionsForLot(ctx, id)
		if wErr == nil && len(txs) > 0 {
			events = mergeWalletPaymentHistory(id, events, txs)
		}
	}
	linkActorsFromEvents(s.traceIndex, strings.TrimSpace(id), events)
	return events, nil
}

func (s *Service) UpdateBatch(ctx context.Context, input map[string]any, batchID, actorID string) (string, models.Batch, error) {
	if strings.TrimSpace(batchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	justification, _ := input["justification"].(string)
	if justification == "" {
		return "", models.Batch{}, errors.New("justification obligatoire")
	}
	var variete, parcelle, notes string
	var poids float64
	if v, ok := input["variete"].(string); ok { variete = v }
	if p, ok := input["parcelle"].(string); ok { parcelle = p }
	if n, ok := input["notes"].(string); ok { notes = n }
	if w, ok := input["poids"].(float64); ok { poids = w }

	txHash, updated, err := s.fabricClient.UpdateBatch(ctx, batchID, actorID, variete, parcelle, notes, poids, justification)
	if err != nil {
		return "", models.Batch{}, err
	}
	updated = s.enrichOwnerOrg(ctx, updated)
	return txHash, updated, nil
}

func (s *Service) SetBatchPrice(ctx context.Context, batchID, actorID string, price float64) (string, error) {
	if price <= 0 {
		return "", errors.New("le prix doit etre superieur a 0")
	}
	return s.fabricClient.SetBatchPrice(ctx, batchID, actorID, price)
}

func (s *Service) GetBatchPricePerKg(ctx context.Context, batchID string) (float64, error) {
	return s.fabricClient.GetBatchPrice(ctx, batchID)
}

func (s *Service) ConfirmPhysicalReceipt(ctx context.Context, batchID, actorID string, poidsConstate float64) (string, models.Batch, error) {
	batchID = strings.TrimSpace(batchID)
	txHash, updated, err := s.fabricClient.ConfirmPhysicalReceipt(ctx, batchID, actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	if poidsConstate > 0 {
		wTx, wUpdated, wErr := s.fabricClient.UpdateBatchWeight(
			ctx, batchID, actorID, poidsConstate, "poids constate a la reception",
		)
		if wErr == nil {
			txHash = wTx
			updated = wUpdated
		}
	}
	updated = s.enrichOwnerOrg(ctx, updated)
	if s.traceIndex != nil {
		_ = s.traceIndex.Link(ctx, actorID, batchID)
	}
	return txHash, updated, nil
}

func (s *Service) ConfirmBatchReceipt(ctx context.Context, batchID, actorID string) (string, error) {
	return s.fabricClient.ConfirmBatchReceipt(ctx, batchID, actorID)
}

func (s *Service) GetPaymentStatus(ctx context.Context, batchID string) (map[string]any, error) {
	return s.fabricClient.GetPaymentStatus(ctx, batchID)
}

func (s *Service) GetGroupedListBatchIDs(ctx context.Context, listID string) ([]string, error) {
	return s.fabricClient.GetGroupedList(ctx, strings.TrimSpace(listID))
}

func (s *Service) CreateGroupedList(ctx context.Context, listID string, batchIDs []string, actorID string) (string, error) {
	if len(batchIDs) == 0 {
		return "", errors.New("la liste doit contenir au moins un lot")
	}
	return s.fabricClient.CreateGroupedList(ctx, listID, batchIDs, actorID)
}

func (s *Service) PayGroupedList(ctx context.Context, listID, actorID string) (string, error) {
	return s.fabricClient.PayGroupedList(ctx, listID, actorID)
}

func (s *Service) SetCooperativeMargin(ctx context.Context, orgID string, margin float64, actorID string) (string, error) {
	if margin < 0 || margin > 100 {
		return "", errors.New("marge invalide")
	}
	return s.fabricClient.SetCooperativeMargin(ctx, orgID, margin, actorID)
}

func (s *Service) GetWalletBalance(ctx context.Context, actorID string) (float64, error) {
	if s.wallets != nil {
		return s.wallets.GetBalance(ctx, actorID)
	}
	return s.fabricClient.GetWalletBalance(ctx, actorID)
}

func (s *Service) DepositWallet(ctx context.Context, actorID string, amount float64) (string, error) {
	if amount <= 0 {
		return "", errors.New("montant de depot invalide")
	}
	if s.wallets != nil {
		if err := s.wallets.Deposit(ctx, actorID, amount); err != nil {
			return "", err
		}
		return "pg-wallet-deposit", nil
	}
	return s.fabricClient.DepositWallet(ctx, actorID, amount)
}

func (s *Service) ListWalletTransactions(ctx context.Context, actorID string, limit int) ([]wallet.Transaction, error) {
	if s.wallets == nil {
		return []wallet.Transaction{}, nil
	}
	return s.wallets.ListTransactions(ctx, actorID, limit)
}

func (s *Service) WithdrawWallet(ctx context.Context, actorID string, amount float64) (string, error) {
	if amount <= 0 {
		return "", errors.New("montant de retrait invalide")
	}
	if s.wallets != nil {
		if err := s.wallets.Withdraw(ctx, actorID, amount); err != nil {
			return "", err
		}
		return "pg-wallet-withdraw", nil
	}
	return s.fabricClient.WithdrawWallet(ctx, actorID, amount)
}

func (s *Service) UpdateWeight(ctx context.Context, input UpdateWeightInput, actorID string) (string, models.Batch, error) {
	if strings.TrimSpace(input.BatchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	if strings.TrimSpace(input.Justification) == "" {
		return "", models.Batch{}, errors.New("justification obligatoire")
	}
	txHash, updated, err := s.fabricClient.UpdateBatchWeight(ctx, strings.TrimSpace(input.BatchID), actorID, input.NewWeight, strings.TrimSpace(input.Justification))
	if err != nil {
		return "", models.Batch{}, err
	}
	updated = s.enrichOwnerOrg(ctx, updated)
	return txHash, updated, nil
}

func (s *Service) MarkExported(ctx context.Context, batchID, actorID string) (string, models.Batch, error) {
	if strings.TrimSpace(batchID) == "" {
		return "", models.Batch{}, errors.New("batch_id obligatoire")
	}
	current, err := s.fabricClient.GetBatch(ctx, strings.TrimSpace(batchID))
	if err != nil {
		return "", models.Batch{}, err
	}
	if current.Proprietaire != actorID {
		return "", models.Batch{}, errors.New("seul le proprietaire courant peut marquer comme exporte")
	}
	txHash, updated, err := s.fabricClient.MarkBatchExported(ctx, strings.TrimSpace(batchID), actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	updated = s.enrichOwnerOrg(ctx, updated)
	return txHash, updated, nil
}

// GetMyLots renvoie les lots en possession de l'acteur et ceux auxquels il a participé (traçabilité après transfert).
func (s *Service) GetMyLots(ctx context.Context, actorID string) ([]models.Batch, error) {
	batches, err := s.fabricClient.GetBatchesByOwner(ctx, actorID)
	if err != nil {
		if IsLedgerTransportError(err) {
			log.Printf("[batch.GetMyLots] ledger_indisponible actor_id=%s: %v", actorID, err)
			return nil, fmt.Errorf("ledger indisponible (Hyperledger Fabric injoignable) : %w", err)
		}
		return nil, err
	}
	merged, err := s.mergeTraceabilityLots(ctx, actorID, batches)
	if err != nil {
		return nil, err
	}
	return s.enrichBatchesOrg(ctx, merged), nil
}

func (s *Service) mergeTraceabilityLots(ctx context.Context, actorID string, fromFabric []models.Batch) ([]models.Batch, error) {
	seen := make(map[string]struct{}, len(fromFabric)+8)
	out := make([]models.Batch, 0, len(fromFabric)+8)
	add := func(b models.Batch) {
		id := strings.TrimSpace(b.ID)
		if id == "" {
			return
		}
		if _, ok := seen[id]; ok {
			return
		}
		seen[id] = struct{}{}
		out = append(out, b)
	}
	for _, b := range fromFabric {
		add(b)
	}
	if s.traceIndex == nil {
		return out, nil
	}
	ids, err := s.traceIndex.ListBatchIDs(ctx, actorID)
	if err != nil {
		log.Printf("[batch.GetMyLots] trace_index list actor_id=%s: %v", actorID, err)
		return out, nil
	}
	for _, id := range ids {
		if _, ok := seen[id]; ok {
			continue
		}
		b, err := s.fabricClient.GetBatch(ctx, id)
		if err != nil {
			continue
		}
		add(b)
	}
	return out, nil
}


func (s *Service) GetStats(ctx context.Context) map[string]any {
	return NormalizeDashboardStats(s.fabricClient.GetStats(ctx))
}

func (s *Service) GetRecentTransfers(ctx context.Context) ([]map[string]any, error) {
	return s.fabricClient.GetRecentTransfers(ctx)
}

func (s *Service) GetActivityChart(ctx context.Context) ([]map[string]any, error) {
	return s.fabricClient.GetActivityChart(ctx)
}

func (s *Service) GetAlertsCount(ctx context.Context) (map[string]any, error) {
	return s.fabricClient.GetAlertsCount(ctx)
}

func (s *Service) enrichOwnerOrg(ctx context.Context, b models.Batch) models.Batch {
	enriched := s.enrichBatchesOrg(ctx, []models.Batch{b})
	if len(enriched) == 0 {
		return b
	}
	return enriched[0]
}

func (s *Service) enrichBatchesOrg(ctx context.Context, batches []models.Batch) []models.Batch {
	if len(batches) == 0 {
		return batches
	}
	ids := make([]string, 0, len(batches))
	seen := make(map[string]struct{})
	for _, b := range batches {
		if b.Proprietaire == "" {
			continue
		}
		if _, ok := seen[b.Proprietaire]; ok {
			continue
		}
		seen[b.Proprietaire] = struct{}{}
		ids = append(ids, b.Proprietaire)
	}
	actorsByID, err := s.actors.FindByIDs(ctx, ids)
	if err != nil {
		return batches
	}
	out := make([]models.Batch, len(batches))
	for i, b := range batches {
		if a, ok := actorsByID[b.Proprietaire]; ok {
			b.OrgID = a.OrgID
		}
		out[i] = b
	}
	return out
}

var (
	batchIDMu   sync.Mutex
	lastBatchDate string
	batchSeq    uint32
)

// buildBatchID génère un ID ledger avec préfixe TC- (aligné sur GetBatchesByOwner du chaincode : range TC-…TC~).
func buildBatchID() string {
	datePart := time.Now().UTC().Format("20060102")
	batchIDMu.Lock()
	defer batchIDMu.Unlock()
	if lastBatchDate != datePart {
		lastBatchDate = datePart
		batchSeq = uint32(time.Now().UTC().UnixNano() % 100000)
	}
	batchSeq++
	if batchSeq >= 100000 {
		batchSeq = 1
	}
	return fmt.Sprintf("TC-%s-%05d", datePart, batchSeq)
}
