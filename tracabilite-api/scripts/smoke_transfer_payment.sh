#!/usr/bin/env bash
# Validation rapide : transfert + réception + soldes (nécessite API + Fabric ou client mémoire).
# Usage :
#   BASE_URL=http://127.0.0.1:8080 bash scripts/smoke_transfer_payment.sh
#
# Acteurs démo (internal/db/migrations/002_seed_demo_actors.sql) :
#   actor-agri-001 PIN 1111 | actor-coop-001 PIN 4444 | actor-exp-001 PIN 3333 (email export-demo@chaincacao.tg)
#   (ancien id export : actor-export-001 — secours automatique si BUYER_ACTOR non défini)
#
# Variables optionnelles :
#   AGRI_JWT, COOP_JWT, BUYER_JWT — sinon login avec les IDs/PIN ci-dessus.
#   AGRI_ACTOR, COOP_ACTOR, BUYER_ACTOR, AGRI_PIN, COOP_PIN, BUYER_PIN
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE_URL%/}"

echo "== Smoke transfert / paiement (HTTP uniquement — erreurs Fabric attendues si peer coupé) =="
echo "IDs login (défauts) : agri=${AGRI_ACTOR:-actor-agri-001} coop=${COOP_ACTOR:-actor-coop-001} buyer=${BUYER_ACTOR:-actor-exp-001} (+ secours actor-export-001 si buyer vide)"

login_pin() {
  local actor_id="$1"
  local pin="${2:-1111}"
  local code tmp
  tmp="$(mktemp)"
  # Pas de -S : évite « Recv failure » sur stderr quand l’API coupe la connexion (HTTP 000).
  code="$(curl -s --connect-timeout 5 --max-time 20 --retry 2 --retry-delay 1 \
    -o "$tmp" -w "%{http_code}" -X POST "$BASE/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"actor_id\":\"$actor_id\",\"pin\":\"$pin\"}" 2>/dev/null)" || code="000"
  if [[ "$code" != "200" ]]; then
    echo "Login $actor_id HTTP ${code:-000}:" >&2
    cat "$tmp" >&2 2>/dev/null || true
    echo "" >&2
    rm -f "$tmp"
    echo ""
    return 0
  fi
  python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("token",""))' "$tmp" 2>/dev/null || echo ""
  rm -f "$tmp"
}

if [[ -z "${AGRI_JWT:-}" ]]; then
  AGRI_JWT="$(login_pin "${AGRI_ACTOR:-actor-agri-001}" "${AGRI_PIN:-1111}")"
fi
if [[ -z "${COOP_JWT:-}" ]]; then
  COOP_JWT="$(login_pin "${COOP_ACTOR:-actor-coop-001}" "${COOP_PIN:-4444}")"
fi
if [[ -z "${BUYER_JWT:-}" ]]; then
  BUYER_JWT="$(login_pin "${BUYER_ACTOR:-actor-exp-001}" "${BUYER_PIN:-3333}")"
  if [[ -z "${BUYER_ACTOR:-}" && (-z "$BUYER_JWT" || "$BUYER_JWT" == "None") ]]; then
    BUYER_JWT="$(login_pin "actor-export-001" "${BUYER_PIN:-3333}")"
  fi
fi

if [[ -z "$AGRI_JWT" || "$AGRI_JWT" == "None" ]]; then
  echo "Échec login agriculteur — définissez AGRI_JWT ou vérifiez AGRI_ACTOR + AGRI_PIN (démo: actor-agri-001 / 1111)."
  echo "« acteur introuvable » : la table actors est vide ou mauvaise base — vérifier DATABASE_URL du conteneur api et les migrations (002_seed_demo_actors.sql)."
  echo "Ex. (valeurs par défaut compose) : docker compose exec postgres psql -U chaincacao -d chaincacao -c 'SELECT id FROM actors ORDER BY 1;'"
  echo "Si les lignes de login montrent encore « actor-export-001 » comme seul buyer : mettre à jour ce script (git pull) ; la démo seed utilise actor-exp-001."
  echo "HTTP 000 / API instable : docker compose logs --tail=100 api"
  exit 1
fi

# Date de récolte : hier UTC (évite rejet « date dans le futur » si l’horloge VM avance).
if date -u -d yesterday +%Y-%m-%d >/dev/null 2>&1; then
  DATE_RECOLTE="$(date -u -d yesterday +%Y-%m-%d)"
else
  DATE_RECOLTE="$(date -u +%Y-%m-%d)"
fi

echo "== Créer lot (JSON, sans photo — démo) =="
CREATE_JSON="$(cat <<EOF
{
  "culture": "Cacao",
  "variete": "Forastero",
  "quantite": 10,
  "lieu": "Smoke farm",
  "latitude": 6.1319,
  "longitude": 1.2228,
  "region": "Maritime",
  "village": "SmokeVillage",
  "parcelle": "P-smoke-1",
  "date_recolte": "${DATE_RECOLTE}",
  "photo_url": "https://example.invalid/smoke-no-photo.jpg",
  "notes": "smoke_transfer_payment"
}
EOF
)"

HTTP_CREATE="$(curl -s -S -o /tmp/smoke_create_lot.json -w "%{http_code}" -X POST "$BASE/api/v1/lot" \
  -H "Authorization: Bearer $AGRI_JWT" \
  -H "Content-Type: application/json" \
  -d "$CREATE_JSON")"
echo "HTTP création lot: $HTTP_CREATE"
cat /tmp/smoke_create_lot.json | python3 -m json.tool 2>/dev/null || cat /tmp/smoke_create_lot.json
echo ""

CREATE_RESP="$(cat /tmp/smoke_create_lot.json)"
python3 -c 'import sys,json; d=json.load(sys.stdin); print("batch id:", d.get("batch",{}).get("id")); print("success:", d.get("success")); print("error:", d.get("error"))' <<<"$CREATE_RESP" || true
LOT_ID="$(python3 -c 'import sys,json; print(json.load(sys.stdin).get("batch",{}).get("id",""))' <<<"$CREATE_RESP")"

if [[ -z "$LOT_ID" ]]; then
  echo ""
  echo "Création lot refusée — causes fréquentes :"
  echo "  • API ne joint pas Fabric (docker: vérifier FABRIC_* / FABRIC_PROXY_URL dans .env du conteneur api)."
  echo "  • Erreur chaincode (voir message \"error\" ci-dessus ou logs: docker compose logs api)."
  echo "  • date_recolte future ou champs obligatoires manquants."
  exit 1
fi

echo "Lot: $LOT_ID"

if [[ -n "$COOP_JWT" && "$COOP_JWT" != "None" ]]; then
  echo "== Transfert vers coop (adapter to_actor_id selon votre seed) =="
  TO_ID="${TO_COOP_ACTOR:-actor-coop-001}"
  TR="$(curl -s -o /tmp/tr.json -w "%{http_code}" -X POST "$BASE/api/v1/transfer" \
    -H "Authorization: Bearer $AGRI_JWT" \
    -H "Content-Type: application/json" \
    -d "{\"batch_id\":\"$LOT_ID\",\"to_actor_id\":\"$TO_ID\",\"commentaire\":\"smoke\"}")"
  echo "transfer HTTP: $TR"
  cat /tmp/tr.json | python3 -m json.tool 2>/dev/null || cat /tmp/tr.json
fi

if [[ -n "$COOP_JWT" && "$COOP_JWT" != "None" ]]; then
  echo "== Réception coop (poids constaté) =="
  R="$(curl -s -o /tmp/rcpt.json -w "%{http_code}" -X POST "$BASE/api/v1/lot/$LOT_ID/reception" \
    -H "Authorization: Bearer $COOP_JWT" \
    -H "Content-Type: application/json" \
    -d '{"poids_constate": 10}')"
  echo "reception HTTP: $R"
  cat /tmp/rcpt.json | python3 -m json.tool 2>/dev/null || cat /tmp/rcpt.json
fi

if [[ -n "$BUYER_JWT" && "$BUYER_JWT" != "None" ]]; then
  echo "== Solde payeur avant =="
  curl -s "$BASE/api/v1/portefeuille/solde" -H "Authorization: Bearer $BUYER_JWT" | python3 -m json.tool || true
  echo "== Paiement lot (preview + confirmer — PIN requis dans votre env) == "
  echo "   Utiliser l’app ou : POST /lot/{id}/confirmer avec body \"pin\" depuis un compte transformateur/exportateur."
fi

echo "== Fin smoke (vérifier manuellement actor_wallets si wallet PG actif) =="
