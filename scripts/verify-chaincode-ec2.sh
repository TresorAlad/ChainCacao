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
CC_SEQUENCE="${CC_SEQUENCE:-2}"

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
echo "=== Commit readiness (séquence $CC_SEQUENCE) — les deux orgs doivent être true ==="
# shellcheck source=/dev/null
source "$ROOT/scripts/fabric-ec2-env.sh"
peer lifecycle chaincode checkcommitreadiness \
  --channelID "$CC_CHANNEL" --name "$CC_NAME" \
  --version 1.0 --sequence "$CC_SEQUENCE" \
  --tls --cafile "$ORDERER_CA" \
  --output json 2>/dev/null || peer lifecycle chaincode checkcommitreadiness \
  --channelID "$CC_CHANNEL" --name "$CC_NAME" \
  --version 1.0 --sequence "$CC_SEQUENCE" \
  --tls --cafile "$ORDERER_CA" || true

echo ""
echo "=== Conteneurs chaincode (docker) ==="
docker ps --format 'table {{.Names}}\t{{.Status}}' 2>/dev/null | grep -E 'dev-peer|chaincacao|NAMES' || echo "(docker inaccessible ou aucun conteneur dev-peer)"

echo ""
cat <<'EOF'

Interprétation de l’erreur API :
  « no combination of peers … endorsement policy … chaincodes are not installed on sufficient peers »

→ Au moins un peer du channel n’a pas le chaincode actif à la séquence commitée.

Correctif typique (séquence N déjà commitée, Org2 sans install) :
  1. Même package .tar.gz sur Org2 : peer lifecycle chaincode install chaincacao_cc_….tar.gz
  2. Org2 : approveformyorg avec le même PACKAGE_ID et la même SEQUENCE que querycommitted
  3. Redémarrer les peers si besoin : cd fabric-samples/test-network && ./network.sh restart
  4. docker compose -f tracabilite-api/docker-compose.yml up -d --build api

Si la séquence commitée est inférieure à celle attendue, relancer upgrade-chaincode-ec2.sh
avec CC_SEQUENCE=(dernière+1) et commit avec les DEUX peers :
  --peerAddresses localhost:7051 --tlsRootCertFiles …org1…/ca.crt
  --peerAddresses localhost:9051 --tlsRootCertFiles …org2…/ca.crt

EOF
