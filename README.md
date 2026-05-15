# ChainCacao — Traçabilité cacao sur blockchain

Plateforme de traçabilité de la filière cacao (Togo) : **Hyperledger Fabric**, **API Go (Gin)**, **application web Next.js** et **application mobile Expo / React Native**.

> Projet réalisé dans le cadre d'un concours d'innovation — demi-finale.

---

## Sommaire

1. [Contexte](#1-contexte)
2. [Architecture](#2-architecture)
3. [Rôles MVP](#3-rôles-mvp)
4. [Structure du dépôt](#4-structure-du-dépôt)
5. [Prérequis](#5-prérequis)
6. [Démarrage rapide](#6-démarrage-rapide)
7. [Variables d'environnement](#7-variables-denvironnement)
8. [Référence API](#8-référence-api)
9. [Application web (Next.js)](#9-application-web-nextjs)
10. [Application mobile](#10-application-mobile)
11. [Chaincode Fabric](#11-chaincode-fabric)
12. [Tests](#12-tests)

---

## 1. Contexte

| Problème | Réponse ChainCacao |
|----------|-------------------|
| Provenance difficile à prouver | Ledger immuable + historique par lot |
| Chaîne fragmentée | Acteurs unifiés (agriculteur → export) |
| Saisie terrain absente | Mobile offline + sync |
| Vérification consommateur | Page publique `/verify/:id` + QR |

Chaque événement (création, transfert, transformation, paiement, export) est enregistré avec traçabilité blockchain et preuves GPS / photo lorsque applicable.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Présentation                                                    │
│  · Web Next.js 14 (dashboards par rôle, lots, paiement, export) │
│  · Mobile Expo (agriculteurs, coopératives, exportateurs…)      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS + JWT
┌────────────────────────────▼────────────────────────────────────┐
│  API Go (Gin) — tracabilite-api/                                 │
│  Auth · Lots · Transferts · Paiements · Listes groupées          │
│  Portefeuille · Dashboard · Admin                                │
│  PostgreSQL · Redis · Cloudinary                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ Fabric Gateway / InMemory
┌────────────────────────────▼────────────────────────────────────┐
│  Hyperledger Fabric — chaincode/chaincacao.go                      │
│  CreateBatch · TransferBatch · GetHistory · …                      │
└────────────────────────────────────────────────────────────────────┘
```

**Flux type :** saisie lot → validation API + JWT → transaction Fabric → hash renvoyé à l’interface.

---

## 3. Rôles MVP

| Rôle | Interface principale | Capacités clés |
|------|---------------------|----------------|
| **Agriculteur** | Mobile | Création lots, GPS/photo, portefeuille, sync offline |
| **Coopérative** | Mobile + Web | Réception, **liste groupée**, marges |
| **Transformateur** | Web | Lots reçus, mise à jour poids, **paiement par ID lot**, transfert |
| **Exportateur** | Web + Mobile | Stock, export, **paiement par ID lot** (pas de scan QR web) |
| **Ministère** | Web | Supervision nationale, audit par ID, alertes |
| **Admin** | Web | Acteurs, config, incidents, stats globales |

> **Hors MVP :** rôles `verificateur` / `distributeur`, conformité **EUDR** et rapports PDF associés (retirés du produit et de l’API).

**Paiement web :** transformateur et exportateur paient via **`/paiement-lot`** en saisissant l’**identifiant du lot** (PIN + prix optionnel). Le scan QR sert à la **traçabilité publique**, pas au paiement sur le web.

---

## 4. Structure du dépôt

```
chaincacao/
├── frontend/                 # Next.js 14 — interface web par rôle
│   └── src/app/              # Pages : dashboards, lots, paiement-lot, liste-groupee…
├── AppMobile/                # Expo Router — terrain & exportateur mobile
├── tracabilite-api/          # Backend Go (Gin)
│   ├── cmd/api/              # Serveur HTTP :8080
│   ├── cmd/fabric-proxy/     # Proxy HTTP → Fabric (déploiement distribué)
│   └── internal/             # auth, batch, fabric, httpapi, actors…
├── chaincode/                # Smart contract Go (Fabric)
├── scripts/                  # deploy-fabric.sh, start-api.sh…
└── fabric-samples/           # Réseau Fabric (clone / test-network)
```

Documentation détaillée API : [`tracabilite-api/README.md`](tracabilite-api/README.md).

---

## 5. Prérequis

| Outil | Version |
|-------|---------|
| Go | 1.23+ |
| Node.js | 20+ |
| Docker & Docker Compose | récent |
| Expo CLI | pour le mobile |

---

## 6. Démarrage rapide

### 6.1 API Go

```bash
cd tracabilite-api
cp .env.fabric.example .env   # puis éditer JWT_SECRET, etc.
docker compose up --build
# ou, sans Postgres/Fabric réel :
USE_INMEMORY_FABRIC=true go run ./cmd/api
```

```bash
curl -s http://localhost:8080/health
```

### 6.2 Frontend web

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8080
npm run dev
```

Ouvrir **http://localhost:3000** — connexion selon les comptes seed (voir API).

### 6.3 Application mobile

```bash
cd AppMobile
npm install
npx expo start
```

URL API : `app.config.js` → `extra.apiUrl`.

### 6.4 Réseau Fabric (optionnel)

```bash
bash scripts/deploy-fabric.sh
```

---

## 7. Variables d'environnement

Fichier modèle : **`tracabilite-api/.env.fabric.example`**

| Variable | Description |
|----------|-------------|
| `PORT` | Port API (défaut `8080`) |
| `JWT_SECRET` | Secret JWT (**obligatoire en prod**) |
| `DATABASE_URL` | PostgreSQL (sinon acteurs en mémoire) |
| `REDIS_URL` | Rate limit `/verify` |
| `USE_INMEMORY_FABRIC` | `true` → ledger simulé |
| `PUBLIC_VERIFY_BASE_URL` | Base URL des QR (ex. `https://…/verify`) |
| `CLOUDINARY_*` | Upload photos lots |
| `FABRIC_*` | Connexion Fabric Gateway (prod) |

Frontend : `NEXT_PUBLIC_API_URL` dans `frontend/.env.local`.

---

## 8. Référence API

Base : **`/api/v1`**

### Public

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Santé |
| `POST` | `/auth/login` | `actor_id`+`pin` ou `email`+`password` → JWT |
| `POST` | `/auth/signup` | Inscription agriculteur |
| `GET` | `/verify/:id` | Vérification publique (timeline) |
| `GET` | `/lot/:id`, `/lot/:id/history` | Lecture lot |
| `GET` | `/qrcode/:id` | QR traçabilité (`?format=png`) |

### Authentifié (JWT)

| Méthode | Route | Rôles (résumé) |
|---------|-------|----------------|
| `POST` | `/lot` | agriculteur, admin |
| `POST` | `/transfer` | chaîne complète |
| `PUT` | `/lot/:id/weight` | transformateur, exportateur, admin |
| `POST` | `/lot/:id/export` | exportateur, admin |
| `POST` | `/lot/:id/prix` | prix au kg |
| `POST` | `/lot/:id/confirmer` | **paiement** transformateur / exportateur / admin |
| `POST` | `/lot/:id/reception` | confirmation réception physique |
| `POST` | `/liste-groupee` | coopérative, admin |
| `POST` | `/liste-groupee/:id/payer` | transformateur, exportateur, admin |
| `GET` | `/portefeuille/solde` | portefeuille acteur |
| `GET` | `/actors/me/lots` | lots du propriétaire courant |
| `GET` | `/dashboard/stats` | admin, ministère |
| `GET` | `/dashboard/alerts-count` | admin |
| `POST` | `/sync` | sync lots offline (agriculteur) |

Admin : `/api/v1/admin/actors`, `/admin/config`, `/admin/incidents`, etc.

Compatibilité : `/batch/create`, `/batch/transfer`, `/batch/:id`.

Exemple paiement :

```bash
curl -s -X POST "http://localhost:8080/api/v1/lot/LOT-.../confirmer" \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"pin":"2222"}'
```

---

## 9. Application web (Next.js)

| Route | Usage |
|-------|--------|
| `/login`, `/register` | Authentification |
| `/dashboard-*` | Tableau de bord par rôle |
| `/lots`, `/nouveau-lot`, `/lot-detail` | Gestion lots |
| `/paiement-lot` | Paiement par **ID lot** (transformateur / exportateur) |
| `/liste-groupee` | Regroupement coopérative |
| `/portefeuille` | Solde et mouvements |
| `/transfer`, `/export` | Logistique |
| `/verify` | Vérification (lien public) |
| `/dashboard-ministere` | Supervision & audit |
| `/blockchain`, `/actors` | Admin / ministère |

Build production : `cd frontend && npm run build`.

---

## 10. Application mobile

- Authentification PIN / email, session JWT (`AsyncStorage`)
- Création lot (GPS, photo), transferts, portefeuille
- Mode hors-ligne + `POST /sync`
- Exportateur : stock, paiement mobile par lot (scan / ID selon écran)

```bash
cd AppMobile && npm test
eas build --profile preview --platform android
```

---

## 11. Chaincode Fabric

Fichier : `chaincode/chaincacao.go`

Fonctions principales : `CreateBatch`, `TransferBatch`, `UpdateBatchWeight`, `MarkBatchExported`, `GetBatch`, `GetHistory`, `GetStats`.

Déploiement (exemple) :

```bash
cd fabric-samples/test-network
./network.sh up createChannel -c agri-chain -ca
./network.sh deployCC -c agri-chain -ccn chaincacao -ccp ../../chaincode -ccl go
```

---

## 12. Tests

```bash
# API
cd tracabilite-api && go test ./...

# Frontend
cd frontend && npm run build

# Mobile
cd AppMobile && npm test
```

---

## Équipe

Projet **MBH** — *Système de traçabilité agricole sur blockchain*.  
Stack : Hyperledger Fabric · Go · Next.js · React Native / Expo.
