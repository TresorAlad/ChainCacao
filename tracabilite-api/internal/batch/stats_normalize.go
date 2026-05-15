package batch

import (
	"strings"
)

// NormalizeDashboardStats harmonise les clés renvoyées par Fabric / proxy pour l'UI ministère / admin.
func NormalizeDashboardStats(raw map[string]any) map[string]any {
	if raw == nil {
		raw = map[string]any{}
	}
	out := make(map[string]any, len(raw)+12)
	for k, v := range raw {
		out[k] = v
	}

	if _, ok := out["total_batches"]; !ok {
		if v, ok := out["total_lots"]; ok {
			out["total_batches"] = v
		}
	}
	if _, ok := out["total_lots"]; !ok {
		if v, ok := out["total_batches"]; ok {
			out["total_lots"] = v
		}
	}

	by := parseLotsByStatut(out["lots_by_statut"])
	if _, ok := out["en_transit"]; !ok {
		out["en_transit"] = countStatus(by, "en_transit")
	}
	if _, ok := out["exportes"]; !ok {
		out["exportes"] = countStatus(by, "exporte") + countStatus(by, "exporté")
	}
	return out
}

func parseLotsByStatut(v any) map[string]int {
	out := map[string]int{}
	switch m := v.(type) {
	case map[string]int:
		for k, n := range m {
			out[normalizeStatKey(k)] = n
		}
	case map[string]any:
		for k, val := range m {
			out[normalizeStatKey(k)] = intFromAny(val)
		}
	}
	return out
}

func normalizeStatKey(k string) string {
	return strings.ToLower(strings.TrimSpace(k))
}

func countStatus(by map[string]int, key string) int {
	if n, ok := by[normalizeStatKey(key)]; ok {
		return n
	}
	return 0
}

func intFromAny(v any) int {
	switch x := v.(type) {
	case int:
		return x
	case int32:
		return int(x)
	case int64:
		return int(x)
	case float64:
		return int(x)
	case float32:
		return int(x)
	default:
		return 0
	}
}

// IntFromAny expose un entier lisible depuis une valeur JSON (float64 côté décodeur).
func IntFromAny(v any) int {
	return intFromAny(v)
}
