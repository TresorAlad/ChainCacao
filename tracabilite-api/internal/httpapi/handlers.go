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
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
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
	"tracabilite-api/internal/notifications"
	"tracabilite-api/internal/syncdedup"
	"tracabilite-api/pkg/models"
)

type Handler struct {
	actors     *actors.Service
	jwt        *auth.JWTService
	batch      *batch.Service
	media      *media.Repo
	config     config.Repo
	inc        incidents.Repo
	dedup      syncdedup.Repo
	lists      groupedlist.Repo
	notify     *notifications.Service
	tokenStore notifications.TokenStore
	pgPool     *pgxpool.Pool
	redis      *redis.Client
}

// SetHealthDeps configure les dependances pour /health (PostgreSQL, Redis).
func (h *Handler) SetHealthDeps(pool *pgxpool.Pool, rdb *redis.Client) {
	h.pgPool = pool
	h.redis = rdb
}

var signupAllowedRoles = map[models.Role]bool{
	models.RoleAgriculteur:    true,
	models.RoleCooperative:    true,
	models.RoleTransformateur: true,
	models.RoleExportateur:    true,
}

func NewHandler(
	actors *actors.Service,
	jwt *auth.JWTService,
	batch *batch.Service,
	media *media.Repo,
	cfg config.Repo,
	inc incidents.Repo,
	dedup syncdedup.Repo,
	lists groupedlist.Repo,
	notify *notifications.Service,
	tokenStore notifications.TokenStore,
) *Handler {
	return &Handler{
		actors:     actors,
		jwt:        jwt,
		batch:      batch,
		media:      media,
		config:     cfg,
		inc:        inc,
		dedup:      dedup,
		lists:      lists,
		notify:     notify,
		tokenStore: tokenStore,
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

	normalizedRole := strings.TrimSpace(strings.ToLower(req.Role))
	role := models.Role(normalizedRole)
	if role == "" {
		role = models.RoleAgriculteur
	}
	if !signupAllowedRoles[role] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "role non autorise pour l'inscription publique"})
		return
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

	if strings.TrimSpace(req.PINCode) != "" {
		actor, err = h.actors.SetPIN(c.Request.Context(), actor.ID, req.PINCode)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	prof := actors.UpdateInput{}
	if v := strings.TrimSpace(req.GPSLocation); v != "" {
		prof.GPSLocation = &v
	}
	if v := strings.TrimSpace(req.FieldSurface); v != "" {
		prof.FieldSurface = &v
	}
	if v := strings.TrimSpace(req.OrgName); v != "" {
		prof.OrgName = &v
	}
	if prof.GPSLocation != nil || prof.FieldSurface != nil || prof.OrgName != nil {
		actor, err = h.actors.Update(c.Request.Context(), actor.ID, prof)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// Crédit démo 2M FCFA (exportateur / transformateur), persistant si PostgreSQL actif.
	h.batch.EnsureDemoWalletCredit(c.Request.Context(), actor.ID, role)

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

		gps, errGPS := exif.ExtractGPS(bytes.NewReader(raw))
		var lat, lon float64
		if errGPS == nil {
			lat, lon = gps.Latitude, gps.Longitude
		} else {
			lat = parseFloatDefault(c.PostForm("latitude"), 0)
			lon = parseFloatDefault(c.PostForm("longitude"), 0)
			if lat == 0 || lon == 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "photo sans GPS dans les métadonnées : activez la localisation sur le téléphone pour que l’app envoie la position, ou fournissez la position GPS (secours technique)."})
				return
			}
		}

		// Upload photo et stocker URL dans le lot.
		up, err := cloudinary.UploadImage(c.Request.Context(), file.Filename, bytes.NewReader(raw))
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
			return
		}

		req = batch.CreateBatchInput{
			ClientLotID: c.PostForm("client_lot_id"),
			Culture:     c.PostForm("culture"),
			Variete:     c.PostForm("variete"),
			Quantite:    parseFloatDefault(c.PostForm("quantite"), 0),
			Lieu:        c.PostForm("lieu"),
			Latitude:    lat,
			Longitude:   lon,
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
	h.sendLotTransitNotification(c, req.ToActorID, req.BatchID)
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
	const maxSyncLots = 500
	if len(payload) > maxSyncLots {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("maximum %d lots par synchronisation", maxSyncLots)})
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
		if err := batch.VerifySyncIntegrity(item, actorID); err != nil {
			results = append(results, syncResult{Index: i, ClientLotID: item.ClientLotID, Error: err.Error()})
			continue
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
	p := parsePagination(c, 20, 100)
	pageItems, total := paginateSlice(transfers, p.Page, p.Limit)
	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"transfers": pageItems,
		"page":      p.Page,
		"limit":     p.Limit,
		"total":     total,
	})
}

func (h *Handler) ActivityChart(c *gin.Context) {
	activity, err := h.batch.GetActivityChart(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "activity": activity})
}

func (h *Handler) AlertsCount(c *gin.Context) {
	alerts, err := h.batch.GetAlertsCount(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "alerts": alerts})
}

func (h *Handler) GetActorLots(c *gin.Context) {
	actorID := strings.TrimSpace(c.Param("id"))
	if actorID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "identifiant acteur requis"})
		return
	}
	target, err := h.actors.FindByID(c.Request.Context(), actorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "acteur introuvable"})
		return
	}
	r := strings.ToLower(strings.TrimSpace(string(target.Role)))
	if r == string(models.RoleAdmin) || r == string(models.RoleMinistere) {
		c.JSON(http.StatusForbidden, gin.H{"error": "profil non consultable dans l'annuaire"})
		return
	}
	lots, err := h.batch.GetMyLots(c.Request.Context(), actorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if lots == nil {
		lots = []models.Batch{}
	}
	totalKg := 0.0
	byStatus := map[string]int{}
	for _, lot := range lots {
		totalKg += lot.Quantite
		st := strings.ToLower(strings.TrimSpace(lot.Statut))
		if st == "" {
			st = "inconnu"
		}
		byStatus[st]++
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"actor":   target,
		"lots":    lots,
		"stats": gin.H{
			"nb_lots":     len(lots),
			"poids_total": totalKg,
			"par_statut":  byStatus,
		},
	})
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
	p := parsePagination(c, 50, 200)
	pageItems, total := paginateSlice(lots, p.Page, p.Limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"lots":    pageItems,
		"page":    p.Page,
		"limit":   p.Limit,
		"total":   total,
	})
}

func filterAnnuaireActors(list []models.Actor) []models.Actor {
	out := make([]models.Actor, 0, len(list))
	for _, a := range list {
		r := strings.ToLower(strings.TrimSpace(string(a.Role)))
		if r == string(models.RoleAdmin) || r == string(models.RoleMinistere) {
			continue
		}
		out = append(out, a)
	}
	return out
}

func (h *Handler) ListActors(c *gin.Context) {
	list, err := h.actors.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	list = filterAnnuaireActors(list)
	p := parsePagination(c, 50, 500)
	pageItems, total := paginateSlice(list, p.Page, p.Limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"actors":  pageItems,
		"page":    p.Page,
		"limit":   p.Limit,
		"total":   total,
	})
}

func (h *Handler) Me(c *gin.Context) {
	actorID := c.GetString(auth.ContextActorID)
	actor, err := h.actors.FindByID(c.Request.Context(), actorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	hasPIN := strings.TrimSpace(actor.PINHash) != "" || strings.TrimSpace(actor.PIN) != ""
	actor.PIN = ""
	actor.PINHash = ""
	actor.PasswordHash = ""
	c.JSON(http.StatusOK, gin.H{"success": true, "actor": actor, "has_pin": hasPIN})
}

// VerifyPinUnlock valide le PIN de l'utilisateur connecté (accès application).
func (h *Handler) VerifyPinUnlock(c *gin.Context) {
	var req struct {
		PIN string `json:"pin" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code pin requis"})
		return
	}
	pin := strings.TrimSpace(req.PIN)
	if len(pin) != 4 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "le code pin doit contenir 4 chiffres"})
		return
	}
	actorID := c.GetString(auth.ContextActorID)
	if _, err := h.actors.Authenticate(c.Request.Context(), actorID, pin); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "code pin incorrect"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) Health(c *gin.Context) {
	ctx := c.Request.Context()
	checks := map[string]string{"api": "ok"}
	status := http.StatusOK

	if h.pgPool != nil {
		if err := h.pgPool.Ping(ctx); err != nil {
			checks["postgres"] = err.Error()
			status = http.StatusServiceUnavailable
		} else {
			checks["postgres"] = "ok"
		}
	} else {
		checks["postgres"] = "skipped"
	}

	if h.redis != nil {
		if err := h.redis.Ping(ctx).Err(); err != nil {
			checks["redis"] = err.Error()
			status = http.StatusServiceUnavailable
		} else {
			checks["redis"] = "ok"
		}
	} else {
		checks["redis"] = "skipped"
	}

	c.JSON(status, gin.H{
		"success": status == http.StatusOK,
		"checks":  checks,
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

	// Paiement : le client Fabric (memoire ou chaincode) applique le debit acheteur et le credit vendeur.
	lot, err := h.batch.GetBatch(c.Request.Context(), batchID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if strings.EqualFold(strings.TrimSpace(lot.Statut), "en_transit") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "le destinataire doit d'abord confirmer la reception physique du lot avant tout paiement"})
		return
	}
	price, _ := h.batch.GetBatchPricePerKg(c.Request.Context(), batchID)
	if price <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "aucun prix defini pour ce lot: fixez un prix avant confirmation"})
		return
	}
	txHash, summary, err := h.batch.ConfirmBatchReceiptWithSummary(c.Request.Context(), batchID, actorID, price)
	if err != nil {
		if h.inc != nil {
			_, _ = h.inc.Create(c.Request.Context(), "confirm_lot", map[string]any{"lot_id": batchID, "actor_id": actorID}, err.Error())
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.sendPaymentNotifications(c, batchID, lot, actorID, summary.MontantNetAgriculteurs)
	c.JSON(http.StatusOK, gin.H{
		"success":        true,
		"tx_hash":        txHash,
		"message":        "lot confirme et paiement initie",
		"montant_total":  summary.MontantTotalDebite,
		"montant_brut":   summary.MontantBrut,
		"marge_pct":      summary.MargePct,
		"marge_fcfa":     summary.MargeFCFA,
		"montant_net":    summary.MontantNetAgriculteurs,
	})
}

func (h *Handler) ConfirmerReceptionLot(c *gin.Context) {
	var req struct {
		PIN           string   `json:"pin" binding:"required"`
		PoidsConstate *float64 `json:"poids_constate"`
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
	poids := 0.0
	if req.PoidsConstate != nil && *req.PoidsConstate > 0 {
		poids = *req.PoidsConstate
	}
	txHash, updated, err := h.batch.ConfirmPhysicalReceipt(c.Request.Context(), batchID, actorID, poids)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.sendReceptionNotification(c, batchID, actorID)
	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"tx_hash":  txHash,
		"message":  "reception du lot confirmee",
		"lot":      updated,
	})
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
	coop, err := h.batch.ResolveCooperativeForList(c.Request.Context(), l)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	summary, err := h.batch.PreviewGroupedListPayment(c.Request.Context(), l.BatchIDs, req.PrixParKg, coop.OrgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success":                    true,
		"list_id":                    listID,
		"prix_par_kg":                summary.PrixParKg,
		"marge_pct":                  summary.MargePct,
		"marge_fcfa":                 summary.MargeFCFA,
		"montant_brut":               summary.MontantBrut,
		"montant_net_agriculteurs":   summary.MontantNetAgriculteurs,
		"montant_total_debite":       summary.MontantTotalDebite,
		"montant_total":              summary.MontantTotalDebite,
		"nb_agriculteurs":            summary.NbAgriculteurs,
		"poids_total_kg":             summary.PoidsTotalKg,
		"lots":                       summary.Lines,
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
	txHash, summary, err := h.batch.PayGroupedListAtomic(c.Request.Context(), l, actorID, req.PrixParKg)
	if err != nil {
		if h.inc != nil {
			_, _ = h.inc.Create(c.Request.Context(), "pay_grouped_list", map[string]any{"list_id": listID, "actor_id": actorID}, err.Error())
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.sendGroupedPaymentNotifications(c, l.BatchIDs, actorID, req.PrixParKg)
	c.JSON(http.StatusOK, gin.H{
		"success":                  true,
		"tx_hash":                  txHash,
		"message":                  "paiement de la liste effectue",
		"montant_total":            summary.MontantTotalDebite,
		"montant_brut":             summary.MontantBrut,
		"marge_pct":                summary.MargePct,
		"marge_fcfa":               summary.MargeFCFA,
		"montant_net_agriculteurs": summary.MontantNetAgriculteurs,
		"lots":                     summary.Lines,
	})
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
	h.sendDepositNotification(c, actorID, req.Montant)
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

func (h *Handler) GetMargeCooperativeAdmin(c *gin.Context) {
	orgID := strings.TrimSpace(c.Query("org_id"))
	if orgID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "org_id requis"})
		return
	}
	margin, err := h.batch.GetCooperativeMargin(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "org_id": orgID, "margin": margin, "margin_pct": margin})
}

func (h *Handler) GetMargeCooperativeMe(c *gin.Context) {
	actorID := c.GetString(auth.ContextActorID)
	actor, err := h.actors.FindByID(c.Request.Context(), actorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "acteur introuvable"})
		return
	}
	orgID := actor.OrgID
	if orgID == "" {
		orgID = "CooperativeMSP"
	}
	margin, err := h.batch.GetCooperativeMargin(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "org_id": orgID, "margin": margin, "margin_pct": margin})
}

func (h *Handler) LotPaiementPreview(c *gin.Context) {
	batchID := c.Param("id")
	prixStr := c.Query("prix_par_kg")
	if prixStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prix_par_kg requis"})
		return
	}
	var prix float64
	if _, err := fmt.Sscanf(prixStr, "%f", &prix); err != nil || prix <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prix_par_kg invalide"})
		return
	}
	summary, err := h.batch.PreviewLotPayment(c.Request.Context(), batchID, prix)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success":                  true,
		"lot_id":                   batchID,
		"prix_par_kg":              summary.PrixParKg,
		"marge_pct":                summary.MargePct,
		"marge_fcfa":               summary.MargeFCFA,
		"montant_brut":             summary.MontantBrut,
		"montant_net":              summary.MontantNetAgriculteurs,
		"montant_total_debite":     summary.MontantTotalDebite,
		"lots":                     summary.Lines,
	})
}

// ---- ADMINISTRATION SYSTEME (CDC) ----

func (h *Handler) AdminListActors(c *gin.Context) {
	list, err := h.actors.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	p := parsePagination(c, 50, 500)
	pageItems, total := paginateSlice(list, p.Page, p.Limit)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"actors":  pageItems,
		"page":    p.Page,
		"limit":   p.Limit,
		"total":   total,
	})
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
	h.batch.EnsureDemoWalletCredit(c.Request.Context(), actor.ID, actor.Role)
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
