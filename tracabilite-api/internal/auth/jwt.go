package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"tracabilite-api/pkg/models"
)

const defaultJWTDuration = 8 * time.Hour

type Claims struct {
	ActorID string      `json:"actor_id"`
	OrgID   string      `json:"org_id"`
	Role    models.Role `json:"role"`
	jwt.RegisteredClaims
}

type JWTService struct {
	secret []byte
}

func NewJWTService() *JWTService {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "change-me-in-production"
	}
	return &JWTService{secret: []byte(secret)}
}

func (s *JWTService) Generate(actorID, orgID string, role models.Role) (string, error) {
	now := time.Now()
	claims := Claims{
		ActorID: actorID,
		OrgID:   orgID,
		Role:    role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(defaultJWTDuration)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *JWTService) Parse(raw string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(raw, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("methode de signature invalide")
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("token invalide")
	}
	return claims, nil
}
