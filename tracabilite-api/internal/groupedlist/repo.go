package groupedlist

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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
	Delete(ctx context.Context, listID string) error
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

func (m *MemoryRepo) Delete(_ context.Context, listID string) error {
	listID = strings.TrimSpace(listID)
	delete(m.m, listID)
	return nil
}

type PGRepo struct {
	pool *pgxpool.Pool
}

func NewPGRepo(pool *pgxpool.Pool) *PGRepo { return &PGRepo{pool: pool} }

func (p *PGRepo) Save(ctx context.Context, listID, createdBy string, batchIDs []string) error {
	listID = strings.TrimSpace(listID)
	createdBy = strings.TrimSpace(createdBy)
	if listID == "" || createdBy == "" || len(batchIDs) == 0 {
		return errors.New("liste invalide")
	}
	ids := make([]string, 0, len(batchIDs))
	for _, bid := range batchIDs {
		bid = strings.TrimSpace(bid)
		if bid != "" {
			ids = append(ids, bid)
		}
	}
	if len(ids) == 0 {
		return errors.New("liste invalide: aucun lot")
	}
	raw, err := json.Marshal(ids)
	if err != nil {
		return err
	}
	_, err = p.pool.Exec(ctx, `
		INSERT INTO grouped_lists (id, created_by, batch_ids) VALUES ($1,$2,$3::jsonb)
		ON CONFLICT (id) DO UPDATE SET batch_ids=EXCLUDED.batch_ids, created_by=EXCLUDED.created_by
	`, listID, createdBy, string(raw))
	return err
}

func (p *PGRepo) Delete(ctx context.Context, listID string) error {
	listID = strings.TrimSpace(listID)
	if listID == "" {
		return nil
	}
	_, err := p.pool.Exec(ctx, `DELETE FROM grouped_lists WHERE id=$1`, listID)
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
	if err := json.Unmarshal(rawIDs, &l.BatchIDs); err != nil {
		return List{}, fmt.Errorf("batch_ids invalides: %w", err)
	}
	if len(l.BatchIDs) == 0 {
		return List{}, errors.New("liste vide")
	}
	l.CreatedAt = created.UTC().Format(time.RFC3339)
	return l, nil
}

