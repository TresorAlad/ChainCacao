package httpapi

import (
	"strings"

	"github.com/gin-gonic/gin"
	"tracabilite-api/internal/notifications"
	"tracabilite-api/pkg/models"
)

func (h *Handler) sendLotTransitNotification(c *gin.Context, toActorID, batchID string) {
	if h.notify == nil || toActorID == "" || batchID == "" {
		return
	}
	notifications.NotifyLotTransit(c.Request.Context(), h.notify, toActorID, batchID)
}

func (h *Handler) sendPaymentNotifications(c *gin.Context, batchID string, lot models.Batch, payerID string, total float64) {
	if h.notify == nil {
		return
	}
	ctx := c.Request.Context()
	events, _ := h.batch.GetHistory(ctx, batchID)
	sellerID := notifications.ResolveSellerID(events, lot)
	if sellerID != "" && sellerID != payerID {
		notifications.NotifyPaymentSeller(ctx, h.notify, sellerID, batchID, total)
	}
	// Coopérative : message paiement reçu pour le lot
	if sellerID != "" {
		seller, err := h.actors.FindByID(ctx, sellerID)
		if err == nil && strings.Contains(strings.ToLower(string(seller.Role)), "coop") {
			body := "Paiement reçu pour le lot " + batchID
			_ = h.notify.SendToActor(ctx, sellerID, "Paiement reçu", body, map[string]string{
				"type": "payment", "lot_id": batchID, "screen": "portefeuille",
			})
		}
	}
}

func (h *Handler) sendGroupedPaymentNotifications(c *gin.Context, batchIDs []string, payerID string, prixParKg float64) {
	if h.notify == nil {
		return
	}
	ctx := c.Request.Context()
	for _, bid := range batchIDs {
		lot, err := h.batch.GetBatch(ctx, bid)
		if err != nil {
			continue
		}
		total := prixParKg * lot.Quantite
		h.sendPaymentNotifications(c, bid, lot, payerID, total)
	}
}

func (h *Handler) sendReceptionNotification(c *gin.Context, batchID, recipientID string) {
	if h.notify == nil {
		return
	}
	ctx := c.Request.Context()
	events, _ := h.batch.GetHistory(ctx, batchID)
	senderID := notifications.ResolveTransferSender(events)
	if senderID == "" || senderID == recipientID {
		return
	}
	recipientName := recipientID
	if actor, err := h.actors.FindByID(ctx, recipientID); err == nil && actor.Nom != "" {
		recipientName = actor.Nom
	}
	notifications.NotifyLotReception(ctx, h.notify, senderID, batchID, recipientName)
}

func (h *Handler) sendDepositNotification(c *gin.Context, actorID string, montant float64) {
	if h.notify == nil || actorID == "" {
		return
	}
	ctx := c.Request.Context()
	actor, err := h.actors.FindByID(ctx, actorID)
	if err != nil {
		notifications.NotifyDeposit(ctx, h.notify, actorID, montant)
		return
	}
	role := strings.ToLower(string(actor.Role))
	if strings.Contains(role, "export") || strings.Contains(role, "transform") {
		notifications.NotifyWalletCredit(ctx, h.notify, actorID, montant, "")
	} else {
		notifications.NotifyDeposit(ctx, h.notify, actorID, montant)
	}
}
