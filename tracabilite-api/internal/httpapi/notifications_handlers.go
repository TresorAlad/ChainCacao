package httpapi

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"tracabilite-api/internal/auth"
)

type registerDeviceRequest struct {
	Token    string `json:"token" binding:"required"`
	Platform string `json:"platform"`
}

func (h *Handler) RegisterDevice(c *gin.Context) {
	if h.notify == nil || h.tokenStore == nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "notifications non configurees"})
		return
	}
	var req registerDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token requis"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	platform := strings.TrimSpace(req.Platform)
	if platform == "" {
		platform = "android"
	}
	if err := h.tokenStore.SaveToken(c.Request.Context(), actorID, req.Token, platform); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
