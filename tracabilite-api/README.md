# API Go - Tracabilite Blockchain

Backend Golang (Gin) servant de pont entre frontend (React/React Native) et blockchain Hyperledger Fabric, conforme aux routes du cahier des charges.

## Architecture

- `cmd/api`: point d'entree HTTP (`:8080` par defaut)
- `internal/auth`: JWT (generation, validation, middleware, roles)
- `internal/actors`: registre acteurs/organisations (demo in-memory)
- `internal/batch`: logique metier (validation, creation, transfert, historique)
- `internal/fabric`: adaptateur blockchain (client in-memory + interface a brancher au SDK Fabric)
- `internal/httpapi`: handlers + routage Gin
- `pkg/models`: structs partages

## Prerequis

- Go `1.21+`

## Lancer en local

```bash
cd tracabilite-api
go mod tidy
go run ./cmd/api
```

Health check:

```bash
curl http://localhost:8080/health
```

## Routes exposees

- `POST /api/v1/auth/login` (public)
- `POST /api/v1/batch/create` (JWT + role)
- `POST /api/v1/batch/transfer` (JWT + role)
- `GET /api/v1/batch/:id` (JWT)
- `GET /api/v1/batch/:id/history` (JWT)
- `GET /api/v1/verify/:id` (public)
- `GET /api/v1/actors` (JWT)
- `GET /health` (public)

## Exemple rapide

1. Login:

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"actor_id":"actor-agri-001","pin":"1111"}'
```

2. Creer un batch (utiliser le token recu):

```bash
curl -s -X POST http://localhost:8080/api/v1/batch/create \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"culture":"cacao","quantite":120.5,"lieu":"Kpalime","date_recolte":"2026-04-28"}'
```

## Brancher Hyperledger Fabric reel

Le projet isole la couche blockchain derriere l'interface `internal/fabric.Client`.
Pour brancher le SDK Fabric Go:

- implementer un client `FabricSDKClient` dans `internal/fabric`
- charger `connection-profile.yaml` et identites MSP
- mapper `CreateBatch`, `TransferBatch`, `GetBatch`, `GetHistory` sur les invocations chaincode

Le frontend n'aura pas besoin de changer.
