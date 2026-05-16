#!/usr/bin/env bash
# Délègue vers le script réel sous tracabilite-api/scripts/
# Usage depuis la racine du dépôt :
#   BASE_URL=http://127.0.0.1:8080 bash scripts/smoke_transfer_payment.sh
# Usage depuis tracabilite-api/ :
#   BASE_URL=http://127.0.0.1:8080 bash ../scripts/smoke_transfer_payment.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec bash "$ROOT/tracabilite-api/scripts/smoke_transfer_payment.sh" "$@"
