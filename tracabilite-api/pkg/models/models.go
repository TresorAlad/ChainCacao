package models

type Role string

const (
	RoleAdmin          Role = "admin"
	RoleAgriculteur    Role = "agriculteur"
	RoleTransformateur Role = "transformateur"
	RoleDistributeur   Role = "distributeur"
)

type Batch struct {
	ID            string  `json:"id"`
	Culture       string  `json:"culture"`
	Quantite      float64 `json:"quantite"`
	Lieu          string  `json:"lieu"`
	DateRecolte   string  `json:"date_recolte"`
	Proprietaire  string  `json:"proprietaire_id"`
	OrgID         string  `json:"org_id"`
	Statut        string  `json:"statut"`
	Timestamp     string  `json:"timestamp"`
	CertificatURL string  `json:"certificat_url,omitempty"`
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
	ID    string `json:"id"`
	Nom   string `json:"nom"`
	OrgID string `json:"org_id"`
	Role  Role   `json:"role"`
	PIN   string `json:"-"`
}

type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}
