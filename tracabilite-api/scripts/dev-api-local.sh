#!/usr/bin/env bash
# Démarre postgres + redis en Docker, puis l'API Go en local (recompile en ~1–3 s à chaque sauvegarde).
# Usage : depuis tracabilite-api/  →  ./scripts/dev-api-local.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Démarrage postgres + redis (si pas déjà lancés) ==="
docker compose up -d postgres redis

# Chargement .env sans exécuter de commandes (lignes simples KEY=VAL)
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^\s*[A-Za-z_][A-Za-z0-9_]*=' .env | sed 's/^\s*export\s\+//')
  set +a
fi

# Postgres exposé par docker-compose.yml sur le host : 5433
export DATABASE_URL="${DATABASE_URL:-postgresql://chaincacao:chaincacao@127.0.0.1:5433/chaincacao?sslmode=disable}"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
export PORT="${PORT:-8080}"

echo "=== API sur http://127.0.0.1:${PORT} (Ctrl+C pour arrêter) ==="
echo "DATABASE_URL=${DATABASE_URL%%\?*}..."
exec go run ./cmd/api
