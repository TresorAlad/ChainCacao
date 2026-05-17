#!/usr/bin/env bash
# Commit chaincode déjà approuvé (reprise après approve Org1+Org2).
# Usage :
#   source scripts/fabric-ec2-env.sh
#   export CC_SEQUENCE=3   # séquence approuvée
#   ./scripts/commit-chaincode-ec2.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
source "$ROOT/scripts/fabric-ec2-env.sh"

CC_NAME="${CC_NAME:-chaincacao}"
CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
CC_VERSION="${CC_VERSION:-1.0}"
CC_SEQUENCE="${CC_SEQUENCE:?export CC_SEQUENCE= (ex. 3)}"

TN="$ROOT/fabric-samples/test-network"
ORG1_TLS="$TN/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
ORG2_TLS="$TN/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
PEER1="${CORE_PEER_ADDRESS_ORG1:-localhost:7051}"
PEER2="${CORE_PEER_ADDRESS_ORG2:-localhost:9051}"

echo "Commit $CC_NAME seq=$CC_SEQUENCE sur $CC_CHANNEL (identité Org1)…"
peer lifecycle chaincode checkcommitreadiness \
  --channelID "$CC_CHANNEL" --name "$CC_NAME" \
  --version "$CC_VERSION" --sequence "$CC_SEQUENCE" \
  --tls --cafile "$ORDERER_CA" $ORDERER_OPTS --output json || true

peer lifecycle chaincode commit \
  --channelID "$CC_CHANNEL" --name "$CC_NAME" \
  --version "$CC_VERSION" --sequence "$CC_SEQUENCE" \
  --tls --cafile "$ORDERER_CA" $ORDERER_OPTS \
  --peerAddresses "$PEER1" --tlsRootCertFiles "$ORG1_TLS" \
  --peerAddresses "$PEER2" --tlsRootCertFiles "$ORG2_TLS"

echo ""
peer lifecycle chaincode querycommitted -C "$CC_CHANNEL" -n "$CC_NAME"
