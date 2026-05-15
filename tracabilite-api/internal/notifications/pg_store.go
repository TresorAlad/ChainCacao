package notifications

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PGStore persiste les jetons FCM dans PostgreSQL.
type PGStore struct {
	pool *pgxpool.Pool
}

func NewPGStore(pool *pgxpool.Pool) *PGStore {
	return &PGStore{pool: pool}
}

func (s *PGStore) SaveToken(ctx context.Context, actorID, token, platform string) error {
	if actorID == "" || token == "" {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO device_tokens (actor_id, token, platform, updated_at)
		VALUES ($1, $2, $3, now())
		ON CONFLICT (actor_id, token) DO UPDATE SET
			platform = EXCLUDED.platform,
			updated_at = now()
	`, actorID, token, platform)
	return err
}

func (s *PGStore) GetTokens(ctx context.Context, actorID string) ([]string, error) {
	rows, err := s.pool.Query(ctx, `SELECT token FROM device_tokens WHERE actor_id=$1`, actorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (s *PGStore) DeleteToken(ctx context.Context, actorID, token string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM device_tokens WHERE actor_id=$1 AND token=$2`, actorID, token)
	return err
}
