package cloudinary

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

func sha1sum(data []byte) []byte {
	h := sha1.Sum(data)
	return h[:]
}

// UploadResult reponse partielle API Cloudinary.
type UploadResult struct {
	PublicID   string `json:"public_id"`
	SecureURL  string `json:"secure_url"`
	Format     string `json:"format"`
	Bytes      int    `json:"bytes"`
}

// UploadImage envoie une image vers Cloudinary.
// Si CLOUDINARY_UPLOAD_PRESET est defini -> upload non signe (unsigned preset).
// Sinon, si CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET sont definis -> upload signe (timestamp + sha1).
// Variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET ou CLOUDINARY_API_KEY+CLOUDINARY_API_SECRET.
func UploadImage(ctx context.Context, fileName string, r io.Reader) (*UploadResult, error) {
	cloud := os.Getenv("CLOUDINARY_CLOUD_NAME")
	preset := os.Getenv("CLOUDINARY_UPLOAD_PRESET")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")
	if cloud == "" {
		return nil, fmt.Errorf("CLOUDINARY_CLOUD_NAME requis")
	}
	if preset == "" && (apiKey == "" || apiSecret == "") {
		return nil, fmt.Errorf("CLOUDINARY_UPLOAD_PRESET ou (CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET) requis")
	}
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	if preset != "" {
		_ = w.WriteField("upload_preset", preset)
	} else {
		// Upload signé: timestamp + signature sha1(timestamp+secret)
		ts := fmt.Sprintf("%d", time.Now().Unix())
		raw := fmt.Sprintf("timestamp=%s%s", ts, apiSecret)
		sig := fmt.Sprintf("%x", sha1sum([]byte(raw)))
		_ = w.WriteField("timestamp", ts)
		_ = w.WriteField("api_key", apiKey)
		_ = w.WriteField("signature", sig)
	}
	part, err := w.CreateFormFile("file", fileName)
	if err != nil {
		return nil, err
	}
	if _, err := io.Copy(part, r); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloud)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, &buf)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("cloudinary %d: %s", resp.StatusCode, string(body))
	}
	var out UploadResult
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("decode cloudinary: %w", err)
	}
	if out.SecureURL == "" {
		return nil, fmt.Errorf("reponse cloudinary invalide")
	}
	return &out, nil
}
