package wallet

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Store persiste les soldes portefeuille (demo) en PostgreSQL.
type Store struct {
	pool *pgxpool.Pool
}

func NewPGStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) GetBalance(ctx context.Context, actorID string) (float64, error) {
	var bal float64
	err := s.pool.QueryRow(ctx, `SELECT balance FROM actor_wallets WHERE actor_id = $1`, actorID).Scan(&bal)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, nil
		}
		return 0, err
	}
	return bal, nil
}

func (s *Store) Deposit(ctx context.Context, actorID string, amount float64) error {
	if amount <= 0 {
		return errors.New("montant de depot invalide")
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO actor_wallets (actor_id, balance, updated_at)
		VALUES ($1, $2, now())
		ON CONFLICT (actor_id) DO UPDATE
		SET balance = actor_wallets.balance + EXCLUDED.balance,
		    updated_at = now()
	`, actorID, amount)
	if err != nil {
		return err
	}
	return s.insertTransaction(ctx, nil, actorID, "depot", amount, "", "", "", "")
}

func (s *Store) Withdraw(ctx context.Context, actorID string, amount float64) error {
	if amount <= 0 {
		return errors.New("montant de retrait invalide")
	}
	tag, err := s.pool.Exec(ctx, `
		UPDATE actor_wallets
		SET balance = balance - $2, updated_at = now()
		WHERE actor_id = $1 AND balance >= $2
	`, actorID, amount)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		bal, _ := s.GetBalance(ctx, actorID)
		if bal < amount {
			return errors.New("solde insuffisant")
		}
		return fmt.Errorf("retrait impossible pour %s", actorID)
	}
	return s.insertTransaction(ctx, nil, actorID, "retrait", -amount, "", "", "", "")
}

// CreditLine crédit d'un bénéficiaire lors d'un paiement.
type CreditLine struct {
	ActorID string
	Amount  float64
	LotID   string
	Kind    string // paiement_recu, marge_coop
}

// PaymentMeta métadonnées pour l'historique portefeuille du payeur.
type PaymentMeta struct {
	EventType string
	ListID    string
	LotID     string
}

// Transaction ligne d'historique portefeuille.
type Transaction struct {
	ID             int64     `json:"id"`
	ActorID        string    `json:"actor_id"`
	Kind           string    `json:"kind"`
	Amount         float64   `json:"amount"`
	CounterpartyID string    `json:"counterparty_id,omitempty"`
	LotID          string    `json:"lot_id,omitempty"`
	ListID         string    `json:"list_id,omitempty"`
	Reference      string    `json:"reference,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

func (s *Store) insertTransaction(ctx context.Context, tx pgx.Tx, actorID, kind string, amount float64, counterparty, lotID, listID, ref string) error {
	q := `
		INSERT INTO wallet_transactions (actor_id, kind, amount, counterparty_id, lot_id, list_id, reference)
		VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''))
	`
	args := []any{actorID, kind, amount, counterparty, lotID, listID, ref}
	if tx != nil {
		_, err := tx.Exec(ctx, q, args...)
		return err
	}
	_, err := s.pool.Exec(ctx, q, args...)
	return err
}

// ApplyPayment débite le payeur et crédite les bénéficiaires (transaction atomique).
func (s *Store) ApplyPayment(ctx context.Context, payerID string, totalDebit float64, credits []CreditLine, meta PaymentMeta) error {
	if payerID == "" || totalDebit <= 0 {
		return errors.New("paiement invalide")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var bal float64
	err = tx.QueryRow(ctx, `SELECT balance FROM actor_wallets WHERE actor_id = $1 FOR UPDATE`, payerID).Scan(&bal)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errors.New("solde insuffisant")
		}
		return err
	}
	if bal < totalDebit {
		return errors.New("solde insuffisant")
	}
	if _, err := tx.Exec(ctx, `
		UPDATE actor_wallets SET balance = balance - $2, updated_at = now() WHERE actor_id = $1
	`, payerID, totalDebit); err != nil {
		return err
	}
	payerKind := "paiement_envoye"
	if meta.EventType == "paiement_liste" {
		payerKind = "paiement_liste_envoye"
	}
	if err := s.insertTransaction(ctx, tx, payerID, payerKind, -totalDebit, "", meta.LotID, meta.ListID, meta.EventType); err != nil {
		return err
	}
	for _, c := range credits {
		if c.ActorID == "" || c.Amount <= 0 {
			continue
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO actor_wallets (actor_id, balance, updated_at)
			VALUES ($1, $2, now())
			ON CONFLICT (actor_id) DO UPDATE
			SET balance = actor_wallets.balance + EXCLUDED.balance,
			    updated_at = now()
		`, c.ActorID, c.Amount); err != nil {
			return err
		}
		kind := c.Kind
		if kind == "" {
			kind = "paiement_recu"
		}
		if err := s.insertTransaction(ctx, tx, c.ActorID, kind, c.Amount, payerID, c.LotID, meta.ListID, meta.EventType); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ReversePayment annule un ApplyPayment (Fabric échoué après débit PG).
func (s *Store) ReversePayment(ctx context.Context, payerID string, totalDebit float64, credits []CreditLine, meta PaymentMeta) error {
	if payerID == "" || totalDebit <= 0 {
		return errors.New("annulation paiement invalide")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `
		INSERT INTO actor_wallets (actor_id, balance, updated_at)
		VALUES ($1, $2, now())
		ON CONFLICT (actor_id) DO UPDATE
		SET balance = actor_wallets.balance + EXCLUDED.balance, updated_at = now()
	`, payerID, totalDebit); err != nil {
		return err
	}
	if err := s.insertTransaction(ctx, tx, payerID, "paiement_annule", totalDebit, "", meta.LotID, meta.ListID, "rollback:"+meta.EventType); err != nil {
		return err
	}
	for _, c := range credits {
		if c.ActorID == "" || c.Amount <= 0 {
			continue
		}
		tag, err := tx.Exec(ctx, `
			UPDATE actor_wallets SET balance = balance - $2, updated_at = now()
			WHERE actor_id = $1 AND balance >= $2
		`, c.ActorID, c.Amount)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return fmt.Errorf("annulation impossible pour %s", c.ActorID)
		}
		if err := s.insertTransaction(ctx, tx, c.ActorID, "paiement_annule", -c.Amount, payerID, c.LotID, meta.ListID, "rollback"); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ListTransactions historique récent pour un acteur.
func (s *Store) ListTransactions(ctx context.Context, actorID string, limit int) ([]Transaction, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id, actor_id, kind, amount, COALESCE(counterparty_id,''), COALESCE(lot_id,''),
		       COALESCE(list_id,''), COALESCE(reference,''), created_at
		FROM wallet_transactions
		WHERE actor_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`, actorID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.ActorID, &t.Kind, &t.Amount, &t.CounterpartyID, &t.LotID, &t.ListID, &t.Reference, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// ListTransactionsForLot crédits paiement enregistrés en PostgreSQL pour un lot.
func (s *Store) ListTransactionsForLot(ctx context.Context, lotID string) ([]Transaction, error) {
	lotID = strings.TrimSpace(lotID)
	if lotID == "" {
		return nil, nil
	}
	rows, err := s.pool.Query(ctx, `
		SELECT id, actor_id, kind, amount, COALESCE(counterparty_id,''), COALESCE(lot_id,''),
		       COALESCE(list_id,''), COALESCE(reference,''), created_at
		FROM wallet_transactions
		WHERE lot_id = $1 AND kind IN ('paiement_recu')
		ORDER BY created_at ASC
	`, lotID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.ActorID, &t.Kind, &t.Amount, &t.CounterpartyID, &t.LotID, &t.ListID, &t.Reference, &t.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}
