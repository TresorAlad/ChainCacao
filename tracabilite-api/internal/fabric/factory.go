package fabric

import (
	"fmt"
	"os"
)

// NewClientFromEnv selectionne Fabric Gateway (production) ou memoire (dev).
// Si FABRIC_PEER_ENDPOINT est vide, retourne InMemoryClient.
func NewClientFromEnv() (Client, error) {
	if os.Getenv("USE_INMEMORY_FABRIC") == "true" {
		return NewInMemoryClient(), nil
	}
	if os.Getenv("FABRIC_PEER_ENDPOINT") == "" {
		return NewInMemoryClient(), nil
	}
	gw, err := NewGatewayClientFromEnv()
	if err != nil {
		return nil, fmt.Errorf("fabric gateway: %w", err)
	}
	return gw, nil
}
