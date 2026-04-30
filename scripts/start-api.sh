#!/usr/bin/env bash
# ============================================================
# start-api.sh — Lance l'API ChainCacao (Postgres + Redis + API)
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/../tracabilite-api"

echo "=== ChainCacao API ==="
echo "Démarrage de la stack (Postgres + Redis + API Go)..."
docker compose up --build -d

echo ""
echo "Attente démarrage API..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/health >/dev/null 2>&1; then
    echo "API prête: http://localhost:8080"
    break
  fi
  sleep 2
done

echo ""
echo "Test rapide:"
curl -s http://localhost:8080/health | python3 -m json.tool

echo ""
echo "Logs (Ctrl+C pour quitter):"
docker compose logs -f api
