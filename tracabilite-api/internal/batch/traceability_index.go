package batch

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"tracabilite-api/pkg/models"
)

// TraceabilityIndex conserve les liens acteur ↔ lot (traçabilité après transfert).
type TraceabilityIndex interface {
	Link(ctx context.Context, actorID, batchID string) error
	LinkParticipants(ctx context.Context, batchID string, events []models.BatchHistoryEvent)
	ListBatchIDs(ctx context.Context, actorID string) ([]string, error)
}

type memoryTraceIndex struct {
	m map[string]map[string]struct{}
}

func NewMemoryTraceIndex() *memoryTraceIndex {
	return &memoryTraceIndex{m: make(map[string]map[string]struct{})}
}

func (m *memoryTraceIndex) Link(_ context.Context, actorID, batchID string) error {
	actorID = strings.TrimSpace(actorID)
	batchID = strings.TrimSpace(batchID)
	if actorID == "" || batchID == "" {
		return nil
	}
	if m.m[actorID] == nil {
		m.m[actorID] = make(map[string]struct{})
	}
	m.m[actorID][batchID] = struct{}{}
	return nil
}

func (m *memoryTraceIndex) LinkParticipants(ctx context.Context, batchID string, events []models.BatchHistoryEvent) {
	for _, e := range events {
		_ = m.Link(ctx, strings.TrimSpace(e.ActorID), batchID)
		_ = m.Link(ctx, strings.TrimSpace(e.FromActorID), batchID)
		_ = m.Link(ctx, strings.TrimSpace(e.ToActorID), batchID)
	}
}

func (m *memoryTraceIndex) ListBatchIDs(_ context.Context, actorID string) ([]string, error) {
	actorID = strings.TrimSpace(actorID)
	if actorID == "" {
		return nil, nil
	}
	ids := make([]string, 0, len(m.m[actorID]))
	for id := range m.m[actorID] {
		ids = append(ids, id)
	}
	return ids, nil
}

type pgTraceIndex struct {
	pool *pgxpool.Pool
}

func NewPGTraceIndex(pool *pgxpool.Pool) *pgTraceIndex {
	return &pgTraceIndex{pool: pool}
}

func (p *pgTraceIndex) Link(ctx context.Context, actorID, batchID string) error {
	actorID = strings.TrimSpace(actorID)
	batchID = strings.TrimSpace(batchID)
	if actorID == "" || batchID == "" {
		return nil
	}
	_, err := p.pool.Exec(ctx, `
		INSERT INTO actor_lot_traceability (actor_id, batch_id) VALUES ($1, $2)
		ON CONFLICT (actor_id, batch_id) DO NOTHING
	`, actorID, batchID)
	return err
}

func (p *pgTraceIndex) LinkParticipants(ctx context.Context, batchID string, events []models.BatchHistoryEvent) {
	batchID = strings.TrimSpace(batchID)
	if batchID == "" {
		return
	}
	for _, e := range events {
		_ = p.Link(ctx, e.ActorID, batchID)
		_ = p.Link(ctx, e.FromActorID, batchID)
		_ = p.Link(ctx, e.ToActorID, batchID)
	}
}

func (p *pgTraceIndex) ListBatchIDs(ctx context.Context, actorID string) ([]string, error) {
	actorID = strings.TrimSpace(actorID)
	if actorID == "" {
		return nil, nil
	}
	rows, err := p.pool.Query(ctx, `
		SELECT batch_id FROM actor_lot_traceability WHERE actor_id = $1 ORDER BY created_at DESC
	`, actorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func linkActorsFromEvents(idx TraceabilityIndex, batchID string, events []models.BatchHistoryEvent) {
	if idx == nil {
		return
	}
	idx.LinkParticipants(context.Background(), batchID, events)
}
