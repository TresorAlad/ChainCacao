#!/usr/bin/env bash
# ============================================================
# upgrade-chaincode-ec2.sh — Upgrade lifecycle du chaincode chaincacao
# sur un peer Fabric (ex. EC2). À lancer depuis la racine du dépôt.
#
# Usage (EC2) :
#   cd ~/ChainCacao
#   source scripts/fabric-ec2-env.sh
#   peer lifecycle chaincode querycommitted -C chaincacao-channel -n chaincacao   # voir Sequence
#   export CC_SEQUENCE=2   # = séquence actuelle + 1
#   ./scripts/upgrade-chaincode-ec2.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Auto-config si pas déjà sourcé
if [[ -z "${FABRIC_CFG_PATH:-}" ]] || [[ ! -f "${FABRIC_CFG_PATH}/core.yaml" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT/scripts/fabric-ec2-env.sh"
fi

CC_NAME="${CC_NAME:-chaincacao}"
CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
CC_SEQUENCE="${CC_SEQUENCE:-2}"
CC_LABEL="${CC_LABEL:-chaincacao_v2}"
CHAINCODE_DIR="${CHAINCODE_DIR:-$ROOT/chaincode}"
PKG_OUT="${PKG_OUT:-$ROOT/chaincacao_cc_${CC_LABEL}.tar.gz}"

command -v peer >/dev/null 2>&1 || {
  echo "peer CLI introuvable. Exécutez d'abord : source scripts/fabric-ec2-env.sh"
  exit 1
}

echo "=== Séquence commitée actuelle (vérifiez CC_SEQUENCE=$CC_SEQUENCE) ==="
peer lifecycle chaincode querycommitted -C "$CC_CHANNEL" -n "$CC_NAME" 2>/dev/null || echo "(aucun commit ou channel/peer inaccessible)"

echo ""
echo "=== Package chaincode ==="
peer lifecycle chaincode package "$PKG_OUT" \
  --path "$CHAINCODE_DIR" \
  --lang golang \
  --label "$CC_LABEL"

echo "=== Install sur le peer courant ==="
peer lifecycle chaincode install "$PKG_OUT"

echo "=== Package IDs installés ==="
peer lifecycle chaincode queryinstalled

echo ""
echo "Copier le PACKAGE_ID (label $CC_LABEL), puis :"
echo ""
echo "  source scripts/fabric-ec2-env.sh"
echo "  export PACKAGE_ID='<${CC_LABEL}:hash...>'"
echo "  peer lifecycle chaincode approveformyorg \\"
echo "    --channelID $CC_CHANNEL --name $CC_NAME \\"
echo "    --version 1.0 --package-id \"\$PACKAGE_ID\" --sequence $CC_SEQUENCE \\"
echo "    --tls --cafile \"\$ORDERER_CA\""
echo ""
echo "  peer lifecycle chaincode commit \\"
echo "    --channelID $CC_CHANNEL --name $CC_NAME \\"
echo "    --version 1.0 --sequence $CC_SEQUENCE \\"
echo "    --tls --cafile \"\$ORDERER_CA\" \\"
echo "    --peerAddresses \"\$CORE_PEER_ADDRESS\" \\"
echo "    --tlsRootCertFiles \"\$PEER_TLS_ROOTCERT\""
echo ""
