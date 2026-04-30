#!/usr/bin/env bash
# ============================================================
# install-compose.sh — Installe Docker Compose plugin v2
# Exécute avec: bash scripts/install-compose.sh
# ============================================================
set -euo pipefail

COMPOSE_VERSION="v2.27.1"
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)   ARCH_LABEL="linux-x86_64" ;;
  aarch64)  ARCH_LABEL="linux-aarch64" ;;
  *)        echo "Architecture non supportée: $ARCH"; exit 1 ;;
esac

DEST="$HOME/.docker/cli-plugins/docker-compose"
mkdir -p "$(dirname "$DEST")"

if [ -f "$DEST" ]; then
  echo "Docker Compose déjà installé: $($DEST version 2>/dev/null || echo 'version inconnue')"
else
  URL="https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-${ARCH_LABEL}"
  echo "Téléchargement Docker Compose ${COMPOSE_VERSION} (${ARCH_LABEL})..."
  curl -SL "$URL" -o "$DEST"
  chmod +x "$DEST"
  echo "OK: docker compose version = $(docker compose version)"
fi

# Ajouter l'utilisateur au groupe docker (nécessite sudo mot de passe)
if ! groups | grep -qw docker; then
  echo ""
  echo "⚠️  Ton utilisateur n'est pas dans le groupe docker."
  echo "Exécute ceci, puis RECONNECTE-TOI (ou lance 'newgrp docker'):"
  echo ""
  echo "  sudo usermod -aG docker $USER"
  echo "  newgrp docker"
else
  echo "Groupe docker: OK"
fi

echo ""
echo "Installation terminée. Lance maintenant:"
echo "  bash scripts/deploy-fabric.sh"
