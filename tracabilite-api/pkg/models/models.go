package models

type Role string

const (
	RoleAdmin          Role = "admin"
	RoleAgriculteur    Role = "agriculteur"
	RoleCooperative    Role = "cooperative"
	RoleTransformateur Role = "transformateur"
	RoleDistributeur   Role = "distributeur"
)

type Batch struct {
	ID            string  `json:"id"`
	Culture       string  `json:"culture"`
	Variete       string  `json:"variete,omitempty"`
	Quantite      float64 `json:"quantite"`
	Lieu          string  `json:"lieu"`
	Latitude      float64 `json:"latitude,omitempty"`
	Longitude     float64 `json:"longitude,omitempty"`
	Region        string  `json:"region,omitempty"`
	Village       string  `json:"village,omitempty"`
	Parcelle      string  `json:"parcelle,omitempty"`
	DateRecolte   string  `json:"date_recolte"`
	Proprietaire  string  `json:"proprietaire_id"`
	OrgID         string  `json:"org_id"`
	Statut        string  `json:"statut"`
	EUDRConforme  bool    `json:"eudr_conforme"`
	Timestamp     string  `json:"timestamp"`
	CertificatURL string  `json:"certificat_url,omitempty"`
	PhotoURL      string  `json:"photo_url,omitempty"`
	Notes         string  `json:"notes,omitempty"`
}

type BatchHistoryEvent struct {
	BatchID      string `json:"batch_id"`
	Type         string `json:"type"`
	FromActorID  string `json:"from_actor_id,omitempty"`
	ToActorID    string `json:"to_actor_id,omitempty"`
	Commentaire  string `json:"commentaire,omitempty"`
	TxHash       string `json:"tx_hash"`
	ActorID      string `json:"actor_id,omitempty"`
	CreatedAtISO string `json:"created_at"`
	Payload      Batch  `json:"payload"`
}

type Actor struct {
	ID           string `json:"id"`
	Nom          string `json:"nom"`
	Email        string `json:"email,omitempty"`
	OrgID        string `json:"org_id"`
	Role         Role   `json:"role"`
	PIN          string `json:"-"`
	PasswordHash string `json:"-"`
}

type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}
