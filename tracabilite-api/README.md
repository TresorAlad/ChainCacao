# API Go — ChainCacao (tracabilité Fabric)

Backend Gin reliant Next.js / React Native à **Hyperledger Fabric** (via **fabric-gateway**), avec **PostgreSQL** (dont **Neon**), **Redis**, upload **Cloudinary**, **PDF EUDR** (signature RSA optionnelle) et **QR code PNG**.

## Architecture

| Dossier | Rôle |
|--------|------|
| `cmd/api` | Serveur HTTP |
| `internal/auth` | JWT, middleware, rôles |
| `internal/actors` | Acteurs : PostgreSQL ou mémoire |
| `internal/db` | Migrations SQL embarquées |
| `internal/batch` | Métier lots |
| `internal/fabric` | `InMemoryClient` **ou** `GatewayClient` (Fabric) |
| `internal/httpapi` | Routes Gin, CORS, rate limit |
| `internal/cloudinary` | Upload image (preset non signé) |
| `internal/media` | Métadonnées `lot_media` en SQL |
| `internal/report` | Génération PDF EUDR |
| `pkg/models` | Modèles partagés |

## Prérequis

- Go **1.23+**
- Pour la stack complète : Docker / Docker Compose

## Démarrage rapide (Docker : API + Postgres + Redis)

```bash
cd tracabilite-api
docker compose up --build
```

- API : `http://localhost:8080`
- Sans réseau Fabric local, `USE_INMEMORY_FABRIC=true` (défaut dans `docker-compose.yml`) simule le ledger.

Santé :

```bash
curl -s http://localhost:8080/health
```

## Variables d’environnement (principales)

| Variable | Description |
|----------|-------------|
| `PORT` | Port HTTP (défaut `8080`) |
| `DATABASE_URL` | PostgreSQL, ex. `postgres://...` (**Neon** : ajouter `?sslmode=require`) |
| `REDIS_URL` | ex. `redis://localhost:6379/0` — rate limit `/verify` |
| `JWT_SECRET` | Secret HMAC JWT |
| `ALLOWED_ORIGINS` | CORS, liste séparée par virgules |
| `USE_INMEMORY_FABRIC` | `true` force le mock ledger |
| `PUBLIC_VERIFY_BASE_URL` | Base URL des QR (défaut `https://chaincacao.tg/verify`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Preset **unsigned** (recommandé) |
| `EUDR_RSA_PRIVATE_KEY_PEM` | PEM PKCS1/PKCS8 RSA pour signature PDF |

### Fabric Gateway (production)

Si `FABRIC_PEER_ENDPOINT` est défini et `USE_INMEMORY_FABRIC` ≠ `true`, l’API utilise **`internal/fabric/gateway.go`**.

| Variable | Exemple / note |
|----------|----------------|
| `FABRIC_MSP_ID` | `Org1MSP` |
| `FABRIC_PEER_ENDPOINT` | `dns:///peer0.org1.example.com:7051` |
| `FABRIC_GATEWAY_PEER` | SNI TLS, ex. `peer0.org1.example.com` |
| `FABRIC_TLS_CERT_PATH` | CA TLS du peer (PEM) |
| `FABRIC_SIGNCERT_PATH` ou `FABRIC_SIGNCERT_DIR` | Certificat utilisateur |
| `FABRIC_KEY_PATH` ou `FABRIC_KEYSTORE_DIR` | Clé privée |
| `FABRIC_CHANNEL` | ex. `mychannel` |
| `FABRIC_CHAINCODE` | ex. `chaincacao` |

**Contrat chaincode attendu** (arguments `string` ; lectures = JSON) :

- `CreateBatch(batchJSON, actorID)` — submit  
- `TransferBatch(batchID, fromActorID, toActorID, comment)` — submit  
- `UpdateBatchWeight(batchID, actorID, newWeight, justification)` — submit  
- `MarkBatchExported(batchID, actorID)` — submit  
- `GetBatch(batchID)` — evaluate → JSON `models.Batch`  
- `GetHistory(batchID)` — evaluate → JSON `[]models.BatchHistoryEvent`  
- `GetStats()` — evaluate → JSON (optionnel ; sinon message d’erreur dans les stats)

## Neon & Cloudinary

- **Neon** : crée un projet, copie l’URL `DATABASE_URL`, mets `sslmode=require`. Tu peux retirer le service `postgres` du compose et ne passer que l’URL dans `api.environment`.
- **Cloudinary** : active un **upload preset unsigned** ; renseigne `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UPLOAD_PRESET`.  
  Upload : `POST /api/v1/lot/:id/photo` (multipart, champ `file`).

## Routes (v2.1 + compat)

- `POST /api/v1/auth/login` — public  
- `POST /api/v1/auth/register` — JWT admin  
- `POST /api/v1/lot` — JWT agriculteur / admin  
- `GET /api/v1/lot/:id` — public  
- `GET /api/v1/lot/:id/history` — public  
- `POST /api/v1/transfer` — JWT coop / transfo / export / admin  
- `PUT /api/v1/lot/:id/weight` — JWT  
- `POST /api/v1/lot/:id/export` — JWT export / admin  
- `POST /api/v1/lot/:id/photo` — JWT + Cloudinary  
- `GET /api/v1/eudr/:id/report` — JSON (JWT export / admin)  
- `GET /api/v1/eudr/:id/report/pdf` — **PDF** (JWT export / admin)  
- `GET /api/v1/qrcode/:id` — JSON ; **`?format=png`** → image PNG  
- `GET /api/v1/verify/:id` — public (rate limit Redis ou mémoire)  
- `POST /api/v1/sync` — JWT agriculteur / admin  
- `GET /api/v1/dashboard/stats` — JWT admin  
- `GET /api/v1/actors` — JWT  
- `GET /health` — public  

Compat : `/api/v1/batch/*` inchangé.

## Exemples

Login PIN :

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"actor_id":"actor-agri-001","pin":"1111"}'
```

Avec PostgreSQL, le même mot de passe que le PIN est aussi posé en `password_hash` au démarrage (seed) : login possible avec  
`{"email":"agri@chaincacao.tg","password":"1111"}`.

QR PNG :

```bash
curl -s -o qr.png "http://localhost:8080/api/v1/qrcode/TC-20260429-00001?format=png"
```

## Développement sans Docker

```bash
go run ./cmd/api
```

Sans `DATABASE_URL`, les acteurs restent en **mémoire** ; sans `REDIS_URL`, le rate limit `/verify` est **en mémoire**.
