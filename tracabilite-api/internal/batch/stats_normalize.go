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
	if _, ok := out["active_lots"]; !ok {
		total := intFromAny(out["total_lots"])
		if total == 0 {
			total = intFromAny(out["total_batches"])
		}
		exp := intFromAny(out["exportes"])
		active := total - exp
		if active < 0 {
			active = 0
		}
		out["active_lots"] = active
	}
	return out
}

// FabricStatsEmpty indique si le ledger n’a pas renvoyé de volumes exploitables.
func FabricStatsEmpty(stats map[string]any) bool {
	if stats == nil {
		return true
	}
	if intFromAny(stats["total_lots"]) > 0 || intFromAny(stats["total_batches"]) > 0 {
		return false
	}
	if intFromAny(stats["total_weight"]) > 0 {
		return false
	}
	if note, ok := stats["note"].(string); ok && strings.Contains(strings.ToLower(note), "non implement") {
		return true
	}
	if _, ok := stats["fabric_stats_error"]; ok {
		return true
	}
	return intFromAny(stats["total_lots"]) == 0 && intFromAny(stats["total_batches"]) == 0
}

// MergeDashboardFallback complète les stats depuis PostgreSQL (sync_dedup, traçabilité).
func MergeDashboardFallback(stats map[string]any, syncLots int64, traceLots int64) map[string]any {
	stats = NormalizeDashboardStats(stats)
	if !FabricStatsEmpty(stats) {
		return stats
	}
	n := int(syncLots)
	if int(traceLots) > n {
		n = int(traceLots)
	}
	if n > 0 {
		stats["total_lots"] = n
		stats["total_batches"] = n
		if _, ok := stats["active_lots"]; !ok || intFromAny(stats["active_lots"]) == 0 {
			stats["active_lots"] = n
		}
	}
	return stats
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
