package media

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repo struct {
	pool *pgxpool.Pool
}

func NewRepo(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) SaveLotImage(ctx context.Context, lotID, publicID, secureURL string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO lot_media (lot_id, cloudinary_public_id, secure_url) VALUES ($1,$2,$3)`,
		lotID, publicID, secureURL,
	)
	return err
}
