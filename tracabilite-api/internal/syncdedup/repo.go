package syncdedup

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Record struct {
	ActorID     string `json:"actor_id"`
	ClientLotID string `json:"client_lot_id"`
	LotID       string `json:"lot_id"`
	TxHash      string `json:"tx_hash"`
	CreatedAt   string `json:"created_at"`
}

type Repo interface {
	Get(ctx context.Context, actorID, clientLotID string) (Record, bool, error)
	Put(ctx context.Context, actorID, clientLotID, lotID, txHash string) error
	// CountDistinctLotIDs nombre de lots distincts ayant été synchronisés (PostgreSQL ou mémoire).
	CountDistinctLotIDs(ctx context.Context) (int64, error)
}

type MemoryRepo struct {
	m map[string]Record
}

func NewMemoryRepo() *MemoryRepo { return &MemoryRepo{m: map[string]Record{}} }

func (m *MemoryRepo) key(actorID, clientLotID string) string { return actorID + "::" + clientLotID }

func (m *MemoryRepo) Get(_ context.Context, actorID, clientLotID string) (Record, bool, error) {
	r, ok := m.m[m.key(actorID, clientLotID)]
	return r, ok, nil
}

func (m *MemoryRepo) Put(_ context.Context, actorID, clientLotID, lotID, txHash string) error {
	if actorID == "" || clientLotID == "" || lotID == "" || txHash == "" {
		return errors.New("dedup invalide")
	}
	m.m[m.key(actorID, clientLotID)] = Record{
		ActorID:     actorID,
		ClientLotID: clientLotID,
		LotID:       lotID,
		TxHash:      txHash,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
	}
	return nil
}

func (m *MemoryRepo) CountDistinctLotIDs(_ context.Context) (int64, error) {
	seen := make(map[string]struct{}, len(m.m))
	for _, r := range m.m {
		if r.LotID == "" {
			continue
		}
		seen[r.LotID] = struct{}{}
	}
	return int64(len(seen)), nil
}

type PGRepo struct {
	pool *pgxpool.Pool
}

func NewPGRepo(pool *pgxpool.Pool) *PGRepo { return &PGRepo{pool: pool} }

func (p *PGRepo) Get(ctx context.Context, actorID, clientLotID string) (Record, bool, error) {
	var r Record
	var createdAt time.Time
	err := p.pool.QueryRow(ctx, `SELECT actor_id, client_lot_id, lot_id, tx_hash, created_at FROM sync_dedup WHERE actor_id=$1 AND client_lot_id=$2`,
		actorID, clientLotID,
	).Scan(&r.ActorID, &r.ClientLotID, &r.LotID, &r.TxHash, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Record{}, false, nil
	}
	if err != nil {
		return Record{}, false, err
	}
	r.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return r, true, nil
}

func (p *PGRepo) Put(ctx context.Context, actorID, clientLotID, lotID, txHash string) error {
	if actorID == "" || clientLotID == "" || lotID == "" || txHash == "" {
		return errors.New("dedup invalide")
	}
	_, err := p.pool.Exec(ctx, `
		INSERT INTO sync_dedup (actor_id, client_lot_id, lot_id, tx_hash) VALUES ($1,$2,$3,$4)
		ON CONFLICT (actor_id, client_lot_id) DO NOTHING
	`, actorID, clientLotID, lotID, txHash)
	return err
}

func (p *PGRepo) CountDistinctLotIDs(ctx context.Context) (int64, error) {
	var n int64
	err := p.pool.QueryRow(ctx, `SELECT COUNT(DISTINCT lot_id) FROM sync_dedup`).Scan(&n)
	return n, err
}

