package httpapi

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"tracabilite-api/internal/auth"
	"tracabilite-api/pkg/models"
)

func NewRouter(handler *Handler, jwt *auth.JWTService, rdb *redis.Client) *gin.Engine {
	r := gin.Default()
	r.Use(CORSMiddleware())

	r.GET("/health", handler.Health)
	v1 := r.Group("/api/v1")
	{
		v1.POST("/auth/login", handler.Login)
		v1.POST("/auth/signup", handler.Signup)
		v1.POST("/auth/register", auth.JWTMiddleware(jwt), auth.RequireAnyRole(models.RoleAdmin), handler.Register)
		v1.GET("/verify/:id", PublicVerifyRateLimitRedis(rdb, 100), handler.VerifyBatch)
		v1.GET("/lot/:id", handler.GetBatch) // lecture publique optionnelle
		v1.GET("/lot/:id/history", handler.GetBatchHistory)
		v1.GET("/qrcode/:id", handler.GenerateQRCode)

		protected := v1.Group("/")
		protected.Use(auth.JWTMiddleware(jwt))
		{
			// Nouvelles routes spec v2.1
			protected.POST("/lot", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleAdmin), handler.CreateBatch)
			protected.POST("/transfer", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleTransformateur, models.RoleDistributeur, models.RoleAdmin), handler.TransferBatch)
			protected.PUT("/lot/:id/weight", auth.RequireAnyRole(models.RoleTransformateur, models.RoleDistributeur, models.RoleAdmin), handler.UpdateBatchWeight)
			protected.POST("/lot/:id/export", auth.RequireAnyRole(models.RoleDistributeur, models.RoleAdmin), handler.MarkLotExported)
			protected.POST("/lot/:id/photo", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleTransformateur, models.RoleAdmin), handler.UploadLotPhoto)
			protected.GET("/eudr/:id/report/pdf", auth.RequireAnyRole(models.RoleDistributeur, models.RoleAdmin), handler.EUDRReportPDF)
			protected.GET("/eudr/:id/report", auth.RequireAnyRole(models.RoleDistributeur, models.RoleAdmin), handler.EUDRReport)
			protected.POST("/sync", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleAdmin), handler.SyncOfflineLots)
			protected.GET("/dashboard/stats", auth.RequireAnyRole(models.RoleAdmin), handler.DashboardStats)
			protected.GET("/dashboard/recent-transfers", auth.RequireAnyRole(models.RoleAdmin), handler.RecentTransfers)
			protected.GET("/dashboard/activity-chart", auth.RequireAnyRole(models.RoleAdmin), handler.ActivityChart)
			protected.GET("/dashboard/eudr-compliance", auth.RequireAnyRole(models.RoleAdmin), handler.EUDRCompliance)
			protected.GET("/dashboard/alerts-count", auth.RequireAnyRole(models.RoleAdmin), handler.AlertsCount)

			// Compat routes v1 precedente
			protected.POST("/batch/create", auth.RequireAnyRole(
				models.RoleAgriculteur,
				models.RoleTransformateur,
				models.RoleAdmin,
			), handler.CreateBatch)

			protected.POST("/batch/transfer", auth.RequireAnyRole(
				models.RoleAgriculteur,
				models.RoleCooperative,
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
