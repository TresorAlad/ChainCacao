# API Go — ChainCacao (tracabilité Fabric)

Backend **Gin** pour le web Next.js et l’app mobile Expo : lots, transferts, **paiements par PIN**, listes groupées, portefeuille, dashboards et administration. Connexion **Hyperledger Fabric** (gateway ou mock mémoire), **PostgreSQL**, **Redis**, **Cloudinary**, QR PNG.

> **MVP :** pas de routes EUDR / conformité (supprimées).

## Architecture

| Dossier | Rôle |
|--------|------|
| `cmd/api` | Serveur HTTP |
| `cmd/fabric-proxy` | Proxy HTTP → Fabric Gateway |
| `internal/auth` | JWT, middleware, rôles |
| `internal/actors` | Acteurs PostgreSQL ou mémoire |
| `internal/db` | Migrations SQL |
| `internal/batch` | Métier lots, paiements, stats |
| `internal/fabric` | `InMemoryClient` ou `GatewayClient` |
| `internal/httpapi` | Routes Gin, CORS, rate limit |
| `internal/cloudinary` | Upload images |
| `internal/media` | Métadonnées `lot_media` |
| `internal/groupedlist` | Listes groupées coopérative |
| `pkg/models` | Modèles partagés |

## Prérequis

- Go **1.23+**
- Docker / Docker Compose (stack complète)

## Démarrage rapide

```bash
cd tracabilite-api
docker compose up --build
```

- API : `http://localhost:8080`
- Sans Fabric local : `USE_INMEMORY_FABRIC=true` (défaut compose)

```bash
curl -s http://localhost:8080/health
```

Sans Docker :

```bash
USE_INMEMORY_FABRIC=true go run ./cmd/api
```

Sans `DATABASE_URL` → acteurs en **mémoire** ; sans `REDIS_URL` → rate limit `/verify` en mémoire.

## Développement : éviter `docker compose up --build` à chaque modification

Chaque `up --build` **recompile l’image** (`Dockerfile`) → lent. Pour le quotidien :

1. **Go sur la machine + Postgres/Redis en Docker** (le plus rapide : recompile typiquement en 1–3 s) :
   ```bash
   cd tracabilite-api
   ./scripts/dev-api-local.sh
   ```
   Lance `postgres` + `redis` si besoin, puis `go run ./cmd/api` (rechargez le terminal après changement de `.env`).

2. **Tout en Docker mais sans rebuild d’image** : service `api_dev` qui monte le code et utilise `go run` ([`docker-compose.dev.yml`](docker-compose.dev.yml)) :
   ```bash
   docker compose stop api
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d api_dev
   ```

Pour une **release** ou la prod : reconstruire l’image comme d’habitude (`docker compose up -d --build api`).

## Variables d’environnement

| Variable | Description |
|----------|-------------|
| `PORT` | Port HTTP (défaut `8080`) |
| `JWT_SECRET` | Secret HMAC JWT |
| `APP_ENV` | `production` → `JWT_SECRET` obligatoire |
| `DATABASE_URL` | PostgreSQL (`?sslmode=require` sur Neon) |
| `REDIS_URL` | Rate limit `GET /verify/:id` |
| `ALLOWED_ORIGINS` | CORS (virgules) |
| `USE_INMEMORY_FABRIC` | `true` → mock ledger |
| `PUBLIC_VERIFY_BASE_URL` | Base URL QR (défaut `https://chaincacao.tg/verify`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Preset **unsigned** |
| `DEMO_INITIAL_CREDIT` | Crédit portefeuille demo (`false` pour désactiver) |

### Fabric Gateway

Si `FABRIC_PEER_ENDPOINT` est défini et `USE_INMEMORY_FABRIC` ≠ `true` :

| Variable | Exemple |
|----------|---------|
| `FABRIC_MSP_ID` | `Org1MSP` |
| `FABRIC_PEER_ENDPOINT` | `dns:///peer0…:7051` |
| `FABRIC_TLS_CERT_PATH` | PEM CA peer |
| `FABRIC_SIGNCERT_PATH` / `FABRIC_KEY_PATH` | Identité Gateway |
| `FABRIC_CHANNEL` | `mychannel` |
| `FABRIC_CHAINCODE` | `chaincacao` |

**Résolution DNS du peer (`dns:///peer0…:7051`) :** ce nom n’existe pas sur Internet. Avec le `docker-compose.yml` du dépôt, le service `api` ajoute `peer0.org1.example.com` → `host-gateway` (IP de l’hôte Docker), ce qui convient quand la test-network publie le peer sur le port **7051** de la machine hôte. Sur une VM seule, ajoute la même ligne dans `/etc/hosts`, ou mets l’API derrière **`FABRIC_PROXY_URL`** (voir `cmd/fabric-proxy`).

**Chaincode attendu :** `CreateBatch`, `TransferBatch`, `UpdateBatchWeight`, `MarkBatchExported`, `GetBatch`, `GetHistory`, `GetStats`, etc.

L’API signe les transactions avec **une identité Gateway** ; l’`actor_id` JWT est une donnée métier côté chaincode.

## Rôles (`pkg/models`)

| Rôle API | Usage |
|----------|--------|
| `agriculteur` | Création lots, sync offline |
| `cooperative` | Listes groupées, réception |
| `transformateur` | Poids, paiement, transfert |
| `exportateur` | Export, paiement |
| `ministere` | Stats / supervision |
| `admin` | Back-office complet |

## Routes `/api/v1`

### Public

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/login` | PIN ou email/password |
| `POST` | `/auth/signup` | Inscription |
| `GET` | `/verify/:id` | Vérification publique |
| `GET` | `/lot/:id` | Détail lot |
| `GET` | `/lot/:id/history` | Historique |
| `GET` | `/qrcode/:id` | QR (`?format=png`) |

### JWT — lots & logistique

| Méthode | Route | Rôles |
|---------|-------|-------|
| `POST` | `/lot` | agriculteur, admin |
| `GET` | `/lot/:id/qr` | JWT |
| `POST` | `/transfer` | agriculteur, cooperative, transformateur, exportateur, admin |
| `PUT` | `/lot/:id/weight` | transformateur, exportateur, admin |
| `POST` | `/lot/:id/export` | exportateur, admin |
| `POST` | `/lot/:id/photo` | multipart Cloudinary |
| `PUT` | `/lot/:id/corriger` | agriculteur, cooperative, admin |
| `GET` | `/lot/:id/position` | JWT |
| `POST` | `/sync` | agriculteur, admin |

### JWT — paiements & portefeuille

| Méthode | Route | Rôles |
|---------|-------|-------|
| `POST` | `/lot/:id/prix` | fixer prix/kg |
| `POST` | `/lot/:id/confirmer` | **paiement** (PIN) — transformateur, exportateur, admin |
| `POST` | `/lot/:id/reception` | confirmation réception |
| `GET` | `/lot/:id/paiement` | détail paiement |
| `GET` | `/portefeuille/solde` | solde |
| `POST` | `/portefeuille/depot` | dépôt |
| `POST` | `/portefeuille/retrait` | retrait |

### JWT — listes groupées

| Méthode | Route | Rôles |
|---------|-------|-------|
| `POST` | `/liste-groupee` | cooperative, admin |
| `POST` | `/liste-groupee/:id/preview` | transformateur, exportateur, admin |
| `POST` | `/liste-groupee/:id/payer` | transformateur, exportateur, admin |

### JWT — dashboards

| Méthode | Route | Rôles |
|---------|-------|-------|
| `GET` | `/dashboard/stats` | admin, ministere |
| `GET` | `/dashboard/recent-transfers` | admin |
| `GET` | `/dashboard/activity-chart` | admin |
| `GET` | `/dashboard/alerts-count` | admin |

### JWT — admin `/api/v1/admin/*`

Acteurs, config, incidents, `metrics/expvar` — rôle **admin** uniquement.

`POST /admin/marge` — marge coopérative.

### Divers

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/actors` | Liste acteurs |
| `GET` | `/actors/me/lots` | Lots du propriétaire courant |
| `POST` | `/device/register` | Push notifications |
| `POST` | `/auth/register` | Création acteur (admin) |

**Compat :** `POST /batch/create`, `POST /batch/transfer`, `GET /batch/:id`, `GET /batch/:id/history`.

## Exemples

Login :

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"actor_id":"actor-agri-001","pin":"1111"}'
```

Création lot (multipart + EXIF GPS) :

```bash
curl -s -X POST "http://localhost:8080/api/v1/lot" \
  -H "Authorization: Bearer $JWT" \
  -F "file=@photo.jpg" \
  -F "culture=cacao" \
  -F "variete=forastero" \
  -F "quantite=25" \
  -F "region=Plateaux" \
  -F "village=Kpalime" \
  -F "date_recolte=2026-05-01"
```

Paiement lot :

```bash
curl -s -X POST "http://localhost:8080/api/v1/lot/LOT-.../prix" \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"prix_kg": 1200}'

curl -s -X POST "http://localhost:8080/api/v1/lot/LOT-.../confirmer" \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"pin":"2222"}'
```

QR PNG :

```bash
curl -s -o qr.png "http://localhost:8080/api/v1/qrcode/LOT-...?format=png"
```

## Neon & Cloudinary

- **Neon :** `DATABASE_URL` avec `sslmode=require` ; possible sans service Postgres du compose.
- **Cloudinary :** preset unsigned → `POST /api/v1/lot/:id/photo` (champ `file`).

## Développement

```bash
go test ./...
go run ./cmd/api
```

Cache Go en environnement contraint :

```bash
GOCACHE=$PWD/.gocache TMPDIR=$PWD/.tmp go build -o ./bin/api ./cmd/api
```
