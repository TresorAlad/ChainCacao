package fabric

import (
	"context"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/hash"
	"github.com/hyperledger/fabric-gateway/pkg/identity"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"tracabilite-api/pkg/models"
)

// GatewayClient appelle le chaincode via fabric-gateway (Fabric 2.5+).
// Contrat chaincode attendu (arguments string, JSON pour les lectures):
//   - CreateBatch(batchJSON, actorID) submit
//   - TransferBatch(batchID, fromActorID, toActorID, comment) submit
//   - UpdateBatchWeight(batchID, actorID, newWeight, justification) submit
//   - MarkBatchExported(batchID, actorID) submit
//   - GetBatch(batchID) evaluate -> JSON Batch
//   - GetHistory(batchID) evaluate -> JSON []BatchHistoryEvent
//   - GetStats() evaluate -> JSON object (optionnel; sinon erreur ignoree cote stats)
type GatewayClient struct {
	gw       *client.Gateway
	contract *client.Contract
	closeFn  func()
}

func NewGatewayClientFromEnv() (*GatewayClient, error) {
	mspID := os.Getenv("FABRIC_MSP_ID")
	if mspID == "" {
		mspID = "Org1MSP"
	}
	peerEndpoint := os.Getenv("FABRIC_PEER_ENDPOINT")
	if peerEndpoint == "" {
		return nil, errors.New("FABRIC_PEER_ENDPOINT requis pour le gateway")
	}
	gatewayPeer := os.Getenv("FABRIC_GATEWAY_PEER")
	if gatewayPeer == "" {
		gatewayPeer = "localhost"
	}
	tlsCertPath := os.Getenv("FABRIC_TLS_CERT_PATH")
	if tlsCertPath == "" {
		return nil, errors.New("FABRIC_TLS_CERT_PATH requis pour le gateway")
	}
	certPath := os.Getenv("FABRIC_SIGNCERT_PATH")
	keyPath := os.Getenv("FABRIC_KEY_PATH")
	signcertDir := os.Getenv("FABRIC_SIGNCERT_DIR")
	keyDir := os.Getenv("FABRIC_KEYSTORE_DIR")
	if certPath == "" && signcertDir == "" {
		return nil, errors.New("FABRIC_SIGNCERT_PATH ou FABRIC_SIGNCERT_DIR requis")
	}
	if keyPath == "" && keyDir == "" {
		return nil, errors.New("FABRIC_KEY_PATH ou FABRIC_KEYSTORE_DIR requis")
	}

	channel := os.Getenv("FABRIC_CHANNEL")
	if channel == "" {
		channel = "mychannel"
	}
	chaincode := os.Getenv("FABRIC_CHAINCODE")
	if chaincode == "" {
		chaincode = "chaincacao"
	}

	conn, err := newGrpcConnection(peerEndpoint, gatewayPeer, tlsCertPath)
	if err != nil {
		return nil, err
	}

	var certPEM []byte
	if certPath != "" {
		certPEM, err = os.ReadFile(certPath)
	} else {
		certPEM, err = readFirstFile(signcertDir)
	}
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("lire signcert: %w", err)
	}
	cert, err := identity.CertificateFromPEM(certPEM)
	if err != nil {
		conn.Close()
		return nil, err
	}
	id, err := identity.NewX509Identity(mspID, cert)
	if err != nil {
		conn.Close()
		return nil, err
	}
	var keyPEM []byte
	if keyPath != "" {
		keyPEM, err = os.ReadFile(keyPath)
	} else {
		keyPEM, err = readFirstFile(keyDir)
	}
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("lire cle: %w", err)
	}
	pk, err := identity.PrivateKeyFromPEM(keyPEM)
	if err != nil {
		conn.Close()
		return nil, err
	}
	sign, err := identity.NewPrivateKeySign(pk)
	if err != nil {
		conn.Close()
		return nil, err
	}

	gw, err := client.Connect(
		id,
		client.WithSign(sign),
		client.WithHash(hash.SHA256),
		client.WithClientConnection(conn),
		client.WithEvaluateTimeout(10*time.Second),
		client.WithEndorseTimeout(30*time.Second),
		client.WithSubmitTimeout(15*time.Second),
		client.WithCommitStatusTimeout(2*time.Minute),
	)
	if err != nil {
		conn.Close()
		return nil, err
	}

	network := gw.GetNetwork(channel)
	ctr := network.GetContract(chaincode)

	return &GatewayClient{
		gw:       gw,
		contract: ctr,
		closeFn: func() {
			gw.Close()
			conn.Close()
		},
	}, nil
}

func (g *GatewayClient) Close() {
	if g.closeFn != nil {
		g.closeFn()
	}
}

func newGrpcConnection(peerEndpoint, gatewayPeer, tlsCertPath string) (*grpc.ClientConn, error) {
	certificatePEM, err := os.ReadFile(tlsCertPath)
	if err != nil {
		return nil, fmt.Errorf("tls ca: %w", err)
	}
	certificate, err := identity.CertificateFromPEM(certificatePEM)
	if err != nil {
		return nil, err
	}
	pool := x509.NewCertPool()
	pool.AddCert(certificate)
	transportCredentials := credentials.NewClientTLSFromCert(pool, gatewayPeer)
	// grpc.Dial reste supporte en 1.x et fonctionne avec les targets dns:///...
	return grpc.Dial(peerEndpoint, grpc.WithTransportCredentials(transportCredentials))
}

func readFirstFile(dirPath string) ([]byte, error) {
	dir, err := os.Open(dirPath)
	if err != nil {
		return nil, err
	}
	defer dir.Close()
	names, err := dir.Readdirnames(1)
	if err != nil || len(names) == 0 {
		return nil, fmt.Errorf("aucun fichier dans %s", dirPath)
	}
	return os.ReadFile(path.Join(dirPath, names[0]))
}

func (g *GatewayClient) submit(ctx context.Context, fn string, args ...string) (txID string, result []byte, err error) {
	if ctx != nil {
		if err := ctx.Err(); err != nil {
			return "", nil, err
		}
	}
	submitResult, commit, err := g.contract.SubmitAsync(fn, client.WithArguments(args...))
	if err != nil {
		return "", nil, err
	}
	if ctx != nil {
		if err := ctx.Err(); err != nil {
			// La transaction a ete envoyee a l'orderer; on ne bloque pas davantage ici.
			return "", submitResult, err
		}
	}
	st, err := commit.Status()
	if err != nil {
		return "", submitResult, err
	}
	if !st.Successful {
		return "", submitResult, fmt.Errorf("transaction non valide: %v", st.Code)
	}
	return st.TransactionID, submitResult, nil
}

func (g *GatewayClient) CreateBatch(ctx context.Context, batch models.Batch, actorID string) (string, models.Batch, error) {
	payload, err := json.Marshal(batch)
	if err != nil {
		return "", models.Batch{}, err
	}
	txID, _, err := g.submit(ctx, "CreateBatch", string(payload), actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	got, err := g.GetBatch(ctx, batch.ID)
	if err != nil {
		return txID, batch, nil
	}
	return txID, got, nil
}

func (g *GatewayClient) TransferBatch(ctx context.Context, batchID, fromActorID, toActorID, commentaire string) (string, models.Batch, error) {
	txID, _, err := g.submit(ctx, "TransferBatch", batchID, fromActorID, toActorID, commentaire)
	if err != nil {
		return "", models.Batch{}, err
	}
	b, err := g.GetBatch(ctx, batchID)
	return txID, b, err
}

func (g *GatewayClient) UpdateBatchWeight(ctx context.Context, batchID, actorID string, newWeight float64, justification string) (string, models.Batch, error) {
	txID, _, err := g.submit(ctx, "UpdateBatchWeight", batchID, actorID, strconv.FormatFloat(newWeight, 'f', -1, 64), justification)
	if err != nil {
		return "", models.Batch{}, err
	}
	b, err := g.GetBatch(ctx, batchID)
	return txID, b, err
}

func (g *GatewayClient) MarkBatchExported(ctx context.Context, batchID, actorID string) (string, models.Batch, error) {
	txID, _, err := g.submit(ctx, "MarkBatchExported", batchID, actorID)
	if err != nil {
		return "", models.Batch{}, err
	}
	b, err := g.GetBatch(ctx, batchID)
	return txID, b, err
}

func (g *GatewayClient) GetBatch(ctx context.Context, batchID string) (models.Batch, error) {
	if ctx != nil {
		if err := ctx.Err(); err != nil {
			return models.Batch{}, err
		}
	}
	data, err := g.contract.EvaluateTransaction("GetBatch", batchID)
	if err != nil {
		return models.Batch{}, err
	}
	var b models.Batch
	if err := json.Unmarshal(data, &b); err != nil {
		return models.Batch{}, fmt.Errorf("decode batch: %w", err)
	}
	return b, nil
}

func (g *GatewayClient) GetHistory(ctx context.Context, batchID string) ([]models.BatchHistoryEvent, error) {
	if ctx != nil {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
	}
	data, err := g.contract.EvaluateTransaction("GetHistory", batchID)
	if err != nil {
		return nil, err
	}
	var ev []models.BatchHistoryEvent
	if err := json.Unmarshal(data, &ev); err != nil {
		return nil, fmt.Errorf("decode history: %w", err)
	}
	return ev, nil
}

func (g *GatewayClient) GetBatchesByOwner(ctx context.Context, actorID string) ([]models.Batch, error) {
	data, err := g.contract.EvaluateTransaction("GetBatchesByOwner", actorID)
	if err != nil {
		return nil, err
	}
	var batches []models.Batch
	if err := json.Unmarshal(data, &batches); err != nil {
		return nil, err
	}
	return batches, nil
}

func (g *GatewayClient) GetStats(ctx context.Context) map[string]any {
	if ctx != nil {
		if err := ctx.Err(); err != nil {
			return map[string]any{"fabric_stats_error": err.Error()}
		}
	}
	data, err := g.contract.EvaluateTransaction("GetStats")
	if err != nil {
		return map[string]any{"fabric_stats_error": err.Error()}
	}
	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		return map[string]any{"raw": string(data)}
	}
	return m
}

func (g *GatewayClient) GetRecentTransfers(ctx context.Context) ([]map[string]any, error) {
	// TODO: Implement actual smart contract call to get recent transfers
	// For now, return mock data
	return []map[string]any{
		{
			"id":       "TR-2026-0047",
			"date":     "02 Mai 2026",
			"sender":   "Coopérative N'zérékoré",
			"receiver": "Exportateur Lomé",
			"status":   "VALIDÉ",
		},
		{
			"id":       "TR-2026-0046",
			"date":     "01 Mai 2026",
			"sender":   "Agriculteur K. Koffi",
			"receiver": "Coopérative Nord",
			"status":   "EN_TRANSIT",
		},
		{
			"id":       "TR-2026-0045",
			"date":     "30 Avr 2026",
			"sender":   "Transformateur CACAOTG",
			"receiver": "Exportateur Lomé",
			"status":   "VALIDÉ",
		},
		{
			"id":       "TR-2026-0044",
			"date":     "29 Avr 2026",
			"sender":   "Coopérative Sud",
			"receiver": "Transformateur CACAOTG",
			"status":   "REJETÉ",
		},
	}, nil
}

func (g *GatewayClient) GetActivityChart(ctx context.Context) ([]map[string]any, error) {
	// TODO: Implement actual smart contract call to get activity chart data
	// For now, return mock data
	return []map[string]any{
		{"day": "Lun", "value": 142, "width": "85%"},
		{"day": "Mar", "value": 176, "width": "100%"},
		{"day": "Mer", "value": 124, "width": "70%"},
		{"day": "Jeu", "value": 188, "width": "95%"},
		{"day": "Ven", "value": 156, "width": "90%"},
		{"day": "Sam", "value": 87, "width": "50%"},
		{"day": "Dim", "value": 55, "width": "35%"},
	}, nil
}

func (g *GatewayClient) GetEUDRCompliance(ctx context.Context) (map[string]any, error) {
	// TODO: Implement actual smart contract call to get EUDR compliance
	// For now, return mock data
	return map[string]any{
		"percentage": 94,
		"status":     "Objectif Atteint",
	}, nil
}

func (g *GatewayClient) GetAlertsCount(ctx context.Context) (map[string]any, error) {
	// TODO: Implement actual smart contract call to get alerts count
	// For now, return mock data
	return map[string]any{
		"total":  38,
		"urgent": 5,
	}, nil
}
