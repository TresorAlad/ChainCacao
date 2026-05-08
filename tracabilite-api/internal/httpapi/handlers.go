package httpapi

import (
	"bytes"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/skip2/go-qrcode"
	"tracabilite-api/internal/actors"
	"tracabilite-api/internal/auth"
	"tracabilite-api/internal/batch"
	"tracabilite-api/internal/cloudinary"
	"tracabilite-api/internal/config"
	"tracabilite-api/internal/exif"
	"tracabilite-api/internal/groupedlist"
	"tracabilite-api/internal/incidents"
	"tracabilite-api/internal/media"
	"tracabilite-api/internal/report"
	"tracabilite-api/internal/syncdedup"
	"tracabilite-api/pkg/models"
)

type Handler struct {
	actors *actors.Service
	jwt    *auth.JWTService
	batch  *batch.Service
	media  *media.Repo
	config config.Repo
	inc    incidents.Repo
	dedup  syncdedup.Repo
	lists  groupedlist.Repo
}

func NewHandler(actors *actors.Service, jwt *auth.JWTService, batch *batch.Service, media *media.Repo, cfg config.Repo, inc incidents.Repo, dedup syncdedup.Repo, lists groupedlist.Repo) *Handler {
	return &Handler{
		actors: actors,
		jwt:    jwt,
		batch:  batch,
		media:  media,
		config: cfg,
		inc:    inc,
		dedup:  dedup,
		lists:  lists,
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

	normalizedRole := req.Role
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
		case models.RoleExportateur:
			orgID = "ExportateurMSP"
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
	actorID := c.GetString(auth.ContextActorID)
	orgID := c.GetString(auth.ContextOrgID)

	var req batch.CreateBatchInput
	// CDC: la creation de lot doit venir avec une photo camera et GPS EXIF.
	// On supporte:
	// - multipart/form-data (recommande): champ `file` + champs texte
	// - JSON (compat): latitude/longitude doivent etre fournis (validation dans batch.Create)
	if c.ContentType() == "multipart/form-data" {
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "fichier 'file' requis (multipart)"})
			return
		}
		maxBytes := getenvInt64Default("LOT_PHOTO_MAX_BYTES", 5*1024*1024) // 5MB
		if file.Size > maxBytes {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "photo trop volumineuse"})
			return
		}
		f, err := file.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		defer f.Close()

		// Lire en memoire (besoin EXIF + upload), mais borne par maxBytes.
		raw, err := readAllLimit(f, maxBytes)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "lecture fichier impossible"})
			return
		}

		gps, err := exif.ExtractGPS(bytes.NewReader(raw))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "photo invalide: GPS EXIF requis"})
			return
		}

		// Upload photo et stocker URL dans le lot.
		up, err := cloudinary.UploadImage(c.Request.Context(), file.Filename, bytes.NewReader(raw))
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}

		req = batch.CreateBatchInput{
			Culture:     c.PostForm("culture"),
			Variete:     c.PostForm("variete"),
			Quantite:    parseFloatDefault(c.PostForm("quantite"), 0),
			Lieu:        c.PostForm("lieu"),
			Latitude:    gps.Latitude,
			Longitude:   gps.Longitude,
			Region:      c.PostForm("region"),
			Village:     c.PostForm("village"),
			Parcelle:    c.PostForm("parcelle"),
			DateRecolte: c.PostForm("date_recolte"),
			PhotoURL:    up.SecureURL,
			Notes:       c.PostForm("notes"),
		}
	} else {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "payload creation lot invalide"})
			return
		}
	}

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
	c.JSON(http.StatusOK, gin.H{"success": true, "lot": b})
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
	maxBytes := getenvInt64Default("LOT_PHOTO_MAX_BYTES", 5*1024*1024) // 5MB
	if file.Size > maxBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "photo trop volumineuse"})
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
		ClientLotID string `json:"client_lot_id,omitempty"`
		LotID  string `json:"lot_id,omitempty"`
		TxHash string `json:"tx_hash,omitempty"`
		Error  string `json:"error,omitempty"`
	}
	results := make([]syncResult, 0, len(payload))
	for i, item := range payload {
		if h.dedup != nil && item.ClientLotID != "" {
			if rec, ok, err := h.dedup.Get(c.Request.Context(), actorID, item.ClientLotID); err == nil && ok {
				results = append(results, syncResult{Index: i, ClientLotID: item.ClientLotID, LotID: rec.LotID, TxHash: rec.TxHash})
				continue
			}
		}
		txHash, created, err := h.batch.Create(c.Request.Context(), item, actorID, orgID)
		if err != nil {
			results = append(results, syncResult{Index: i, ClientLotID: item.ClientLotID, Error: err.Error()})
			continue
		}
		if h.dedup != nil && item.ClientLotID != "" {
			_ = h.dedup.Put(c.Request.Context(), actorID, item.ClientLotID, created.ID, txHash)
		}
		results = append(results, syncResult{Index: i, ClientLotID: item.ClientLotID, LotID: created.ID, TxHash: txHash})
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

func getenvInt64Default(k string, def int64) int64 {
	raw := os.Getenv(k)
	if raw == "" {
		return def
	}
	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || n <= 0 {
		return def
	}
	return n
}

func readAllLimit(r io.Reader, maxBytes int64) ([]byte, error) {
	// Lire maxBytes+1 pour detecter le depassement.
	lr := io.LimitReader(r, maxBytes+1)
	b, err := io.ReadAll(lr)
	if err != nil {
		return nil, err
	}
	if int64(len(b)) > maxBytes {
		return nil, fmt.Errorf("fichier trop volumineux")
	}
	return b, nil
}

func stringsTrimSlash(s string) string {
	for len(s) > 0 && s[len(s)-1] == '/' {
		s = s[:len(s)-1]
	}
	return s
}

func parseFloatDefault(raw string, def float64) float64 {
	if raw == "" {
		return def
	}
	f, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return def
	}
	return f
}

// ---- NOUVELLES ROUTES MVP PHASE 3 ----

func (h *Handler) CorrigerLot(c *gin.Context) {
	batchID := c.Param("id")
	var input map[string]any
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	txHash, updated, err := h.batch.UpdateBatch(c.Request.Context(), input, batchID, actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "batch": updated})
}

func (h *Handler) GetLotPosition(c *gin.Context) {
	id := c.Param("id")
	ctx := c.Request.Context()
	lot, err := h.batch.GetBatch(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	owner, _ := h.actors.FindByID(ctx, lot.Proprietaire)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"position": gin.H{
			"statut": lot.Statut,
			"proprietaire_id": lot.Proprietaire,
			"proprietaire_nom": owner.Nom,
			"org_id": lot.OrgID,
		},
	})
}

func (h *Handler) SetLotPrix(c *gin.Context) {
	batchID := c.Param("id")
	var req struct {
		Prix      float64 `json:"prix"`
		PrixParKg float64 `json:"prix_par_kg"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	price := req.PrixParKg
	if price <= 0 {
		price = req.Prix
	}
	if price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prix_par_kg requis"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	txHash, err := h.batch.SetBatchPrice(c.Request.Context(), batchID, actorID, price)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash})
}

func (h *Handler) ConfirmerLot(c *gin.Context) {
	var req struct {
		PIN string `json:"pin" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	batchID := c.Param("id")
	actorID := c.GetString(auth.ContextActorID)
	_, err := h.actors.Authenticate(c.Request.Context(), actorID, req.PIN)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "PIN invalide"})
		return
	}

	// Debit acheteur (transformateur/exportateur) puis paiement.
	lot, err := h.batch.GetBatch(c.Request.Context(), batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Prix/kg: si non défini, Fabric mock utilise 1500 par défaut.
	// Pour le backend, on applique le même défaut pour afficher/débiter correctement.
	price := 1500.0
	// Pas d'API GetPrice ici: on assume que SetLotPrix a été appelé.
	// On laisse le défaut à 1500 pour rester cohérent avec InMemoryClient.
	total := price * lot.Quantite
	if _, err := h.batch.WithdrawWallet(c.Request.Context(), actorID, total); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	txHash, err := h.batch.ConfirmBatchReceipt(c.Request.Context(), batchID, actorID)
	if err != nil {
		if h.inc != nil {
			_, _ = h.inc.Create(c.Request.Context(), "confirm_lot", map[string]any{"lot_id": batchID, "actor_id": actorID}, err.Error())
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "message": "lot confirme et paiement initie", "montant_total": total})
}

func (h *Handler) GetLotPaiement(c *gin.Context) {
	batchID := c.Param("id")
	status, err := h.batch.GetPaymentStatus(c.Request.Context(), batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "paiement": status})
}

func (h *Handler) CreerListeGroupee(c *gin.Context) {
	var req struct {
		ListID   string   `json:"list_id" binding:"required"`
		BatchIDs []string `json:"batch_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	txHash, err := h.batch.CreateGroupedList(c.Request.Context(), req.ListID, req.BatchIDs, actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if h.lists != nil {
		_ = h.lists.Save(c.Request.Context(), req.ListID, actorID, req.BatchIDs)
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "list_id": req.ListID})
}

func (h *Handler) PreviewListeGroupee(c *gin.Context) {
	listID := c.Param("id")
	var req struct {
		PrixParKg float64 `json:"prix_par_kg" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.PrixParKg <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	if h.lists == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "liste store absent"})
		return
	}
	l, err := h.lists.Get(c.Request.Context(), listID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	type lotLine struct {
		LotID      string  `json:"lot_id"`
		PoidsKg    float64 `json:"poids_kg"`
		Montant    float64 `json:"montant"`
	}
	lines := make([]lotLine, 0, len(l.BatchIDs))
	var total float64
	for _, bid := range l.BatchIDs {
		lot, err := h.batch.GetBatch(c.Request.Context(), bid)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "lot introuvable dans liste: " + bid})
			return
		}
		m := req.PrixParKg * lot.Quantite
		total += m
		lines = append(lines, lotLine{LotID: bid, PoidsKg: lot.Quantite, Montant: m})
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"list_id": listID,
		"prix_par_kg": req.PrixParKg,
		"lots": lines,
		"montant_total": total,
	})
}

func (h *Handler) PayerListeGroupee(c *gin.Context) {
	var req struct {
		PIN       string  `json:"pin" binding:"required"`
		PrixParKg float64 `json:"prix_par_kg" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.PrixParKg <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	listID := c.Param("id")
	actorID := c.GetString(auth.ContextActorID)
	_, err := h.actors.Authenticate(c.Request.Context(), actorID, req.PIN)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "PIN invalide"})
		return
	}

	// Calculer le total a payer + verifier solde puis debiter le payeur.
	if h.lists == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "liste store absent"})
		return
	}
	l, err := h.lists.Get(c.Request.Context(), listID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	var total float64
	for _, bid := range l.BatchIDs {
		lot, err := h.batch.GetBatch(c.Request.Context(), bid)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "lot introuvable dans liste: " + bid})
			return
		}
		total += req.PrixParKg * lot.Quantite
		// Fixer le prix par lot (utilise ensuite par Fabric/InMemory pour le credit agriculteur).
		_, _ = h.batch.SetBatchPrice(c.Request.Context(), bid, actorID, req.PrixParKg)
	}
	// Debit du payeur (transformateur/exportateur) avant distribution.
	if _, err := h.batch.WithdrawWallet(c.Request.Context(), actorID, total); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	txHash, err := h.batch.PayGroupedList(c.Request.Context(), listID, actorID)
	if err != nil {
		if h.inc != nil {
			_, _ = h.inc.Create(c.Request.Context(), "pay_grouped_list", map[string]any{"list_id": listID, "actor_id": actorID}, err.Error())
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "message": "paiement de la liste effectue", "montant_total": total})
}

func (h *Handler) GetPortefeuilleSolde(c *gin.Context) {
	actorID := c.GetString(auth.ContextActorID)
	balance, err := h.batch.GetWalletBalance(c.Request.Context(), actorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "balance": balance, "currency": "FCFA"})
}

func (h *Handler) PortefeuilleDepot(c *gin.Context) {
	var req struct {
		Montant float64 `json:"montant" binding:"required"`
		PIN     string  `json:"pin" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	_, err := h.actors.Authenticate(c.Request.Context(), actorID, req.PIN)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "PIN invalide"})
		return
	}
	txHash, err := h.batch.DepositWallet(c.Request.Context(), actorID, req.Montant)
	if err != nil {
		if h.inc != nil {
			_, _ = h.inc.Create(c.Request.Context(), "wallet_deposit", map[string]any{"actor_id": actorID, "montant": req.Montant}, err.Error())
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "message": "depot effectue"})
}

func (h *Handler) PortefeuilleRetrait(c *gin.Context) {
	var req struct {
		Montant float64 `json:"montant" binding:"required"`
		PIN     string  `json:"pin" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	
	// Verifier le PIN avant retrait
	actorID := c.GetString(auth.ContextActorID)
	ctx := c.Request.Context()
	_, err := h.actors.Authenticate(ctx, actorID, req.PIN)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "PIN invalide"})
		return
	}

	txHash, err := h.batch.WithdrawWallet(ctx, actorID, req.Montant)
	if err != nil {
		if h.inc != nil {
			_, _ = h.inc.Create(c.Request.Context(), "wallet_withdraw", map[string]any{"actor_id": actorID, "montant": req.Montant}, err.Error())
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "message": "retrait effectue"})
}

func (h *Handler) SetMargeCooperative(c *gin.Context) {
	var req struct {
		OrgID  string  `json:"org_id" binding:"required"`
		Margin float64 `json:"margin" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	txHash, err := h.batch.SetCooperativeMargin(c.Request.Context(), req.OrgID, req.Margin, actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "tx_hash": txHash, "message": "marge configuree"})
}

// ---- ADMINISTRATION SYSTEME (CDC) ----

func (h *Handler) AdminListActors(c *gin.Context) {
	list, err := h.actors.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "actors": list})
}

func (h *Handler) AdminCreateActor(c *gin.Context) {
	var req struct {
		Nom      string      `json:"nom" binding:"required"`
		Email    string      `json:"email" binding:"required"`
		Password string      `json:"password" binding:"required"`
		OrgID    string      `json:"org_id" binding:"required"`
		Role     models.Role `json:"role" binding:"required"`
		PIN      string      `json:"pin" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	actor, err := h.actors.Register(c.Request.Context(), req.Nom, req.Email, req.Password, req.OrgID, req.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	actor, err = h.actors.SetPIN(c.Request.Context(), actor.ID, req.PIN)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "actor": actor})
}

func (h *Handler) AdminUpdateActor(c *gin.Context) {
	id := c.Param("id")
	var in actors.UpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	updated, err := h.actors.Update(c.Request.Context(), id, in)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "actor": updated})
}

func (h *Handler) AdminResetActorPIN(c *gin.Context) {
	id := c.Param("id")
	pin, err := randomPIN4()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "generation PIN echouee"})
		return
	}
	actor, err := h.actors.SetPIN(c.Request.Context(), id, pin)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// CDC: reset PIN via SMS idealement; ici on retourne le PIN pour usage backoffice.
	c.JSON(http.StatusOK, gin.H{"success": true, "actor_id": actor.ID, "pin": pin})
}

func randomPIN4() (string, error) {
	var b [2]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	n := int(b[0])<<8 | int(b[1])
	n = n % 10000
	return fmt.Sprintf("%04d", n), nil
}

func (h *Handler) AdminGetConfig(c *gin.Context) {
	if h.config == nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "config": map[string]any{}})
		return
	}
	cfg, err := h.config.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "config": cfg})
}

func (h *Handler) AdminPutConfig(c *gin.Context) {
	if h.config == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "config repo absent"})
		return
	}
	var cfg map[string]any
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload invalide"})
		return
	}
	if err := h.config.Put(c.Request.Context(), cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) AdminListIncidents(c *gin.Context) {
	if h.inc == nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "incidents": []any{}})
		return
	}
	list, err := h.inc.ListOpen(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "incidents": list})
}

func (h *Handler) AdminResolveIncident(c *gin.Context) {
	if h.inc == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "incidents repo absent"})
		return
	}
	id := c.Param("id")
	if err := h.inc.MarkResolved(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
