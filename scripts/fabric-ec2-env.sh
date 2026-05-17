#!/usr/bin/env bash
# Source depuis la racine du dépôt : source scripts/fabric-ec2-env.sh
# Configure peer CLI + MSP pour upgrade chaincode sur EC2 (test-network).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export FABRIC_CFG_PATH="${FABRIC_CFG_PATH:-$ROOT/fabric-samples/config}"
export PATH="$ROOT/fabric-samples/bin:${PATH}"

export CC_NAME="${CC_NAME:-chaincacao}"
export CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
export CC_LABEL="${CC_LABEL:-chaincacao_v2}"
# Ne pas fixer CC_SEQUENCE ici : l’upgrade doit utiliser (séquence commitée + 1).

TN="$ROOT/fabric-samples/test-network"
ORG1="$TN/organizations/peerOrganizations/org1.example.com"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH="${CORE_PEER_MSPCONFIGPATH:-$ORG1/users/Admin@org1.example.com/msp}"
export CORE_PEER_ADDRESS="${CORE_PEER_ADDRESS:-localhost:7051}"
export CORE_PEER_TLS_ROOTCERT_FILE="${CORE_PEER_TLS_ROOTCERT_FILE:-$ORG1/peers/peer0.org1.example.com/tls/ca.crt}"

export ORDERER_CA="${ORDERER_CA:-$TN/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem}"
export PEER_TLS_ROOTCERT="${PEER_TLS_ROOTCERT:-$CORE_PEER_TLS_ROOTCERT_FILE}"

# Sur EC2, orderer.example.com ne résout pas en DNS : joindre localhost + override TLS.
export ORDERER_ADDRESS="${ORDERER_ADDRESS:-localhost:7050}"
export ORDERER_TLS_HOSTNAME_OVERRIDE="${ORDERER_TLS_HOSTNAME_OVERRIDE:-orderer.example.com}"
export ORDERER_OPTS="-o ${ORDERER_ADDRESS} --ordererTLSHostnameOverride ${ORDERER_TLS_HOSTNAME_OVERRIDE}"

if [[ ! -f "$FABRIC_CFG_PATH/core.yaml" ]]; then
  echo "ERREUR: core.yaml introuvable dans FABRIC_CFG_PATH=$FABRIC_CFG_PATH"
  echo "  Vérifiez que fabric-samples est présent (bash scripts/deploy-fabric.sh ou clone fabric-samples)."
  return 1 2>/dev/null || exit 1
fi

if ! command -v peer >/dev/null 2>&1; then
  echo "ERREUR: peer CLI introuvable. Ajoutez les binaires Fabric :"
  echo "  cd $ROOT/fabric-samples && curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary"
  return 1 2>/dev/null || exit 1
fi

echo "OK — Fabric EC2"
echo "  ROOT=$ROOT"
echo "  FABRIC_CFG_PATH=$FABRIC_CFG_PATH"
echo "  CORE_PEER_ADDRESS=$CORE_PEER_ADDRESS"
echo "  CC_CHANNEL=$CC_CHANNEL  CC_NAME=$CC_NAME  CC_LABEL=$CC_LABEL"
echo "  ORDERER_ADDRESS=$ORDERER_ADDRESS  ORDERER_TLS_HOSTNAME_OVERRIDE=$ORDERER_TLS_HOSTNAME_OVERRIDE"
