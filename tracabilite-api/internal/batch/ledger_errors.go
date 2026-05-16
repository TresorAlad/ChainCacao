package batch

import (
	"errors"
	"strings"
)

// IsLedgerTransportError indique une panne réseau / résolution DNS / gRPC / Fabric
// (peer injoignable, TLS, timeout), distincte d’une erreur métier (ex. validation).
func IsLedgerTransportError(err error) bool {
	for err != nil {
		if ledgerTransportStringMatch(err.Error()) {
			return true
		}
		err = errors.Unwrap(err)
	}
	return false
}

func ledgerTransportStringMatch(msg string) bool {
	s := strings.ToLower(msg)
	if s == "" {
		return false
	}
	switch {
	case strings.Contains(s, "name resolver error"):
		return true
	case strings.Contains(s, "code = unavailable"):
		return true
	case strings.Contains(s, "rpc error") && strings.Contains(s, "unavailable"):
		return true
	case strings.Contains(s, "connection refused"):
		return true
	case strings.Contains(s, "connection reset"):
		return true
	case strings.Contains(s, "no such host"):
		return true
	case strings.Contains(s, "deadline exceeded"):
		return true
	case strings.Contains(s, "context deadline exceeded"):
		return true
	case strings.Contains(s, "i/o timeout"):
		return true
	case strings.Contains(s, "tls handshake"):
		return true
	case strings.Contains(s, "failed to dial"):
		return true
	// Chaincode déployé sans la transaction attendue (ex. GetBatchesByOwner) : dégradation gracieuse côté API.
	case strings.Contains(s, "not found in contract"):
		return true
	case strings.Contains(s, "function") && strings.Contains(s, "not found"):
		return true
	}
	return false
}
