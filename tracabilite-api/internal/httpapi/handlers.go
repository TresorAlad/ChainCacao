package httpapi

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
	"tracabilite-api/internal/actors"
	"tracabilite-api/internal/auth"
	"tracabilite-api/internal/batch"
	"tracabilite-api/internal/cloudinary"
	"tracabilite-api/internal/media"
	"tracabilite-api/internal/report"
	"tracabilite-api/pkg/models"
)

type Handler struct {
	actors *actors.Service
	jwt    *auth.JWTService
	batch  *batch.Service
	media  *media.Repo
}

func NewHandler(actors *actors.Service, jwt *auth.JWTService, batch *batch.Service, media *media.Repo) *Handler {
	return &Handler{
		actors: actors,
		jwt:    jwt,
		batch:  batch,
		media:  media,
	}
}

type loginRequest struct {
	ActorID  string `json:"actor_id"`
	PIN      string `json:"pin"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	Nom      string      `json:"nom" binding:"required"`
	Email    string      `json:"email" binding:"required"`
	Password string      `json:"password" binding:"required"`
	OrgID    string      `json:"org_id" binding:"required"`
	Role     models.Role `json:"role" binding:"required"`
}

// Signup public - Role optionnel, defaut "agriculteur".
// Les champs supplementaires (GPS, surface, etc.) peuvent etre ajoutes cote SQL plus tard.
type signupRequest struct {
	Nom          string `json:"nom" binding:"required"`
	Email        string `json:"email" binding:"required"`
	Password     string `json:"password" binding:"required"`
	OrgID        string `json:"org_id"`
	Role         string `json:"role"` // optionnel, defaut "agriculteur"
	GPSLocation  string `json:"gps_location"`
	FieldSurface string `json:"field_surface"`
	OrgName      string `json:"org_name"`
	PINCode      string `json:"pin_code"`
}

func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload login invalide"})
		return
	}
	ctx := c.Request.Context()
	var (
		actor models.Actor
		err   error
	)
	if req.Email != "" {
		actor, err = h.actors.AuthenticateByEmail(ctx, req.Email, req.Password)
	} else {
		actor, err = h.actors.Authenticate(ctx, req.ActorID, req.PIN)
	}
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

func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload register invalide"})
		return
	}
	actor, err := h.actors.Register(c.Request.Context(), req.Nom, req.Email, req.Password, req.OrgID, req.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "actor": actor})
}

func (h *Handler) Signup(c *gin.Context) {
	var req signupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload signup invalide"})
		return
	}

	orgID := req.OrgID
	if orgID == "" {
		orgID = "AgriculteurMSP"
	}

	// Normaliser le role : "exportateur" (frontend mobile) → "distributeur" dans la base.
	// "verificateur" est accepte tel quel.
	normalizedRole := req.Role
	if normalizedRole == "exportateur" {
		normalizedRole = "distributeur"
	}
	role := models.Role(normalizedRole)
	if role == "" {
		role = models.RoleAgriculteur
	}

	// Mettre a jour l'orgID si absent ou generique selon le role.
	if orgID == "" || orgID == "AgriculteurMSP" {
		switch role {
		case models.RoleCooperative:
			orgID = "CooperativeMSP"
		case models.RoleTransformateur:
			orgID = "TransformateurMSP"
		case models.RoleDistributeur:
			orgID = "DistributeurMSP"
		case models.RoleVerificateur:
			orgID = "VerificateurMSP"
		case models.RoleAdmin:
			orgID = "PlatformMSP"
		}
	}

	actor, err := h.actors.Register(c.Request.Context(), req.Nom, req.Email, req.Password, orgID, role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Auto-login: retourner un JWT directement
	token, err := h.jwt.Generate(actor.ID, actor.OrgID, actor.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "echec generation token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
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

	txHash, created, err := h.batch.Create(c.Request.Context(), req, actorID, orgID)
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
	txHash, updated, err := h.batch.Transfer(c.Request.Context(), req, actorID)
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

func (h *Handler) UpdateBatchWeight(c *gin.Context) {
	var req batch.UpdateWeightInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload mise a jour poids invalide"})
		return
	}
	req.BatchID = c.Param("id")
	actorID := c.GetString(auth.ContextActorID)
	txHash, updated, err := h.batch.UpdateWeight(c.Request.Context(), req, actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "batch": updated})
}

func (h *Handler) MarkLotExported(c *gin.Context) {
	batchID := c.Param("id")
	actorID := c.GetString(auth.ContextActorID)
	txHash, updated, err := h.batch.MarkExported(c.Request.Context(), batchID, actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "batch": updated})
}

func (h *Handler) GetBatch(c *gin.Context) {
	id := c.Param("id")
	b, err := h.batch.GetBatch(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, b)
}

func (h *Handler) GetBatchHistory(c *gin.Context) {
	id := c.Param("id")
	events, err := h.batch.GetHistory(c.Request.Context(), id)
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
	ctx := c.Request.Context()
	lot, err := h.batch.GetBatch(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	events, err := h.batch.GetHistory(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	var (
		lastTxHash     string
		originActorID  string
		originActorNom string
		ownerNom       string
	)
	if len(events) > 0 {
		lastTxHash = events[len(events)-1].TxHash
		for _, e := range events {
			if e.Type == "creation" && e.ActorID != "" {
				originActorID = e.ActorID
				break
			}
		}
	}
	if originActorID != "" {
		if a, err := h.actors.FindByID(ctx, originActorID); err == nil {
			originActorNom = a.Nom
		}
	}
	if lot.Proprietaire != "" {
		if a, err := h.actors.FindByID(ctx, lot.Proprietaire); err == nil {
			ownerNom = a.Nom
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"lot":     lot,
		"origin": gin.H{
			"actor_id":  originActorID,
			"actor_nom": originActorNom,
			"region":    lot.Region,
			"village":   lot.Village,
			"parcelle":  lot.Parcelle,
			"latitude":  lot.Latitude,
			"longitude": lot.Longitude,
			"photo_url": lot.PhotoURL,
		},
		"owner": gin.H{
			"actor_id": lot.Proprietaire,
			"actor_nom": ownerNom,
			"org_id":   lot.OrgID,
		},
		"timeline":          events,
		"eudr_conforme":     lot.EUDRConforme,
		"blockchain_txhash": lastTxHash,
		"verified_at_utc":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *Handler) EUDRReport(c *gin.Context) {
	id := c.Param("id")
	rep, err := h.batch.BuildEUDRReport(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "report": rep})
}

func (h *Handler) EUDRReportPDF(c *gin.Context) {
	id := c.Param("id")
	rep, err := h.batch.BuildEUDRReport(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	pdfBytes, err := report.BuildEUDRPDF(rep)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="eudr-%s.pdf"`, id))
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}

func (h *Handler) GenerateQRCode(c *gin.Context) {
	id := c.Param("id")
	baseURL := getenvDefault("PUBLIC_VERIFY_BASE_URL", "https://chaincacao.tg/verify")
	verifyURL := fmt.Sprintf("%s/%s", stringsTrimSlash(baseURL), id)
	if c.Query("format") == "png" {
		png, err := qrcode.Encode(verifyURL, qrcode.Medium, 256)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusOK, "image/png", png)
		return
	}
	png, err := qrcode.Encode(verifyURL, qrcode.Medium, 256)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	encoded := base64.StdEncoding.EncodeToString(png)
	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"lot_id":            id,
		"verify_url":        verifyURL,
		"qrcode_png_base64": encoded,
		"hint":              "Ajoutez ?format=png pour obtenir directement l'image PNG",
	})
}

func (h *Handler) UploadLotPhoto(c *gin.Context) {
	lotID := c.Param("id")
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "fichier 'file' requis (multipart)"})
		return
	}
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	defer src.Close()

	res, err := cloudinary.UploadImage(c.Request.Context(), file.Filename, src)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	if h.media != nil {
		if err := h.media.SaveLotImage(c.Request.Context(), lotID, res.PublicID, res.SecureURL); err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success":    true,
				"warning":    "cloudinary ok mais persistance SQL echouee: " + err.Error(),
				"secure_url": res.SecureURL,
				"public_id":  res.PublicID,
			})
			return
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"lot_id":     lotID,
		"secure_url": res.SecureURL,
		"public_id":  res.PublicID,
	})
}

func (h *Handler) SyncOfflineLots(c *gin.Context) {
	var payload []batch.CreateBatchInput
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload sync invalide: tableau attendu"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	orgID := c.GetString(auth.ContextOrgID)
	type syncResult struct {
		Index  int    `json:"index"`
		LotID  string `json:"lot_id,omitempty"`
		TxHash string `json:"tx_hash,omitempty"`
		Error  string `json:"error,omitempty"`
	}
	results := make([]syncResult, 0, len(payload))
	for i, item := range payload {
		txHash, created, err := h.batch.Create(c.Request.Context(), item, actorID, orgID)
		if err != nil {
			results = append(results, syncResult{Index: i, Error: err.Error()})
			continue
		}
		results = append(results, syncResult{Index: i, LotID: created.ID, TxHash: txHash})
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "results": results})
}

func (h *Handler) DashboardStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"success": true, "stats": h.batch.GetStats(c.Request.Context())})
}

func (h *Handler) RecentTransfers(c *gin.Context) {
	transfers, err := h.batch.GetRecentTransfers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "transfers": transfers})
}

func (h *Handler) ActivityChart(c *gin.Context) {
	activity, err := h.batch.GetActivityChart(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "activity": activity})
}

func (h *Handler) EUDRCompliance(c *gin.Context) {
	compliance, err := h.batch.GetEUDRCompliance(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "compliance": compliance})
}

func (h *Handler) AlertsCount(c *gin.Context) {
	alerts, err := h.batch.GetAlertsCount(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "alerts": alerts})
}

func (h *Handler) GetMyLots(c *gin.Context) {
	actorID := c.GetString(auth.ContextActorID)
	lots, err := h.batch.GetMyLots(c.Request.Context(), actorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if lots == nil {
		lots = []models.Batch{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "lots": lots})
}

func (h *Handler) ListActors(c *gin.Context) {
	list, err := h.actors.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"actors":  list,
	})
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "ok",
	})
}

func getenvDefault(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}

func stringsTrimSlash(s string) string {
	for len(s) > 0 && s[len(s)-1] == '/' {
		s = s[:len(s)-1]
	}
	return s
}
