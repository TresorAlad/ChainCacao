#!/usr/bin/env bash
# ============================================================
# deploy-fabric.sh — Lance le réseau Fabric test-network
# et déploie le chaincode chaincacao
# Prérequis: Docker Compose installé, utilisateur dans groupe docker
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FABRIC_DIR="$ROOT/fabric-samples/test-network"
CHAINCODE_DIR="$ROOT/chaincode"
CC_NAME="chaincacao"
CC_VERSION="1.0"
CHANNEL="chaincacao-channel"

echo "=== ChainCacao — Déploiement réseau Fabric ==="
echo "Répertoire Fabric: $FABRIC_DIR"

# 1. Vérifications
command -v docker >/dev/null 2>&1 || { echo "Docker requis"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin requis (lance scripts/install-compose.sh)"; exit 1; }

# 2. Cloner fabric-samples si test-network absent
if [ ! -d "$ROOT/fabric-samples/test-network" ]; then
  echo "Clonage de fabric-samples (test-network manquant)..."
  # Sauvegarder les binaires et la config déjà présents si dossier existant
  if [ -d "$ROOT/fabric-samples/bin" ]; then
    mv "$ROOT/fabric-samples/bin" /tmp/fabric-bin-backup
  fi
  if [ -d "$ROOT/fabric-samples/config" ]; then
    mv "$ROOT/fabric-samples/config" /tmp/fabric-config-backup
  fi
  rm -rf "$ROOT/fabric-samples"
  git clone --depth 1 https://github.com/hyperledger/fabric-samples.git "$ROOT/fabric-samples"
  # Restaurer les binaires et la config sauvegardés
  if [ -d /tmp/fabric-bin-backup ]; then
    mv /tmp/fabric-bin-backup "$ROOT/fabric-samples/bin"
  fi
  if [ -d /tmp/fabric-config-backup ]; then
    mv /tmp/fabric-config-backup "$ROOT/fabric-samples/config"
  fi
fi

# 2b. Télécharger les binaires Fabric si nécessaire
FABRIC_BIN="$ROOT/fabric-samples/bin"
cd "$ROOT/fabric-samples"

if [ ! -f "$FABRIC_BIN/peer" ]; then
  echo "Téléchargement des binaires Fabric 2.5 (peer, orderer, configtxgen...)..."
  curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary
else
  echo "Binaires Fabric déjà présents: $(ls $FABRIC_BIN | tr '\n' ' ')"
fi

# Ajouter les binaires au PATH pour ce script
export PATH="$FABRIC_BIN:$PATH"
export FABRIC_CFG_PATH="$FABRIC_DIR/configtx"

# 2b. Télécharger les images Docker si nécessaire
cd "$ROOT/fabric-samples"
if ! docker images | grep -q "hyperledger/fabric-peer"; then
  echo "Téléchargement des images Docker Fabric 2.5..."
  curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- docker
fi

# 3. Arrêter tout réseau existant
echo "Nettoyage du réseau existant..."
cd "$FABRIC_DIR"
./network.sh down 2>/dev/null || true

# 4. Démarrer le réseau avec CA (LevelDB — pas de CouchDB pour éviter les race conditions)
echo "Démarrage réseau Fabric (CA + LevelDB)..."
./network.sh up createChannel -ca -c "$CHANNEL"

# 5. Déployer le chaincode
echo "Déploiement du chaincode $CC_NAME v$CC_VERSION..."
./network.sh deployCC \
  -ccn "$CC_NAME" \
  -ccp "$CHAINCODE_DIR" \
  -ccl go \
  -c "$CHANNEL" \
  -ccep "OR('Org1MSP.peer','Org2MSP.peer')"

echo ""
echo "=== Réseau Fabric prêt ==="
echo "Channel: $CHANNEL"
echo "Chaincode: $CC_NAME"
echo ""

# 6. Extraire les credentials et mettre à jour .env
CRYPTO="$FABRIC_DIR/organizations/peerOrganizations/org1.example.com"
USER_MSP="$CRYPTO/users/User1@org1.example.com/msp"
PEER_TLS="$CRYPTO/peers/peer0.org1.example.com/tls/ca.crt"
KEY_FILE=$(ls "$USER_MSP/keystore/" | head -1)
ENV_FILE="$ROOT/tracabilite-api/.env"

if [ -f "$PEER_TLS" ] && [ -n "$KEY_FILE" ]; then
  echo "Mise à jour de .env avec les credentials Fabric..."

  # Désactiver USE_INMEMORY_FABRIC et activer les variables Fabric
  sed -i 's/^USE_INMEMORY_FABRIC=true/# USE_INMEMORY_FABRIC=true/' "$ENV_FILE"

  # Supprimer les lignes FABRIC_* commentées et les réécrire
  grep -v '^# FABRIC_\|^FABRIC_\|^# USE_INMEMORY_FABRIC=false\|^USE_INMEMORY_FABRIC=false' "$ENV_FILE" > /tmp/env_clean
  cat >> /tmp/env_clean <<EOF

# Hyperledger Fabric Gateway (réseau test-network)
USE_INMEMORY_FABRIC=false
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=dns:///localhost:7051
FABRIC_GATEWAY_PEER=localhost
FABRIC_TLS_CERT_PATH=$PEER_TLS
FABRIC_SIGNCERT_PATH=$USER_MSP/signcerts/cert.pem
FABRIC_KEY_PATH=$USER_MSP/keystore/$KEY_FILE
FABRIC_CHANNEL=$CHANNEL
FABRIC_CHAINCODE=$CC_NAME
EOF
  mv /tmp/env_clean "$ENV_FILE"
  echo "OK: .env mis à jour avec les paths Fabric"
else
  echo "⚠️  Impossible de trouver les credentials Fabric. Met à jour .env manuellement."
fi

echo ""
echo "Lance maintenant la stack API:"
echo "  cd tracabilite-api && docker compose up --build"
