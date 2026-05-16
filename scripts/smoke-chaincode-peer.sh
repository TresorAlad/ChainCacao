#!/usr/bin/env bash
# ============================================================
# smoke-chaincode-peer.sh — Tests rapides du chaincode via peer CLI
# (test-network déjà démarré, channel chaincacao-channel, cc chaincacao).
#
# Usage (depuis la racine du dépôt, sur la VM) :
#   cd ~/ChainCacao   # ou ~/chaincacao
#   ./scripts/smoke-chaincode-peer.sh
#
# Variables optionnelles :
#   TN                   — chemin test-network (défaut : $ROOT/fabric-samples/test-network)
#   FABRIC_CFG_PATH      — répertoire avec core.yaml (défaut : $ROOT/fabric-samples/config)
#   FABRIC_SAMPLES_CONFIG — alias du même répertoire si besoin
#   CC_CHANNEL           — défaut : chaincacao-channel
#   CC_NAME         — défaut : chaincacao
#   SMOKE_ACTOR_ID  — défaut : actor-smoke-001
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TN="${TN:-$ROOT/fabric-samples/test-network}"
CC_CHANNEL="${CC_CHANNEL:-chaincacao-channel}"
CC_NAME="${CC_NAME:-chaincacao}"
SMOKE_ACTOR_ID="${SMOKE_ACTOR_ID:-actor-smoke-001}"

if [[ ! -d "$TN" ]]; then
  echo "Répertoire test-network introuvable: $TN"
  echo "Définissez TN= ou lancez ./scripts/deploy-fabric.sh"
  exit 1
fi

# peer CLI charge core.yaml depuis ce répertoire (pas test-network/configtx).
FABRIC_SAMPLES_CONFIG="${FABRIC_SAMPLES_CONFIG:-$ROOT/fabric-samples/config}"
if [[ ! -f "$FABRIC_SAMPLES_CONFIG/core.yaml" ]]; then
  echo "Fichier core.yaml introuvable: $FABRIC_SAMPLES_CONFIG/core.yaml"
  echo "Vérifiez que fabric-samples est complet (install-fabric.sh binary)."
  exit 1
fi
export FABRIC_CFG_PATH="${FABRIC_CFG_PATH:-$FABRIC_SAMPLES_CONFIG}"
export PATH="${PATH:-}:$ROOT/fabric-samples/bin"
command -v peer >/dev/null 2>&1 || { echo "peer CLI introuvable (PATH + fabric-samples/bin)"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq requis (sudo apt install -y jq)"; exit 1; }

ORDERER_CA="$TN/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"
PEER_TLS="$TN/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
USER_MSP="$TN/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp"

for f in "$ORDERER_CA" "$PEER_TLS" "$USER_MSP"; do
  if [[ ! -e "$f" ]]; then
    echo "Fichier / dossier MSP introuvable: $f"
    exit 1
  fi
done

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH="$USER_MSP"
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE="$PEER_TLS"
# Certaines versions acceptent aussi la forme plurielle pour invoke :
export CORE_PEER_TLS_ROOTCERT_FILES="$PEER_TLS"

ORDERER_FLAGS=(
  -o localhost:7050
  --ordererTLSHostnameOverride orderer.example.com
  --tls
  --cafile "$ORDERER_CA"
)

PEER_FLAGS=(
  --peerAddresses localhost:7051
  --tlsRootCertFiles "$PEER_TLS"
)

invoke() {
  peer chaincode invoke "${ORDERER_FLAGS[@]}" \
    -C "$CC_CHANNEL" -n "$CC_NAME" "${PEER_FLAGS[@]}" "$@"
}

query() {
  peer chaincode query -C "$CC_CHANNEL" -n "$CC_NAME" "$@"
}

echo "=== 1) Query GetBatchesByOwner (acteur sans lots → []) ==="
query -c "$(jq -nc --arg a "$SMOKE_ACTOR_ID" '{"function":"GetBatchesByOwner","Args":[$a]}')" | tee /tmp/smoke-lots-before.json
echo ""

LOT_ID="TC-$(date -u +%Y%m%d)-$(printf '%05d' $((RANDOM % 100000)))"
echo "=== 2) Invoke CreateBatch (lot $LOT_ID, propriétaire $SMOKE_ACTOR_ID) ==="

INVOKE_PAYLOAD="$(jq -nc \
  --arg id "$LOT_ID" \
  --arg owner "$SMOKE_ACTOR_ID" \
  --arg actor "$SMOKE_ACTOR_ID" \
  '{
    function: "CreateBatch",
    Args: [
      ({
        id: $id,
        culture: "Cacao",
        variete: "Forastero",
        quantite: 12.5,
        lieu: "Ferme smoke",
        latitude: 6.1319,
        longitude: -1.2228,
        region: "Maritime",
        village: "V1",
        parcelle: "P1",
        date_recolte: "2026-05-01",
        proprietaire_id: $owner,
        org_id: "Org1MSP",
        statut: "cree",
        eudr_conforme: false,
        timestamp: "",
        certificat_url: "",
        photo_url: "",
        notes: "smoke-chaincode-peer"
      } | tojson),
      $actor
    ]
  }')"

invoke -c "$INVOKE_PAYLOAD" --waitForEvent
echo ""

echo "=== 3) Query GetBatch ==="
query -c "$(jq -nc --arg id "$LOT_ID" '{"function":"GetBatch","Args":[$id]}')" | tee /tmp/smoke-batch.json
echo ""

echo "=== 4) Query GetBatchesByOwner (doit contenir le lot) ==="
query -c "$(jq -nc --arg a "$SMOKE_ACTOR_ID" '{"function":"GetBatchesByOwner","Args":[$a]}')" | tee /tmp/smoke-lots-after.json
echo ""

if jq -e --arg id "$LOT_ID" 'map(select(.id == $id)) | length == 1' /tmp/smoke-lots-after.json >/dev/null 2>&1; then
  echo "OK: le lot $LOT_ID apparaît dans GetBatchesByOwner pour $SMOKE_ACTOR_ID"
  exit 0
fi

if grep -q "$LOT_ID" /tmp/smoke-lots-after.json 2>/dev/null; then
  echo "OK: lot $LOT_ID détecté dans la réponse JSON"
  exit 0
fi

echo "ATTENTION: le lot n’a pas été retrouvé dans la liste — vérifier les logs peer / conteneur chaincode."
exit 1
