package batch

import (
	"testing"
)

func TestCanonicalSyncPayload_Order(t *testing.T) {
	in := CreateBatchInput{
		ClientLotID: "local_1",
		Culture:     "Cacao",
		Variete:     "Forastero",
		Quantite:    12.5,
		Lieu:        "Parcelle A",
		Latitude:    5.1,
		Longitude:   -3.2,
		Parcelle:    "Parcelle A",
		DateRecolte: "2026-05-01",
		Notes:       "note",
	}
	got, err := canonicalSyncPayload(in, "actor-1")
	if err != nil {
		t.Fatal(err)
	}
	want := `{"actor_id":"actor-1","client_lot_id":"local_1","culture":"Cacao","date_recolte":"2026-05-01","latitude":5.1,"longitude":-3.2,"lieu":"Parcelle A","quantite":12.5,"variete":"Forastero","parcelle":"Parcelle A","notes":"note"}`
	if got != want {
		t.Fatalf("canonical mismatch:\ngot:  %s\nwant: %s", got, want)
	}
}

func TestVerifySyncIntegrity_LegacyNoSig(t *testing.T) {
	if err := VerifySyncIntegrity(CreateBatchInput{Culture: "Cacao"}, "a"); err != nil {
		t.Fatal(err)
	}
}
