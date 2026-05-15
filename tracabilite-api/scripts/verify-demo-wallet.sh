#!/usr/bin/env bash
# Vérification rapide (VM ou local) : santé API + inscription transformateur + solde démo.
# Usage :
#   BASE_URL=http://127.0.0.1:8080 ./scripts/verify-demo-wallet.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
BASE_URL="${BASE_URL%/}"
HEALTH="$BASE_URL/health"
SIGNUP="$BASE_URL/api/v1/auth/signup"

pretty_json() {
  if command -v jq >/dev/null 2>&1; then
    echo "$1" | jq .
  elif command -v python3 >/dev/null 2>&1; then
    echo "$1" | python3 -m json.tool 2>/dev/null || echo "$1"
  else
    echo "$1"
  fi
}

echo "== GET $HEALTH =="
code=$(curl -sS -o /tmp/cc_health.json -w '%{http_code}' "$HEALTH" || true)
echo "HTTP $code"
if [[ "$code" != "200" ]]; then
  echo "Échec health. Corrigez le serveur ou BASE_URL."
  exit 1
fi
pretty_json "$(cat /tmp/cc_health.json)"
echo ""

RAND=$(date +%s%N | sha256sum | head -c 8)
EMAIL="verify-demo-${RAND}@example.invalid"
BODY="{\"nom\":\"Verify Demo\",\"email\":\"${EMAIL}\",\"password\":\"TestPassw0rd!\",\"role\":\"transformateur\",\"org_id\":\"\",\"gps_location\":\"\",\"field_surface\":\"\",\"org_name\":\"Demo Org\",\"pin_code\":\"1234\"}"

echo "== POST $SIGNUP (transformateur) =="
resp=$(curl -sS -w '\n%{http_code}' -X POST "$SIGNUP" \
  -H 'Content-Type: application/json' \
  -d "$BODY")
http=$(echo "$resp" | tail -n1)
json=$(echo "$resp" | sed '$d')
echo "HTTP $http"
pretty_json "$json"

if [[ "$http" != "201" && "$http" != "200" ]]; then
  echo "Inscription refusée."
  exit 1
fi

bal=""
warn=""
if command -v jq >/dev/null 2>&1; then
  bal=$(echo "$json" | jq -r '.wallet_balance // empty')
  warn=$(echo "$json" | jq -r '.wallet_credit_warning // empty')
fi

echo ""
if [[ -n "$bal" ]]; then
  echo "wallet_balance (réponse signup) : $bal"
fi
if [[ -n "$warn" ]]; then
  echo "wallet_credit_warning : $warn"
fi
echo "Terminé."
