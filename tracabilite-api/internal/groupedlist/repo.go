package groupedlist

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type List struct {
	ID        string   `json:"id"`
	CreatedBy string   `json:"created_by"`
	BatchIDs  []string `json:"batch_ids"`
	CreatedAt string   `json:"created_at"`
}

type Repo interface {
	Save(ctx context.Context, listID, createdBy string, batchIDs []string) error
	Get(ctx context.Context, listID string) (List, error)
}

type MemoryRepo struct {
	m map[string]List
}

func NewMemoryRepo() *MemoryRepo { return &MemoryRepo{m: map[string]List{}} }

func (m *MemoryRepo) Save(_ context.Context, listID, createdBy string, batchIDs []string) error {
	if listID == "" || createdBy == "" || len(batchIDs) == 0 {
		return errors.New("liste invalide")
	}
	m.m[listID] = List{
		ID:        listID,
		CreatedBy: createdBy,
		BatchIDs:  append([]string{}, batchIDs...),
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	return nil
}

func (m *MemoryRepo) Get(_ context.Context, listID string) (List, error) {
	listID = strings.TrimSpace(listID)
	l, ok := m.m[listID]
	if !ok {
		return List{}, errors.New("liste introuvable")
	}
	return l, nil
}

type PGRepo struct {
	pool *pgxpool.Pool
}

func NewPGRepo(pool *pgxpool.Pool) *PGRepo { return &PGRepo{pool: pool} }

func (p *PGRepo) Save(ctx context.Context, listID, createdBy string, batchIDs []string) error {
	if listID == "" || createdBy == "" || len(batchIDs) == 0 {
		return errors.New("liste invalide")
	}
	raw, _ := json.Marshal(batchIDs)
	_, err := p.pool.Exec(ctx, `
		INSERT INTO grouped_lists (id, created_by, batch_ids) VALUES ($1,$2,$3::jsonb)
		ON CONFLICT (id) DO UPDATE SET batch_ids=EXCLUDED.batch_ids, created_by=EXCLUDED.created_by
	`, listID, createdBy, raw)
	return err
}

func (p *PGRepo) Get(ctx context.Context, listID string) (List, error) {
	listID = strings.TrimSpace(listID)
	var (
		l        List
		rawIDs   []byte
		created  time.Time
	)
	err := p.pool.QueryRow(ctx, `SELECT id, created_by, batch_ids, created_at FROM grouped_lists WHERE id=$1`, listID).
		Scan(&l.ID, &l.CreatedBy, &rawIDs, &created)
	if errors.Is(err, pgx.ErrNoRows) {
		return List{}, errors.New("liste introuvable")
	}
	if err != nil {
		return List{}, err
	}
	_ = json.Unmarshal(rawIDs, &l.BatchIDs)
	l.CreatedAt = created.UTC().Format(time.RFC3339)
	return l, nil
}

