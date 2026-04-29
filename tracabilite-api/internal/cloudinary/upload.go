package cloudinary

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"
)

// UploadResult reponse partielle API Cloudinary.
type UploadResult struct {
	PublicID   string `json:"public_id"`
	SecureURL  string `json:"secure_url"`
	Format     string `json:"format"`
	Bytes      int    `json:"bytes"`
}

// UploadImage envoie une image vers Cloudinary (upload non signe via preset, recommande cote front / mobile).
// Variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET (unsigned preset active sur le dashboard).
func UploadImage(ctx context.Context, fileName string, r io.Reader) (*UploadResult, error) {
	cloud := os.Getenv("CLOUDINARY_CLOUD_NAME")
	preset := os.Getenv("CLOUDINARY_UPLOAD_PRESET")
	if cloud == "" || preset == "" {
		return nil, fmt.Errorf("CLOUDINARY_CLOUD_NAME et CLOUDINARY_UPLOAD_PRESET requis")
	}
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	_ = w.WriteField("upload_preset", preset)
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
