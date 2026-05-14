package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"tracabilite-api/internal/fabric"
	"tracabilite-api/pkg/models"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("FABRIC_PROXY_PORT")
	if port == "" {
		port = "8787"
	}
	sharedToken := os.Getenv("FABRIC_PROXY_TOKEN")
	if sharedToken == "" {
		log.Fatal("FABRIC_PROXY_TOKEN requis (secret partage Render -> EC2)")
	}

	// Le proxy tourne sur EC2, donc on parle à Fabric en direct via Gateway
	// (USE_INMEMORY_FABRIC doit être false + variables FABRIC_* présentes).
	fc, err := fabric.NewGatewayClientFromEnv()
	if err != nil {
		log.Fatalf("fabric gateway: %v", err)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		if c.GetHeader("X-Proxy-Token") != sharedToken {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Next()
	})

	v1 := r.Group("/v1/fabric")
	{
		v1.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

		v1.POST("/batch/create", func(c *gin.Context) {
			var req struct {
				Batch   models.Batch `json:"batch"`
				ActorID string       `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.ActorID == "" || req.Batch.ID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch.id et actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, b, err := fc.CreateBatch(ctx, req.Batch, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx, "batch": b})
		})

		v1.POST("/batch/transfer", func(c *gin.Context) {
			var req struct {
				BatchID     string `json:"batch_id"`
				FromActorID string `json:"from_actor_id"`
				ToActorID   string `json:"to_actor_id"`
				Commentaire string `json:"commentaire"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.FromActorID == "" || req.ToActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id, from_actor_id, to_actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, b, err := fc.TransferBatch(ctx, req.BatchID, req.FromActorID, req.ToActorID, req.Commentaire)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx, "batch": b})
		})

		v1.POST("/batch/confirm-reception", func(c *gin.Context) {
			var req struct {
				BatchID string `json:"batch_id"`
				ActorID string `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.ActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id et actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, b, err := fc.ConfirmPhysicalReceipt(ctx, req.BatchID, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx, "batch": b})
		})

		v1.POST("/batch/weight", func(c *gin.Context) {
			var req struct {
				BatchID        string  `json:"batch_id"`
				ActorID        string  `json:"actor_id"`
				NewWeight      float64 `json:"new_weight"`
				Justification  string  `json:"justification"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.ActorID == "" || req.NewWeight <= 0 || req.Justification == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id, actor_id, new_weight, justification requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, b, err := fc.UpdateBatchWeight(ctx, req.BatchID, req.ActorID, req.NewWeight, req.Justification)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx, "batch": b})
		})

		v1.POST("/batch/export", func(c *gin.Context) {
			var req struct {
				BatchID string `json:"batch_id"`
				ActorID string `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.ActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id et actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, b, err := fc.MarkBatchExported(ctx, req.BatchID, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx, "batch": b})
		})

		v1.GET("/batch/:id", func(c *gin.Context) {
			id := c.Param("id")
			ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
			defer cancel()
			b, err := fc.GetBatch(ctx, id)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "batch": b})
		})

		v1.GET("/batch/:id/history", func(c *gin.Context) {
			id := c.Param("id")
			ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
			defer cancel()
			ev, err := fc.GetHistory(ctx, id)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "events": ev})
		})

		v1.GET("/batch/:id/price", func(c *gin.Context) {
			id := c.Param("id")
			ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
			defer cancel()
			p, err := fc.GetBatchPrice(ctx, id)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "price": p})
		})

		v1.GET("/batch/:id/payment", func(c *gin.Context) {
			id := c.Param("id")
			ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
			defer cancel()
			st, err := fc.GetPaymentStatus(ctx, id)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, st)
		})

		v1.GET("/batches/owner/:actorID", func(c *gin.Context) {
			aid := c.Param("actorID")
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			list, err := fc.GetBatchesByOwner(ctx, aid)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "batches": list})
		})

		v1.POST("/batch/update", func(c *gin.Context) {
			var req struct {
				BatchID       string  `json:"batch_id"`
				ActorID       string  `json:"actor_id"`
				Variete       string  `json:"variete"`
				Parcelle      string  `json:"parcelle"`
				Notes         string  `json:"notes"`
				Poids         float64 `json:"poids"`
				Justification string  `json:"justification"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.ActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id, actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, b, err := fc.UpdateBatch(ctx, req.BatchID, req.ActorID, req.Variete, req.Parcelle, req.Notes, req.Poids, req.Justification)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx, "batch": b})
		})

		v1.POST("/batch/price", func(c *gin.Context) {
			var req struct {
				BatchID string  `json:"batch_id"`
				ActorID string  `json:"actor_id"`
				Price   float64 `json:"price"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.ActorID == "" || req.Price <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id, actor_id, price requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.SetBatchPrice(ctx, req.BatchID, req.ActorID, req.Price)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.POST("/batch/confirm", func(c *gin.Context) {
			var req struct {
				BatchID string `json:"batch_id"`
				ActorID string `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.BatchID == "" || req.ActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "batch_id et actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.ConfirmBatchReceipt(ctx, req.BatchID, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.POST("/groupedlist/create", func(c *gin.Context) {
			var req struct {
				ListID   string   `json:"list_id"`
				BatchIDs []string `json:"batch_ids"`
				ActorID  string   `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.ListID == "" || req.ActorID == "" || len(req.BatchIDs) == 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "list_id, batch_ids, actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.CreateGroupedList(ctx, req.ListID, req.BatchIDs, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.POST("/groupedlist/pay", func(c *gin.Context) {
			var req struct {
				ListID  string `json:"list_id"`
				ActorID string `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.ListID == "" || req.ActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "list_id et actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.PayGroupedList(ctx, req.ListID, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.POST("/cooperative/margin", func(c *gin.Context) {
			var req struct {
				OrgID   string  `json:"org_id"`
				Margin  float64 `json:"margin"`
				ActorID string  `json:"actor_id"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.OrgID == "" || req.ActorID == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "org_id et actor_id requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.SetCooperativeMargin(ctx, req.OrgID, req.Margin, req.ActorID)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.GET("/wallet/:actorID", func(c *gin.Context) {
			aid := c.Param("actorID")
			ctx, cancel := context.WithTimeout(c.Request.Context(), 15*time.Second)
			defer cancel()
			bal, err := fc.GetWalletBalance(ctx, aid)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"balance": bal})
		})

		v1.POST("/wallet/deposit", func(c *gin.Context) {
			var req struct {
				ActorID string  `json:"actor_id"`
				Amount  float64 `json:"amount"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.ActorID == "" || req.Amount <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "actor_id et amount requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.DepositWallet(ctx, req.ActorID, req.Amount)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.POST("/wallet/withdraw", func(c *gin.Context) {
			var req struct {
				ActorID string  `json:"actor_id"`
				Amount  float64 `json:"amount"`
			}
			if err := c.ShouldBindJSON(&req); err != nil || req.ActorID == "" || req.Amount <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "actor_id et amount requis"})
				return
			}
			ctx, cancel := context.WithTimeout(c.Request.Context(), 25*time.Second)
			defer cancel()
			tx, err := fc.WithdrawWallet(ctx, req.ActorID, req.Amount)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": tx})
		})

		v1.GET("/dashboard/recent-transfers", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
			defer cancel()
			list, err := fc.GetRecentTransfers(ctx)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, list)
		})

		v1.GET("/dashboard/activity-chart", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
			defer cancel()
			list, err := fc.GetActivityChart(ctx)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, list)
		})

		v1.GET("/dashboard/eudr-compliance", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
			defer cancel()
			m, err := fc.GetEUDRCompliance(ctx)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, m)
		})

		v1.GET("/dashboard/alerts-count", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 20*time.Second)
			defer cancel()
			m, err := fc.GetAlertsCount(ctx)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, m)
		})

		v1.GET("/stats", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
			defer cancel()
			c.JSON(http.StatusOK, fc.GetStats(ctx))
		})
	}

	log.Printf("fabric-proxy écoute sur :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

