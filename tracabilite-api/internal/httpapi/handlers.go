package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"tracabilite-api/internal/actors"
	"tracabilite-api/internal/auth"
	"tracabilite-api/internal/batch"
	"tracabilite-api/pkg/models"
)

type Handler struct {
	actors *actors.Service
	jwt    *auth.JWTService
	batch  *batch.Service
}

func NewHandler(actors *actors.Service, jwt *auth.JWTService, batch *batch.Service) *Handler {
	return &Handler{
		actors: actors,
		jwt:    jwt,
		batch:  batch,
	}
}

type loginRequest struct {
	ActorID string `json:"actor_id" binding:"required"`
	PIN     string `json:"pin" binding:"required"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload login invalide"})
		return
	}
	actor, err := h.actors.Authenticate(req.ActorID, req.PIN)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	token, err := h.jwt.Generate(actor.ID, actor.OrgID, actor.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "echec generation token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"token":   token,
		"actor":   actor,
	})
}

func (h *Handler) CreateBatch(c *gin.Context) {
	var req batch.CreateBatchInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload creation batch invalide"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	orgID := c.GetString(auth.ContextOrgID)

	txHash, created, err := h.batch.Create(req, actorID, orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"tx_hash": txHash,
		"batch":   created,
	})
}

func (h *Handler) TransferBatch(c *gin.Context) {
	var req batch.TransferBatchInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload transfert invalide"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	txHash, updated, err := h.batch.Transfer(req, actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"tx_hash": txHash,
		"batch":   updated,
	})
}

func (h *Handler) GetBatch(c *gin.Context) {
	id := c.Param("id")
	b, err := h.batch.GetBatch(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

func (h *Handler) GetBatchHistory(c *gin.Context) {
	id := c.Param("id")
	events, err := h.batch.GetHistory(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"events":  events,
	})
}

func (h *Handler) VerifyBatch(c *gin.Context) {
	id := c.Param("id")
	events, err := h.batch.GetHistory(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"batch_id": id,
		"timeline": events,
	})
}

func (h *Handler) ListActors(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"actors":  h.actors.List(),
	})
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "ok",
	})
}
