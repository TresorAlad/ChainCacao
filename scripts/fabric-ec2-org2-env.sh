#!/usr/bin/env bash
# Bascule le peer CLI sur Org2 (test-network). À sourcer après fabric-ec2-env.sh ou seul.
#   source scripts/fabric-ec2-org2-env.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TN="$ROOT/fabric-samples/test-network"
ORG2="$TN/organizations/peerOrganizations/org2.example.com"

export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_MSPCONFIGPATH="$ORG2/users/Admin@org2.example.com/msp"
export CORE_PEER_ADDRESS="${CORE_PEER_ADDRESS_ORG2:-localhost:9051}"
export CORE_PEER_TLS_ROOTCERT_FILE="$ORG2/peers/peer0.org2.example.com/tls/ca.crt"
export PEER_TLS_ROOTCERT="$CORE_PEER_TLS_ROOTCERT_FILE"

echo "OK — peer Org2 : $CORE_PEER_ADDRESS ($CORE_PEER_LOCALMSPID)"
