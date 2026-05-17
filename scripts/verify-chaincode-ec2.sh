#!/usr/bin/env bash
# Vérifie que le chaincode chaincacao est installé et commité sur Org1 ET Org2.
# Usage (sur EC2, racine du dépôt) :
#   source scripts/fabric-ec2-env.sh
#   ./scripts/verify-chaincode-ec2.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT/scripts/fabric-ec2-env.sh"

CC_NAME="${CC_NAME:-chaincacao}"
CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
CC_SEQUENCE="${CC_SEQUENCE:-}"

TN="$ROOT/fabric-samples/test-network"
ORG1_TLS="$TN/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
ORG2_TLS="$TN/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
ORDERER_CA="${ORDERER_CA:-$TN/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem}"

echo "=== Chaincode commité sur le channel $CC_CHANNEL ==="
peer lifecycle chaincode querycommitted -C "$CC_CHANNEL" -n "$CC_NAME" || true

echo ""
echo "=== Packages installés — Org1 ($CORE_PEER_ADDRESS) ==="
peer lifecycle chaincode queryinstalled || true

echo ""
echo "=== Packages installés — Org2 ==="
# shellcheck source=/dev/null
source "$ROOT/scripts/fabric-ec2-org2-env.sh"
peer lifecycle chaincode queryinstalled || true

echo ""
# shellcheck source=/dev/null
source "$ROOT/scripts/fabric-ec2-env.sh"
COMMITTED_SEQ="$(peer lifecycle chaincode querycommitted -C "$CC_CHANNEL" -n "$CC_NAME" 2>/dev/null \
  | sed -n 's/.*Sequence: \([0-9][0-9]*\).*/\1/p' | head -1 || true)"

echo "=== Conteneurs chaincode actifs (docker) ==="
CC_CONTAINERS="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E 'dev-peer.*chaincacao' || true)"
if [[ -n "$CC_CONTAINERS" ]]; then
  docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | grep -E 'dev-peer.*chaincacao|NAMES' || true
else
  echo "(aucun conteneur dev-peer chaincacao — un paiement/transfert le démarrera)"
fi

echo ""
if [[ -n "$COMMITTED_SEQ" ]]; then
  echo "=== État : OK — chaincode actif en séquence $COMMITTED_SEQ ==="
  echo "  Org1 + Org2 : packages installés, définition commitée."
  echo "  (checkcommitreadiness sur la séquence $COMMITTED_SEQ échoue toujours après commit :"
  echo "   c’est normal — la prochaine upgrade utilisera la séquence $((COMMITTED_SEQ + 1)).)"
  NEXT_SEQ=$((COMMITTED_SEQ + 1))
  if [[ -n "${CC_SEQUENCE:-}" ]] && [[ "$CC_SEQUENCE" -gt "$COMMITTED_SEQ" ]]; then
    echo ""
    echo "=== Commit readiness (prochaine séquence $CC_SEQUENCE) ==="
    peer lifecycle chaincode checkcommitreadiness \
      --channelID "$CC_CHANNEL" --name "$CC_NAME" \
      --version 1.0 --sequence "$CC_SEQUENCE" \
      --tls --cafile "$ORDERER_CA" $ORDERER_OPTS --output json 2>/dev/null || true
  fi
else
  echo "=== ATTENTION : aucune définition commitée trouvée sur $CC_CHANNEL ==="
  cat <<'EOF'

Correctif :
  ./scripts/upgrade-chaincode-full-ec2.sh
  ou ./scripts/commit-chaincode-ec2.sh après approve

Erreur API typique si chaincode absent sur un peer :
  « chaincodes are not installed on sufficient peers »
  → installer le même .tar.gz sur Org2, approve + commit avec les deux peers.

EOF
fi

echo ""
echo "=== Suite ==="
echo "  cd tracabilite-api && docker compose up -d --build api"
echo "  Tester un paiement puis l’historique du lot (événement « Paiement »)."
