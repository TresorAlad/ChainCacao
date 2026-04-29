package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"tracabilite-api/pkg/models"
)

const (
	ContextActorID = "actor_id"
	ContextOrgID   = "org_id"
	ContextRole    = "role"
)

func JWTMiddleware(jwtService *JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization manquant"})
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "format authorization invalide"})
			return
		}

		claims, err := jwtService.Parse(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token invalide"})
			return
		}
		c.Set(ContextActorID, claims.ActorID)
		c.Set(ContextOrgID, claims.OrgID)
		c.Set(ContextRole, claims.Role)
		c.Next()
	}
}

func RequireAnyRole(roles ...models.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawRole, exists := c.Get(ContextRole)
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "role absent du contexte"})
			return
		}
		currentRole, ok := rawRole.(models.Role)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "role invalide"})
			return
		}
		for _, r := range roles {
			if r == currentRole {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "droits insuffisants"})
	}
}
