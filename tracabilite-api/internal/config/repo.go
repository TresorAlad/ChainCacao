package config

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo interface {
	Get(ctx context.Context) (map[string]any, error)
	Put(ctx context.Context, cfg map[string]any) error
}

type MemoryRepo struct {
	cfg map[string]any
}

func NewMemoryRepo() *MemoryRepo {
	return &MemoryRepo{cfg: map[string]any{}}
}

func (m *MemoryRepo) Get(_ context.Context) (map[string]any, error) {
	out := map[string]any{}
	for k, v := range m.cfg {
		out[k] = v
	}
	return out, nil
}

func (m *MemoryRepo) Put(_ context.Context, cfg map[string]any) error {
	if cfg == nil {
		return errors.New("config invalide")
	}
	m.cfg = cfg
	return nil
}

type PGRepo struct {
	pool *pgxpool.Pool
}

func NewPGRepo(pool *pgxpool.Pool) *PGRepo {
	return &PGRepo{pool: pool}
}

func (p *PGRepo) Get(ctx context.Context) (map[string]any, error) {
	var raw []byte
	err := p.pool.QueryRow(ctx, `SELECT data FROM system_config WHERE id=1`).Scan(&raw)
	if err != nil {
		// Pas encore initialisé => vide.
		return map[string]any{}, nil
	}
	if len(raw) == 0 {
		return map[string]any{}, nil
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		return map[string]any{}, nil
	}
	return out, nil
}

func (p *PGRepo) Put(ctx context.Context, cfg map[string]any) error {
	if cfg == nil {
		return errors.New("config invalide")
	}
	raw, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	_, err = p.pool.Exec(ctx, `
		INSERT INTO system_config (id, data) VALUES (1, $1::jsonb)
		ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data, updated_at=now()
	`, raw)
	return err
}

