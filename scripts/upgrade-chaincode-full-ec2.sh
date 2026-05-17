#!/usr/bin/env bash
# ============================================================
# upgrade-chaincode-full-ec2.sh
# Upgrade lifecycle chaincacao (SkipWallet / historique paiement)
# sur Org1 + Org2, puis rebuild API.
#
# Sur EC2 (SSH), depuis la racine du dépôt après git pull :
#   cd ~/ChainCacao   # ou ~/chaincacao
#   git pull
#   chmod +x scripts/upgrade-chaincode-full-ec2.sh
#   ./scripts/upgrade-chaincode-full-ec2.sh
#
# Variables optionnelles :
#   CC_SEQUENCE=3          forcer la séquence (sinon auto = commitée + 1)
#   SKIP_INSTALL=1         sauter package/install (reprise après échec approve/commit)
#   SKIP_API_REBUILD=1     ne pas lancer docker compose rebuild api
#   DRY_RUN=1              afficher les commandes sans les exécuter
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=/dev/null
source "$ROOT/scripts/fabric-ec2-env.sh"

CC_VERSION="${CC_VERSION:-1.0}"
CC_NAME="${CC_NAME:-chaincacao}"
CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
CC_LABEL="${CC_LABEL:-chaincacao_v2}"
CHAINCODE_DIR="${CHAINCODE_DIR:-$ROOT/chaincode}"
PKG_OUT="${PKG_OUT:-$ROOT/chaincacao_cc_${CC_LABEL}.tar.gz}"
DRY_RUN="${DRY_RUN:-0}"
SKIP_API_REBUILD="${SKIP_API_REBUILD:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

TN="$ROOT/fabric-samples/test-network"
ORG1_TLS="$TN/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
ORG2_TLS="$TN/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
PEER1="${CORE_PEER_ADDRESS:-localhost:7051}"
PEER2="${CORE_PEER_ADDRESS_ORG2:-localhost:9051}"

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] $*"
  else
    echo ">>> $*"
    eval "$@"
  fi
}

detect_sequence() {
  local committed
  committed="$(peer lifecycle chaincode querycommitted -C "$CC_CHANNEL" -n "$CC_NAME" 2>/dev/null \
    | sed -n 's/.*Sequence: \([0-9][0-9]*\).*/\1/p' | head -1 || true)"
  if [[ -z "$committed" ]]; then
    echo 1
  else
    echo $((committed + 1))
  fi
}

# Séquence = commitée + 1, sauf si vous exportez CC_SEQUENCE avant d’exécuter le script.
if [[ -z "${CC_SEQUENCE:-}" ]]; then
  CC_SEQUENCE="$(detect_sequence)"
fi
export CC_SEQUENCE

echo "=============================================="
echo " Chaincode upgrade — $CC_NAME sur $CC_CHANNEL"
echo " Label: $CC_LABEL  Version: $CC_VERSION  Sequence: $CC_SEQUENCE"
echo "=============================================="
echo ""
run "peer lifecycle chaincode querycommitted -C \"$CC_CHANNEL\" -n \"$CC_NAME\" || true"
echo ""

if [[ "$SKIP_INSTALL" == "1" ]]; then
  echo "=== 1–3/7 Install ignoré (SKIP_INSTALL=1) ==="
  if [[ -z "${PACKAGE_ID:-}" ]] && [[ -f "$PKG_OUT" ]] && [[ "$DRY_RUN" != "1" ]]; then
    PACKAGE_ID="$(peer lifecycle chaincode calculatepackageid "$PKG_OUT")"
  fi
  PACKAGE_ID="${PACKAGE_ID:-}"
  if [[ -z "$PACKAGE_ID" ]]; then
    echo "ERREUR: export PACKAGE_ID=chaincacao_v2:... ou laissez SKIP_INSTALL vide."
    exit 1
  fi
  export PACKAGE_ID
  echo "PACKAGE_ID=$PACKAGE_ID (existant)"
else
  echo "=== 1/7 Package Go chaincode ==="
  run "peer lifecycle chaincode package \"$PKG_OUT\" --path \"$CHAINCODE_DIR\" --lang golang --label \"$CC_LABEL\""

  if [[ "$DRY_RUN" == "1" ]]; then
    PACKAGE_ID="${CC_LABEL}:<hash-dry-run>"
  else
    PACKAGE_ID="$(peer lifecycle chaincode calculatepackageid "$PKG_OUT")"
  fi
  export PACKAGE_ID
  echo "PACKAGE_ID=$PACKAGE_ID"

  echo ""
  echo "=== 2/7 Install Org1 ($PEER1) ==="
  run "peer lifecycle chaincode install \"$PKG_OUT\""
  echo ""

  echo "=== 3/7 Install Org2 ($PEER2) ==="
  run "source \"$ROOT/scripts/fabric-ec2-org2-env.sh\" && peer lifecycle chaincode install \"$PKG_OUT\""
fi

echo ""
echo "=== 4/7 Approve Org1 ==="
run "peer lifecycle chaincode approveformyorg \\
  --channelID \"$CC_CHANNEL\" --name \"$CC_NAME\" \\
  --version \"$CC_VERSION\" --package-id \"$PACKAGE_ID\" --sequence \"$CC_SEQUENCE\" \\
  --tls --cafile \"$ORDERER_CA\" $ORDERER_OPTS"

echo ""
echo "=== 5/7 Approve Org2 ==="
run "source \"$ROOT/scripts/fabric-ec2-org2-env.sh\" && peer lifecycle chaincode approveformyorg \\
  --channelID \"$CC_CHANNEL\" --name \"$CC_NAME\" \\
  --version \"$CC_VERSION\" --package-id \"$PACKAGE_ID\" --sequence \"$CC_SEQUENCE\" \\
  --tls --cafile \"$ORDERER_CA\" $ORDERER_OPTS"

echo ""
echo "=== 6/7 Commit readiness + commit (2 peers) ==="
run "source \"$ROOT/scripts/fabric-ec2-env.sh\" && peer lifecycle chaincode checkcommitreadiness \\
  --channelID \"$CC_CHANNEL\" --name \"$CC_NAME\" \\
  --version \"$CC_VERSION\" --sequence \"$CC_SEQUENCE\" \\
  --tls --cafile \"$ORDERER_CA\" $ORDERER_OPTS --output json || true"

run "peer lifecycle chaincode commit \\
  --channelID \"$CC_CHANNEL\" --name \"$CC_NAME\" \\
  --version \"$CC_VERSION\" --sequence \"$CC_SEQUENCE\" \\
  --tls --cafile \"$ORDERER_CA\" $ORDERER_OPTS \\
  --peerAddresses \"$PEER1\" --tlsRootCertFiles \"$ORG1_TLS\" \\
  --peerAddresses \"$PEER2\" --tlsRootCertFiles \"$ORG2_TLS\""

echo ""
echo "=== 7/7 Vérification ==="
run "\"$ROOT/scripts/verify-chaincode-ec2.sh\""

if [[ "$SKIP_API_REBUILD" != "1" ]]; then
  echo ""
  echo "=== Rebuild API (nouveau RecordPaymentOnLedger / SkipWallet) ==="
  if [[ -f "$ROOT/tracabilite-api/docker-compose.yml" ]]; then
    run "cd \"$ROOT/tracabilite-api\" && docker compose up -d --build api"
  else
    echo "(docker-compose.yml introuvable — rebuild API manuellement)"
  fi
fi

cat <<EOF

==============================================
 Terminé.
==============================================
- Nouveau paiement : statut « paye » + événement « Paiement » dans l'historique du lot.
- Vérifier l'API : curl -s http://127.0.0.1:8080/health  (ou votre URL)
- Front Vercel / mobile : redéployer si le code API/front a changé localement.

Si commit échoue (endorsement) :
  export CC_SEQUENCE=$((CC_SEQUENCE + 1))
  ./scripts/upgrade-chaincode-full-ec2.sh

EOF
