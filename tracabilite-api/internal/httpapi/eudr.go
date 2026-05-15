package httpapi

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// EudrReport renvoie un rapport de conformité EUDR (JSON) pour un lot.
func (h *Handler) EudrReport(c *gin.Context) {
	batchID := strings.TrimSpace(c.Param("id"))
	if batchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id lot requis"})
		return
	}
	lot, err := h.batch.GetBatch(c.Request.Context(), batchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	events, err := h.batch.GetHistory(c.Request.Context(), batchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	verifyURL := fmt.Sprintf("%s/api/v1/verify/%s", scheme+"://"+c.Request.Host, batchID)
	chain := make([]gin.H, 0, len(events))
	hashes := make([]string, 0, len(events))
	for _, ev := range events {
		chain = append(chain, gin.H{
			"type":       ev.Type,
			"actor_id":   ev.ActorID,
			"tx_hash":    ev.TxHash,
			"created_at": ev.CreatedAtISO,
		})
		if ev.TxHash != "" {
			hashes = append(hashes, ev.TxHash)
		}
	}
	eudrOK := lot.Latitude != 0 && lot.Longitude != 0
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"report": gin.H{
			"lot_id":            batchID,
			"generated_at":      time.Now().UTC().Format(time.RFC3339),
			"culture":           lot.Culture,
			"quantite_kg":       lot.Quantite,
			"latitude":          lot.Latitude,
			"longitude":         lot.Longitude,
			"lieu":              lot.Lieu,
			"parcelle":          lot.Parcelle,
			"statut":            lot.Statut,
			"eudr_conforme":     eudrOK,
			"verify_url":        verifyURL,
			"proprietaire":      lot.Proprietaire,
			"chain_propriete":   chain,
			"hashes_blockchain": hashes,
		},
	})
}

// EudrReportPDF rapport texte imprimable (MVP).
func (h *Handler) EudrReportPDF(c *gin.Context) {
	batchID := strings.TrimSpace(c.Param("id"))
	lot, err := h.batch.GetBatch(c.Request.Context(), batchID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	events, _ := h.batch.GetHistory(c.Request.Context(), batchID)
	var b strings.Builder
	b.WriteString("RAPPORT EUDR — ChainCacao\n")
	b.WriteString("Lot: " + batchID + "\n")
	b.WriteString("Généré: " + time.Now().UTC().Format(time.RFC3339) + "\n\n")
	b.WriteString(fmt.Sprintf("GPS: %.8f, %.8f\n", lot.Latitude, lot.Longitude))
	b.WriteString("Lieu: " + lot.Lieu + "\n")
	b.WriteString("Parcelle: " + lot.Parcelle + "\n")
	b.WriteString(fmt.Sprintf("Quantité: %.2f kg\n", lot.Quantite))
	b.WriteString("Statut: " + lot.Statut + "\n\n")
	b.WriteString("Chaîne de propriété:\n")
	for _, ev := range events {
		b.WriteString(fmt.Sprintf("- %s | %s | %s\n", ev.CreatedAtISO, ev.Type, ev.TxHash))
	}
	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=eudr-%s.txt", batchID))
	c.String(http.StatusOK, b.String())
}
