package fabric

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"tracabilite-api/pkg/models"
)

type ProxyClient struct {
	baseURL    string
	token      string
	httpClient *http.Client
}

func NewProxyClientFromEnv() (*ProxyClient, error) {
	base := strings.TrimSpace(os.Getenv("FABRIC_PROXY_URL"))
	if base == "" {
		return nil, errors.New("FABRIC_PROXY_URL requis")
	}
	base = strings.TrimRight(base, "/")
	return &ProxyClient{
		baseURL: base,
		token:   os.Getenv("FABRIC_PROXY_TOKEN"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}, nil
}

func (c *ProxyClient) doJSON(ctx context.Context, method, p string, in any, out any) error {
	var body []byte
	var err error
	if in != nil {
		body, err = json.Marshal(in)
		if err != nil {
			return err
		}
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+p, bytes.NewReader(body))
	if err != nil {
		return err
	}
	if in != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if c.token != "" {
		req.Header.Set("X-Proxy-Token", c.token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var e struct {
			Error string `json:"error"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&e)
		if e.Error == "" {
			e.Error = resp.Status
		}
		return fmt.Errorf("fabric proxy: %s", e.Error)
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

type proxyTxBatchResponse struct {
	TxHash string      `json:"tx_hash"`
	Batch  models.Batch `json:"batch"`
}

func (c *ProxyClient) CreateBatch(ctx context.Context, batch models.Batch, actorID string) (string, models.Batch, error) {
	var out proxyTxBatchResponse
	err := c.doJSON(ctx, http.MethodPost, "/v1/fabric/batch/create", map[string]any{
		"batch":    batch,
		"actor_id": actorID,
	}, &out)
	return out.TxHash, out.Batch, err
}

func (c *ProxyClient) TransferBatch(ctx context.Context, batchID, fromActorID, toActorID, commentaire string) (string, models.Batch, error) {
	var out proxyTxBatchResponse
	err := c.doJSON(ctx, http.MethodPost, "/v1/fabric/batch/transfer", map[string]any{
		"batch_id":     batchID,
		"from_actor_id": fromActorID,
		"to_actor_id":   toActorID,
		"commentaire":   commentaire,
	}, &out)
	return out.TxHash, out.Batch, err
}

func (c *ProxyClient) UpdateBatchWeight(ctx context.Context, batchID, actorID string, newWeight float64, justification string) (string, models.Batch, error) {
	var out proxyTxBatchResponse
	err := c.doJSON(ctx, http.MethodPost, "/v1/fabric/batch/weight", map[string]any{
		"batch_id":      batchID,
		"actor_id":      actorID,
		"new_weight":    newWeight,
		"justification": justification,
	}, &out)
	return out.TxHash, out.Batch, err
}

func (c *ProxyClient) MarkBatchExported(ctx context.Context, batchID, actorID string) (string, models.Batch, error) {
	var out proxyTxBatchResponse
	err := c.doJSON(ctx, http.MethodPost, "/v1/fabric/batch/export", map[string]any{
		"batch_id": batchID,
		"actor_id": actorID,
	}, &out)
	return out.TxHash, out.Batch, err
}

func (c *ProxyClient) GetBatch(ctx context.Context, batchID string) (models.Batch, error) {
	var out struct {
		Batch models.Batch `json:"batch"`
	}
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/batch/"+batchID, nil, &out)
	return out.Batch, err
}

func (c *ProxyClient) GetHistory(ctx context.Context, batchID string) ([]models.BatchHistoryEvent, error) {
	var out struct {
		Events []models.BatchHistoryEvent `json:"events"`
	}
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/batch/"+batchID+"/history", nil, &out)
	return out.Events, err
}

func (c *ProxyClient) GetBatchesByOwner(ctx context.Context, actorID string) ([]models.Batch, error) {
	var out struct {
		Batches []models.Batch `json:"batches"`
	}
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/batches/owner/"+actorID, nil, &out)
	return out.Batches, err
}

func (c *ProxyClient) GetStats(ctx context.Context) map[string]any {
	var out map[string]any
	if err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/stats", nil, &out); err != nil {
		return map[string]any{"fabric_stats_error": err.Error()}
	}
	return out
}

func (c *ProxyClient) GetRecentTransfers(ctx context.Context) ([]map[string]any, error) {
	var out []map[string]any
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/dashboard/recent-transfers", nil, &out)
	return out, err
}

func (c *ProxyClient) GetActivityChart(ctx context.Context) ([]map[string]any, error) {
	var out []map[string]any
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/dashboard/activity-chart", nil, &out)
	return out, err
}

func (c *ProxyClient) GetEUDRCompliance(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/dashboard/eudr-compliance", nil, &out)
	return out, err
}

func (c *ProxyClient) GetAlertsCount(ctx context.Context) (map[string]any, error) {
	var out map[string]any
	err := c.doJSON(ctx, http.MethodGet, "/v1/fabric/dashboard/alerts-count", nil, &out)
	return out, err
}

