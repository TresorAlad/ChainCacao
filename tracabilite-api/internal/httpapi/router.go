package httpapi

import (
	"github.com/gin-gonic/gin"
	"tracabilite-api/internal/auth"
	"tracabilite-api/pkg/models"
)

func NewRouter(handler *Handler, jwt *auth.JWTService) *gin.Engine {
	r := gin.Default()

	r.GET("/health", handler.Health)
	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/login", handler.Login)
		v1.GET("/verify/:id", handler.VerifyBatch)

		protected := v1.Group("/")
		protected.Use(auth.JWTMiddleware(jwt))
		{
			protected.POST("/batch/create", auth.RequireAnyRole(
				models.RoleAgriculteur,
				models.RoleTransformateur,
				models.RoleAdmin,
			), handler.CreateBatch)

			protected.POST("/batch/transfer", auth.RequireAnyRole(
				models.RoleAgriculteur,
				models.RoleTransformateur,
				models.RoleDistributeur,
				models.RoleAdmin,
			), handler.TransferBatch)

			protected.GET("/batch/:id", handler.GetBatch)
			protected.GET("/batch/:id/history", handler.GetBatchHistory)
			protected.GET("/actors", handler.ListActors)
		}
	}
	return r
}
