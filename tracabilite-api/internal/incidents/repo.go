package incidents

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Incident struct {
	ID        string         `json:"id"`
	Type      string         `json:"type"`
	Payload   map[string]any `json:"payload"`
	Status    string         `json:"status"`
	ErrorMsg  string         `json:"error,omitempty"`
	CreatedAt string         `json:"created_at"`
}

type Repo interface {
	Create(ctx context.Context, typ string, payload map[string]any, errMsg string) (Incident, error)
	ListOpen(ctx context.Context) ([]Incident, error)
	MarkResolved(ctx context.Context, id string) error
}

type MemoryRepo struct {
	items []Incident
}

func NewMemoryRepo() *MemoryRepo { return &MemoryRepo{} }

func (m *MemoryRepo) Create(_ context.Context, typ string, payload map[string]any, errMsg string) (Incident, error) {
	it := Incident{
		ID:        uuid.NewString(),
		Type:      typ,
		Payload:   payload,
		Status:    "open",
		ErrorMsg:  errMsg,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	m.items = append(m.items, it)
	return it, nil
}

func (m *MemoryRepo) ListOpen(_ context.Context) ([]Incident, error) {
	var out []Incident
	for _, it := range m.items {
		if it.Status == "open" {
			out = append(out, it)
		}
	}
	return out, nil
}

func (m *MemoryRepo) MarkResolved(_ context.Context, id string) error {
	for i := range m.items {
		if m.items[i].ID == id {
			m.items[i].Status = "resolved"
			return nil
		}
	}
	return errors.New("incident introuvable")
}

type PGRepo struct {
	pool *pgxpool.Pool
}

func NewPGRepo(pool *pgxpool.Pool) *PGRepo { return &PGRepo{pool: pool} }

func (p *PGRepo) Create(ctx context.Context, typ string, payload map[string]any, errMsg string) (Incident, error) {
	raw, _ := json.Marshal(payload)
	id := uuid.NewString()
	_, err := p.pool.Exec(ctx, `INSERT INTO incidents (id, type, payload, status, error, created_at) VALUES ($1,$2,$3::jsonb,'open',$4,now())`,
		id, typ, raw, errMsg,
	)
	if err != nil {
		return Incident{}, err
	}
	return Incident{ID: id, Type: typ, Payload: payload, Status: "open", ErrorMsg: errMsg, CreatedAt: time.Now().UTC().Format(time.RFC3339)}, nil
}

func (p *PGRepo) ListOpen(ctx context.Context) ([]Incident, error) {
	rows, err := p.pool.Query(ctx, `SELECT id, type, payload, status, COALESCE(error,''), created_at FROM incidents WHERE status='open' ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Incident
	for rows.Next() {
		var (
			id, typ, status, errMsg string
			payloadRaw              []byte
			createdAt               time.Time
		)
		if err := rows.Scan(&id, &typ, &payloadRaw, &status, &errMsg, &createdAt); err != nil {
			return nil, err
		}
		var payload map[string]any
		_ = json.Unmarshal(payloadRaw, &payload)
		out = append(out, Incident{
			ID:        id,
			Type:      typ,
			Payload:   payload,
			Status:    status,
			ErrorMsg:  errMsg,
			CreatedAt: createdAt.UTC().Format(time.RFC3339),
		})
	}
	return out, rows.Err()
}

func (p *PGRepo) MarkResolved(ctx context.Context, id string) error {
	ct, err := p.pool.Exec(ctx, `UPDATE incidents SET status='resolved', resolved_at=now() WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("incident introuvable")
	}
	return nil
}

