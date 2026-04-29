package report

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
)

// BuildEUDRPDF genere un PDF rapport EUDR a partir du dictionnaire report (JSON-serialisable).
// Si EUDR_RSA_PRIVATE_KEY_PEM est defini, ajoute une signature RSA-PKCS1v15 (SHA-256) sur le hash du contenu canonique.
func BuildEUDRPDF(report map[string]any) ([]byte, error) {
	canonical, err := json.Marshal(report)
	if err != nil {
		return nil, err
	}
	sum := sha256.Sum256(canonical)

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetTitle("Rapport EUDR - ChainCacao", false)
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 14)
	pdf.Cell(40, 10, "Rapport de tracabilite EUDR")
	pdf.Ln(12)
	pdf.SetFont("Arial", "", 11)
	pdf.MultiCell(0, 6, fmt.Sprintf("Genere le (UTC): %s", time.Now().UTC().Format(time.RFC3339)), "", "L", false)
	pdf.Ln(4)

	pdf.SetFont("Arial", "B", 11)
	pdf.Cell(0, 8, "Donnees structurees (resume)")
	pdf.Ln(8)
	pdf.SetFont("Courier", "", 8)
	lines := strings.Split(prettyJSON(report), "\n")
	for _, line := range lines {
		if pdf.GetY() > 270 {
			pdf.AddPage()
		}
		pdf.MultiCell(0, 4, line, "", "L", false)
	}
	pdf.Ln(6)
	pdf.SetFont("Arial", "", 10)
	pdf.MultiCell(0, 6, fmt.Sprintf("Empreinte SHA-256 du JSON canonique: %x", sum), "", "L", false)

	sigBlock := "Signature numerique: non configuree (definir EUDR_RSA_PRIVATE_KEY_PEM pour activer RSA-SHA256)."
	if pemData := strings.TrimSpace(os.Getenv("EUDR_RSA_PRIVATE_KEY_PEM")); pemData != "" {
		sig, err := signRSAPKCS1v15(pemData, sum[:])
		if err != nil {
			sigBlock = "Signature: erreur — " + err.Error()
		} else {
			sigBlock = "Signature RSA-PKCS1v15 (SHA-256, base64):\n" + base64.StdEncoding.EncodeToString(sig)
		}
	}
	pdf.Ln(4)
	pdf.SetFont("Arial", "", 9)
	pdf.MultiCell(0, 5, sigBlock, "", "L", false)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func prettyJSON(v any) string {
	var b bytes.Buffer
	enc := json.NewEncoder(&b)
	enc.SetIndent("", "  ")
	_ = enc.Encode(v)
	return strings.TrimSpace(b.String())
}

func signRSAPKCS1v15(pemStr string, digest []byte) ([]byte, error) {
	block, _ := pem.Decode([]byte(pemStr))
	if block == nil {
		return nil, fmt.Errorf("cle PEM invalide")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest)
	}
	keyAny, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	priv, ok := keyAny.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("cle RSA attendue")
	}
	return rsa.SignPKCS1v15(rand.Reader, priv, crypto.SHA256, digest)
}
