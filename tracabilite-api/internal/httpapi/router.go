package httpapi

import (
	"expvar"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"tracabilite-api/internal/auth"
	"tracabilite-api/pkg/models"
)

func NewRouter(handler *Handler, jwt *auth.JWTService, rdb *redis.Client) *gin.Engine {
	if os.Getenv("APP_ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(CORSMiddleware())
	r.Use(RequestLogger())

	r.GET("/health", handler.Health)
	v1 := r.Group("/api/v1")
	{
		authLimit := AuthRateLimitRedis(rdb, 20)
		v1.POST("/auth/login", authLimit, handler.Login)
		v1.POST("/auth/signup", authLimit, handler.Signup)
		v1.POST("/auth/register", auth.JWTMiddleware(jwt), auth.RequireAnyRole(models.RoleAdmin), handler.Register)
		v1.GET("/verify/:id", PublicVerifyRateLimitRedis(rdb, 100), handler.VerifyBatch)
		v1.GET("/lot/:id", handler.GetBatch) // lecture publique optionnelle
		v1.GET("/lot/:id/history", handler.GetBatchHistory)
		v1.GET("/qrcode/:id", handler.GenerateQRCode)

		protected := v1.Group("/")
		protected.Use(auth.JWTMiddleware(jwt))
		{
			protected.GET("/me", handler.Me)
			protected.POST("/auth/verify-pin", handler.VerifyPinUnlock)

			// Nouvelles routes spec v2.1
			protected.POST("/lot", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleAdmin), handler.CreateBatch)
			protected.GET("/lot/:id/qr", handler.GenerateQRCode) // CDC: /lot/{id}/qr (JWT)
			protected.POST("/transfer", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.TransferBatch)
			protected.PUT("/lot/:id/weight", auth.RequireAnyRole(models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.UpdateBatchWeight)
			protected.POST("/lot/:id/export", auth.RequireAnyRole(models.RoleExportateur, models.RoleAdmin), handler.MarkLotExported)
			protected.POST("/lot/:id/photo", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleTransformateur, models.RoleAdmin), handler.UploadLotPhoto)
			protected.POST("/sync", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleAdmin), handler.SyncOfflineLots)
			protected.GET("/dashboard/stats", auth.RequireAnyRole(models.RoleAdmin, models.RoleMinistere), handler.DashboardStats)
			protected.GET("/dashboard/recent-transfers", auth.RequireAnyRole(models.RoleAdmin), handler.RecentTransfers)
			protected.GET("/dashboard/activity-chart", auth.RequireAnyRole(models.RoleAdmin), handler.ActivityChart)
			protected.GET("/dashboard/alerts-count", auth.RequireAnyRole(models.RoleAdmin, models.RoleMinistere), handler.AlertsCount)

			protected.PUT("/lot/:id/corriger", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleAdmin), handler.CorrigerLot)
			protected.GET("/lot/:id/position", handler.GetLotPosition)
			protected.POST("/lot/:id/prix", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.SetLotPrix)
			protected.POST("/lot/:id/reception", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.ConfirmerReceptionLot)
			protected.POST("/lot/:id/confirmer", auth.RequireAnyRole(models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.ConfirmerLot)
			protected.GET("/lot/:id/paiement-preview", auth.RequireAnyRole(models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin, models.RoleAgriculteur), handler.LotPaiementPreview)
			protected.GET("/lot/:id/paiement", auth.RequireAnyRole(models.RoleAgriculteur, models.RoleCooperative, models.RoleAdmin), handler.GetLotPaiement)
			protected.GET("/eudr/:id/report", auth.RequireAnyRole(models.RoleExportateur, models.RoleAdmin), handler.EudrReport)
			protected.GET("/eudr/:id/report/pdf", auth.RequireAnyRole(models.RoleExportateur, models.RoleAdmin), handler.EudrReportPDF)
			
			protected.POST("/liste-groupee", auth.RequireAnyRole(models.RoleCooperative, models.RoleAdmin), handler.CreerListeGroupee)
			protected.POST("/liste-groupee/:id/preview", auth.RequireAnyRole(models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.PreviewListeGroupee)
			protected.POST("/liste-groupee/:id/payer", auth.RequireAnyRole(models.RoleCooperative, models.RoleTransformateur, models.RoleExportateur, models.RoleAdmin), handler.PayerListeGroupee)
			
			protected.GET("/portefeuille/solde", handler.GetPortefeuilleSolde)
			protected.POST("/portefeuille/depot", handler.PortefeuilleDepot)
			protected.POST("/portefeuille/retrait", handler.PortefeuilleRetrait)

			protected.POST("/device/register", handler.RegisterDevice)
			
			protected.POST("/admin/marge", auth.RequireAnyRole(models.RoleAdmin), handler.SetMargeCooperative)
			protected.GET("/cooperative/marge", auth.RequireAnyRole(models.RoleCooperative, models.RoleAdmin), handler.GetMargeCooperativeMe)

			// Administration systeme (CDC)
			admin := protected.Group("/admin")
			admin.Use(auth.RequireAnyRole(models.RoleAdmin))
			{
				admin.GET("/marge", handler.GetMargeCooperativeAdmin)
				admin.GET("/actors", handler.AdminListActors)
				admin.POST("/actors", handler.AdminCreateActor)
				admin.PATCH("/actors/:id", handler.AdminUpdateActor)
				admin.POST("/actors/:id/reset-pin", handler.AdminResetActorPIN)
				admin.GET("/config", handler.AdminGetConfig)
				admin.PUT("/config", handler.AdminPutConfig)
				admin.GET("/incidents", handler.AdminListIncidents)
				admin.POST("/incidents/:id/resolve", handler.AdminResolveIncident)
				admin.GET("/metrics/expvar", gin.WrapH(expvar.Handler()))
			}

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
				models.RoleExportateur,
				models.RoleAdmin,
			), handler.TransferBatch)

			protected.GET("/batch/:id", handler.GetBatch)
			protected.GET("/batch/:id/history", handler.GetBatchHistory)
			protected.GET("/actors", handler.ListActors)
			// Lots appartenant à l'acteur connecté (propriétaire courant).
			protected.GET("/actors/me/lots", handler.GetMyLots)
			protected.GET("/actors/:id/lots", auth.RequireAnyRole(models.RoleMinistere, models.RoleAdmin, models.RoleCooperative), handler.GetActorLots)
		}
	}
	return r
}
