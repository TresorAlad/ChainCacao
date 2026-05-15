package wallet

import (
	"context"
	"errors"
	"fmt"

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
	return err
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
	return nil
}

// CreditLine crédit d'un bénéficiaire lors d'un paiement.
type CreditLine struct {
	ActorID string
	Amount  float64
}

// ApplyPayment débite le payeur et crédite les bénéficiaires (transaction atomique).
func (s *Store) ApplyPayment(ctx context.Context, payerID string, totalDebit float64, credits []CreditLine) error {
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
	}
	return tx.Commit(ctx)
}
