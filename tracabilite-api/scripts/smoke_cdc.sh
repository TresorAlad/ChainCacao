#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "== Login (PIN) =="
JWT="$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"actor_id":"actor-agri-001","pin":"1111"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')"
echo "JWT ok"

echo "== Create lot (multipart + EXIF GPS) =="
if [[ ! -f "${PHOTO_PATH:-photo.jpg}" ]]; then
  echo "ATTENTION: photo absente: mets une photo GPS en PHOTO_PATH=... pour tester"
  exit 0
fi

RESP="$(curl -s -X POST "$BASE_URL/api/v1/lot" \
  -H "Authorization: Bearer $JWT" \
  -F "file=@${PHOTO_PATH:-photo.jpg}" \
  -F "culture=cacao" \
  -F "variete=forastero" \
  -F "quantite=25" \
  -F "lieu=ferme" \
  -F "region=Plateaux" \
  -F "village=Kpalime" \
  -F "parcelle=P-01" \
  -F "date_recolte=2026-05-01")"

LOT_ID="$(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin)["batch"]["id"])')"
echo "Lot créé: $LOT_ID"

echo "== QR (CDC path) =="
curl -s "$BASE_URL/api/v1/lot/$LOT_ID/qr" -H "Authorization: Bearer $JWT" >/dev/null
echo "QR ok"

echo "== EUDR report JSON =="
curl -sf "$BASE_URL/api/v1/eudr/$LOT_ID/report" -H "Authorization: Bearer $JWT" | python3 -c 'import sys,json; r=json.load(sys.stdin); assert r.get("success") and r.get("report")'
echo "EUDR ok"

echo "== Sync signature fields (structure) =="
curl -sf -X POST "$BASE_URL/api/v1/sync" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '[{"client_lot_id":"smoke-offline-1","culture":"cacao","quantite":1,"lieu":"Test","latitude":6.1,"longitude":1.2,"date_recolte":"2026-05-01","payload_hash":"deadbeef","signature":"00","signer_pubkey":"02"}]' \
  | python3 -c 'import sys,json; r=json.load(sys.stdin); assert "results" in r'
echo "Sync endpoint ok (peut rejeter signature invalide — attendu CDC critère 4)"

