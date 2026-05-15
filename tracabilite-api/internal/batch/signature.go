package batch

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"strings"
)

var secp256k1 = &elliptic.CurveParams{
	Name:    "secp256k1",
	BitSize: 256,
	P:       hexToBig("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F"),
	N:       hexToBig("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141"),
	B:       big.NewInt(7),
	Gx:      hexToBig("79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"),
	Gy:      hexToBig("483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FB10D4B8"),
}

func hexToBig(h string) *big.Int {
	b, _ := hex.DecodeString(h)
	return new(big.Int).SetBytes(b)
}

// syncCanon — ordre des champs aligné sur lib/lot-payload.ts (JSON.stringify).
type syncCanon struct {
	ActorID     string  `json:"actor_id"`
	ClientLotID string  `json:"client_lot_id"`
	Culture     string  `json:"culture"`
	DateRecolte string  `json:"date_recolte"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Lieu        string  `json:"lieu"`
	Quantite    float64 `json:"quantite"`
	Variete     string  `json:"variete,omitempty"`
	Parcelle    string  `json:"parcelle,omitempty"`
	Notes       string  `json:"notes,omitempty"`
}

func canonicalSyncPayload(input CreateBatchInput, actorID string) (string, error) {
	c := syncCanon{
		ActorID:     actorID,
		ClientLotID: input.ClientLotID,
		Culture:     input.Culture,
		DateRecolte: input.DateRecolte,
		Latitude:    input.Latitude,
		Longitude:   input.Longitude,
		Lieu:        input.Lieu,
		Quantite:    input.Quantite,
	}
	if strings.TrimSpace(input.Variete) != "" {
		c.Variete = input.Variete
	}
	if strings.TrimSpace(input.Parcelle) != "" {
		c.Parcelle = input.Parcelle
	}
	if strings.TrimSpace(input.Notes) != "" {
		c.Notes = input.Notes
	}
	b, err := json.Marshal(c)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// VerifySyncIntegrity valide le hash SHA-256 du payload et, si fournie, la signature ECDSA secp256k1.
func VerifySyncIntegrity(input CreateBatchInput, actorID string) error {
	if input.PayloadHash == "" && input.Signature == "" {
		return nil
	}
	if input.PayloadHash == "" {
		return errors.New("integrite: payload_hash manquant")
	}
	canonical, err := canonicalSyncPayload(input, actorID)
	if err != nil {
		return err
	}
	sum := sha256.Sum256([]byte(canonical))
	expected := hex.EncodeToString(sum[:])
	if !strings.EqualFold(strings.TrimSpace(input.PayloadHash), expected) {
		return fmt.Errorf("integrite: hash payload invalide")
	}
	if input.Signature == "" {
		return nil
	}
	if input.SignerPubKey == "" {
		return errors.New("integrite: signer_pubkey manquant")
	}
	return verifySecp256k1Signature(sum[:], input.Signature, input.SignerPubKey)
}

func verifySecp256k1Signature(msgHash []byte, sigHex, pubHex string) error {
	sig, err := hex.DecodeString(strings.TrimPrefix(strings.TrimSpace(sigHex), "0x"))
	if err != nil {
		return fmt.Errorf("integrite: signature invalide: %w", err)
	}
	pubBytes, err := hex.DecodeString(strings.TrimPrefix(strings.TrimSpace(pubHex), "0x"))
	if err != nil {
		return fmt.Errorf("integrite: cle publique invalide: %w", err)
	}
	pub, err := parseSecp256k1PubKey(pubBytes)
	if err != nil {
		return err
	}
	if len(sig) != 64 {
		return errors.New("integrite: longueur signature attendue 64 octets")
	}
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:])
	if !ecdsa.Verify(pub, msgHash, r, s) {
		return errors.New("integrite: signature ECDSA invalide")
	}
	return nil
}

func parseSecp256k1PubKey(b []byte) (*ecdsa.PublicKey, error) {
	switch len(b) {
	case 33:
		if b[0] != 0x02 && b[0] != 0x03 {
			return nil, errors.New("integrite: prefixe cle compressee invalide")
		}
		x, y := decompressSecp256k1(b)
		return &ecdsa.PublicKey{Curve: secp256k1, X: x, Y: y}, nil
	case 65:
		if b[0] != 0x04 {
			return nil, errors.New("integrite: prefixe cle non compressee invalide")
		}
		x := new(big.Int).SetBytes(b[1:33])
		y := new(big.Int).SetBytes(b[33:65])
		return &ecdsa.PublicKey{Curve: secp256k1, X: x, Y: y}, nil
	default:
		return nil, fmt.Errorf("integrite: taille cle publique %d non supportee", len(b))
	}
}

func decompressSecp256k1(compressed []byte) (*big.Int, *big.Int) {
	curve := secp256k1
	x := new(big.Int).SetBytes(compressed[1:])
	y2 := new(big.Int).Exp(x, big.NewInt(3), curve.P)
	y2.Add(y2, curve.B)
	y2.Mod(y2, curve.P)
	y := new(big.Int).ModSqrt(y2, curve.P)
	if y == nil {
		return x, big.NewInt(0)
	}
	if (compressed[0] == 0x03) != (y.Bit(0) == 1) {
		y.Sub(curve.P, y)
	}
	return x, y
}
