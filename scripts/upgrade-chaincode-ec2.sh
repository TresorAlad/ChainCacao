#!/usr/bin/env bash
# ============================================================
# upgrade-chaincode-ec2.sh — Upgrade lifecycle du chaincode chaincacao
# sur un peer Fabric (ex. EC2). À lancer depuis la racine du dépôt.
#
# Prérequis : peer CLI, variables d'environnement ci-dessous renseignées.
#
# Exemple (adapter les chemins à votre test-network / org) :
#   export CC_NAME=chaincacao
#   export CC_CHANNEL=chaincacao-channel
#   export CC_SEQUENCE=2
#   export CC_LABEL=chaincacao_v2
#   export FABRIC_CFG_PATH=$HOME/ChainCacao/fabric-samples/config
#   export PATH=$PATH:$HOME/chaincacao/fabric-samples/bin
#   export CORE_PEER_TLS_ENABLED=true
#   export CORE_PEER_LOCALMSPID=Org1MSP
#   export CORE_PEER_MSPCONFIGPATH=$HOME/chaincacao/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
#   export CORE_PEER_ADDRESS=localhost:7051
#   export ORDERER_CA=$HOME/chaincacao/fabric-samples/test-network/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
#   export PEER_TLS_ROOTCERT=$HOME/chaincacao/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
#
#   ./scripts/upgrade-chaincode-ec2.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CC_NAME="${CC_NAME:-chaincacao}"
CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
CC_SEQUENCE="${CC_SEQUENCE:-2}"
CC_LABEL="${CC_LABEL:-chaincacao_v2}"
CHAINCODE_DIR="${CHAINCODE_DIR:-$ROOT/chaincode}"
PKG_OUT="${PKG_OUT:-$ROOT/chaincacao_cc_${CC_LABEL}.tar.gz}"

: "${FABRIC_CFG_PATH:?Définir FABRIC_CFG_PATH (répertoire contenant core.yaml, ex. fabric-samples/config)}"
command -v peer >/dev/null 2>&1 || { echo "peer CLI introuvable (ajouter fabric-samples/bin au PATH)"; exit 1; }

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
echo "Copier le PACKAGE_ID affiché (colonne Label: $CC_LABEL), puis exécuter :"
echo ""
echo "  export PACKAGE_ID='<chaincacao_v2:hash...>'"
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
echo "Note Fabric 2.x : --version est souvent 1.0 pour toutes les révisions ;"
echo "seul --sequence doit s'incrémenter (1, 2, 3, ...). Vérifier la séquence actuelle :"
echo "  peer lifecycle chaincode querycommitted -C $CC_CHANNEL -n $CC_NAME"
echo ""
