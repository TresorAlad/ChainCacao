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

const sessionJWTCookie = "chaincacao_jwt"

func JWTMiddleware(jwtService *JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := ""
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
				raw = parts[1]
			}
		}
		if raw == "" {
			if cookie, err := c.Cookie(sessionJWTCookie); err == nil && cookie != "" {
				raw = cookie
			}
		}
		if raw == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "error": "authorization manquant"})
			return
		}

		claims, err := jwtService.Parse(raw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "error": "token invalide"})
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
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "error": "role absent du contexte"})
			return
		}
		currentRole, ok := rawRole.(models.Role)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "error": "role invalide"})
			return
		}
		for _, r := range roles {
			if r == currentRole {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "error": "droits insuffisants"})
	}
}
