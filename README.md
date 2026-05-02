# ChainCacao — Système de traçabilité agricole sur blockchain

> Plateforme de traçabilité de la chaîne de valeur cacao (et cultures agricoles) basée sur **Hyperledger Fabric**, une **API Go** et une **application mobile Expo / React Native**.  
> Projet réalisé dans le cadre d'un concours d'innovation — demi-finale.

---

## Sommaire

1. [Contexte et problématique](#1-contexte-et-problématique)
2. [Architecture technique](#2-architecture-technique)
3. [Ce que nous avons réalisé](#3-ce-que-nous-avons-réalisé)
4. [Structure du dépôt](#4-structure-du-dépôt)
5. [Prérequis](#5-prérequis)
6. [Démarrage rapide](#6-démarrage-rapide)
7. [Variables d'environnement](#7-variables-denvironnement)
8. [Référence API](#8-référence-api)
9. [Application mobile](#9-application-mobile)
10. [Chaincode Hyperledger Fabric](#10-chaincode-hyperledger-fabric)
11. [Tests](#11-tests)
12. [Critères d'acceptation couverts](#12-critères-dacceptation-couverts)
13. [Équipe](#13-équipe)

---

## 1. Contexte et problématique

La filière cacao (et plus largement agricole) souffre de plusieurs problèmes structurels :

| Problème | Impact |
|----------|--------|
| **Falsification des données de provenance** | Perte de confiance des acheteurs et des certificateurs |
| **Manque de transparence** de la chaîne d'approvisionnement | Impossibilité de reconstituer le parcours d'un lot |
| **Absence d'outil numérique terrain** adapté aux agriculteurs | Saisies papier, pertes d'information, retards |
| **Difficulté de vérification consommateur** | Le consommateur final ne peut pas vérifier l'authenticité d'un produit |

**ChainCacao** répond à ces enjeux en enregistrant chaque événement de la chaîne de valeur — de la récolte au distributeur — sur un ledger **Hyperledger Fabric** immuable et vérifiable publiquement.

---

## 2. Architecture technique

```
┌──────────────────────────────────────────────────────────────────┐
│                       Couche présentation                        │
│   Application Mobile (Expo / React Native)                       │
│   [Agriculteurs terrain — iOS & Android]                         │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS / JWT
┌──────────────────▼───────────────────────────────────────────────┐
│                       Backend — API Go (Gin)                     │
│  Auth JWT · Validation métier · Gestion acteurs · Rapports EUDR  │
│  PostgreSQL (acteurs, médias) · Redis (rate-limit, cache)        │
│  Cloudinary (photos lots) · PDF signature RSA                    │
└──────────────────┬───────────────────────────────────────────────┘
                   │ Fabric Gateway SDK
┌──────────────────▼───────────────────────────────────────────────┐
│               Blockchain — Hyperledger Fabric                    │
│  3 Peers (OrgAgriculteur · OrgTransformateur · OrgDistributeur)  │
│  1 Orderer Raft · 1 CA par org · Channel : agri-chain            │
│  Chaincode Go : CreateBatch · TransferBatch · GetHistory …       │
└──────────────────────────────────────────────────────────────────┘
```

### Flux d'une transaction type

1. L'agriculteur saisit un lot sur l'app mobile (ou via l'API).
2. L'API Go **valide** les données et **authentifie** l'acteur via JWT.
3. Le SDK Fabric Go **soumet la transaction** au réseau.
4. Les peers des organisations concernées **endossent** la transaction.
5. L'orderer Raft **crée un bloc** et le distribue à tous les peers.
6. L'API renvoie le **hash de transaction** et l'**UUID du lot** à l'interface.

---

## 3. Ce que nous avons réalisé

### Livrable 1 — API & interface fonctionnelle ✅

- **Enregistrement d'un lot** : formulaire structuré (culture, quantité, lieu GPS, date de récolte, notes) → appel `POST /api/v1/lot` → UUID de lot + hash Fabric.
- **Transfert entre acteurs** : recherche par UUID ou QR code, sélection du destinataire, commentaire, signature JWT → `POST /api/v1/transfer`.
- **Gestion des rôles** : Agriculteur, Coopérative, Transformateur, Distributeur, Admin — chaque rôle dispose de droits distincts sur le ledger et sur l'API.
- **Mise à jour de poids** après transformation (`PUT /api/v1/lot/:id/weight`).
- **Export** d'un lot vers un distributeur (`POST /api/v1/lot/:id/export`).
- **Upload de photos** par lot vers Cloudinary (`POST /api/v1/lot/:id/photo`).

### Livrable 2 — Vérification publique ✅

- Page de vérification **sans authentification** : `GET /api/v1/verify/:id`
- Retourne une **frise chronologique complète** (création → transferts → transformation → certification) issue directement du ledger via `GetHistoryForKey`.
- **QR code** généré par l'API (`GET /api/v1/qrcode/:id`) pointant vers l'URL de vérification publique.
- **Rapport de conformité EUDR** : heuristique GPS + historique + PDF signé RSA (`GET /api/v1/eudr/:id/report/pdf`).

### Livrable 3 — Application mobile agriculteurs ✅

- **Authentification** par email/password ou PIN (LocalAuthentication biométrique possible).
- **Saisie de lot simplifiée** avec géolocalisation automatique (GPS du téléphone).
- **Scan QR code** pour identifier un lot existant (transfert ou vérification).
- **Mode hors-ligne** : lots stockés dans AsyncStorage, synchronisation automatique toutes les **30 secondes** à la reconnexion réseau (`NetInfo`).
- **Indicateur visuel** : lot confirmé (hash blockchain visible) vs lot en attente de sync.
- **Consultation de l'historique** des lots de l'agriculteur connecté.

### Couche blockchain — Hyperledger Fabric ✅

| Fonction chaincode | Action |
|--------------------|--------|
| `CreateBatch` | Création d'une entrée immuable sur le ledger |
| `TransferBatch` | Transfert de propriété entre organisations |
| `UpdateBatchWeight` | Mise à jour du poids (transformation) avec justification |
| `MarkBatchExported` | Changement de statut en `exporte` |
| `GetBatch` | Lecture de l'état courant d'un lot |
| `GetHistory` | Historique complet via `GetHistoryForKey` |

---

## 4. Structure du dépôt

```
chaincacao/
├── AppMobile/                  # Application mobile Expo / React Native
│   ├── app/                    # Écrans Expo Router (login, création lot, transfert, profil…)
│   ├── components/             # Composants réutilisables
│   ├── contexts/               # Auth context (session JWT, AsyncStorage)
│   ├── hooks/                  # use-auth, use-sync (offline sync), use-storage
│   ├── services/               # Client Axios + types API
│   ├── utils/                  # Helpers QR code, timeline
│   ├── __tests__/              # Tests unitaires Jest
│   ├── app.config.js           # Config Expo (URL API, EAS, plugins)
│   └── eas.json                # Profils de build EAS (preview APK, production AAB)
│
├── tracabilite-api/            # Backend Go (Gin)
│   ├── cmd/api/                # Point d'entrée — serveur HTTP (port 8080)
│   ├── cmd/fabric-proxy/       # Proxy HTTP → Fabric Gateway (déploiement distribué)
│   ├── internal/
│   │   ├── auth/               # JWT (génération, validation, middleware RBAC)
│   │   ├── actors/             # Acteurs : store PostgreSQL ou mémoire
│   │   ├── batch/              # Logique métier lots + rapport EUDR
│   │   ├── fabric/             # Clients Fabric : Gateway réel, InMemory, Proxy
│   │   ├── db/                 # Pool pgx + migrations SQL
│   │   ├── httpapi/            # Router Gin + handlers + middlewares CORS/rate-limit
│   │   ├── cloudinary/         # Upload photos
│   │   ├── media/              # Persistance métadonnées médias (PostgreSQL)
│   │   └── report/             # Génération PDF EUDR (fpdf + signature RSA)
│   ├── pkg/models/             # Structs partagés (Batch, Actor, APIResponse, Role)
│   ├── configs/                # connection-profile.yaml, crypto-config.yaml (Fabric)
│   ├── docker-compose.yml      # Postgres 16 + Redis 7 + API
│   ├── Dockerfile              # Build statique Alpine
│   └── .env.fabric.example     # Modèle de variables d'environnement
│
├── chaincode/                  # Chaincode Hyperledger Fabric (Go)
│   └── chaincacao.go           # Contrat : CreateBatch, Transfer, GetHistory…
│
├── scripts/
│   ├── deploy-fabric.sh        # Lance test-network + déploie le chaincode
│   ├── install-compose.sh      # Installation Docker Compose
│   └── start-api.sh            # Démarrage de l'API Go
│
└── fabric-samples/             # Cloné automatiquement par deploy-fabric.sh
```

---

## 5. Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Go | 1.21+ |
| Node.js | 20+ |
| Docker & Docker Compose | 24+ |
| Expo CLI | dernière version (`npm i -g expo-cli`) |
| EAS CLI (optionnel, builds cloud) | `npm i -g eas-cli` |

---

## 6. Démarrage rapide

### 6.1 Réseau Fabric + Chaincode

```bash
# Clone le dépôt fabric-samples si absent, lance le réseau et déploie le chaincode
cd chaincacao/
bash scripts/deploy-fabric.sh
```

Le réseau Hyperledger Fabric démarre en moins de 2 minutes avec Docker Compose.

### 6.2 Backend API Go

```bash
cd tracabilite-api/

# Copier et remplir le fichier d'environnement
cp .env.fabric.example .env
# Éditer .env (JWT_SECRET, DATABASE_URL, variables Fabric…)

# Option A — avec Docker Compose (Postgres + Redis + API)
docker compose up --build

# Option B — démarrage direct Go (sans Postgres ni Fabric réel)
USE_INMEMORY_FABRIC=true go run ./cmd/api
```

L'API est accessible sur **http://localhost:8080**.  
`GET /health` doit renvoyer `{"status":"ok"}`.

### 6.3 Application mobile

```bash
cd AppMobile/
npm install

# Démarrer en développement (Expo Go)
npx expo start

# Construire un APK de prévisualisation (EAS)
eas build --profile preview --platform android
```

> L'URL de l'API est configurée dans `app.config.js` → `extra.apiUrl`.

---

## 7. Variables d'environnement

Fichier modèle : `tracabilite-api/.env.fabric.example`

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port HTTP de l'API | `8080` |
| `JWT_SECRET` | Secret HMAC-SHA256 pour les tokens | — (obligatoire) |
| `ALLOWED_ORIGINS` | CORS — domaines autorisés | `*` |
| `DATABASE_URL` | URL PostgreSQL (`postgres://…`) | — (optionnel, mémoire si absent) |
| `REDIS_URL` | URL Redis (`redis://…`) | — (optionnel) |
| `USE_INMEMORY_FABRIC` | `true` → Fabric simulé en mémoire | `false` |
| `FABRIC_PEER_ENDPOINT` | Adresse du peer Fabric | — |
| `FABRIC_GATEWAY_PEER_SSL_OVERRIDE` | SNI pour TLS Fabric | — |
| `FABRIC_PROXY_URL` | URL du fabric-proxy (si déployé) | — |
| `CLOUDINARY_URL` | URL Cloudinary pour l'upload photos | — (optionnel) |
| `PUBLIC_VERIFY_BASE_URL` | URL de base des QR codes | `http://localhost:3000/verify` |
| `EUDR_RSA_PRIVATE_KEY_PEM` | Clé RSA pour signature PDF EUDR | — (optionnel) |

---

## 8. Référence API

### Routes publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/login` | Connexion (`actor_id`+`pin` ou `email`+`password`) → JWT |
| `POST` | `/api/v1/auth/signup` | Inscription agriculteur → JWT |
| `GET` | `/api/v1/verify/:id` | Vérification publique d'un lot (historique complet) |
| `GET` | `/api/v1/qrcode/:id` | QR code vers l'URL de vérification (`?format=png`) |
| `GET` | `/api/v1/lot/:id` | État courant d'un lot |
| `GET` | `/api/v1/lot/:id/history` | Historique complet d'un lot |

### Routes authentifiées (Bearer JWT)

| Méthode | Route | Rôles | Description |
|---------|-------|-------|-------------|
| `POST` | `/api/v1/auth/register` | Admin | Créer un acteur avec rôle arbitraire |
| `POST` | `/api/v1/lot` | Agriculteur, Admin | Créer un lot sur le ledger |
| `POST` | `/api/v1/transfer` | Tous sauf Agriculteur, Admin | Transférer un lot |
| `PUT` | `/api/v1/lot/:id/weight` | Transformateur, Distributeur, Admin | Mettre à jour le poids |
| `POST` | `/api/v1/lot/:id/export` | Distributeur, Admin | Marquer un lot exporté |
| `POST` | `/api/v1/lot/:id/photo` | JWT | Uploader une photo (Cloudinary) |
| `GET` | `/api/v1/eudr/:id/report` | Distributeur, Admin | Rapport conformité EUDR (JSON) |
| `GET` | `/api/v1/eudr/:id/report/pdf` | Distributeur, Admin | Rapport EUDR en PDF signé |
| `POST` | `/api/v1/sync` | Agriculteur, Admin | Sync groupée de lots hors-ligne |
| `GET` | `/api/v1/dashboard/stats` | Admin | Statistiques globales |
| `GET` | `/api/v1/actors` | JWT | Liste des acteurs enregistrés |

> Routes de compatibilité : `POST /api/v1/batch/create`, `POST /api/v1/batch/transfer`, `GET /api/v1/batch/:id`, `GET /api/v1/batch/:id/history`.

---

## 9. Application mobile

### Fonctionnalités implémentées

- **Authentification** : connexion email/mot de passe ou PIN, gestion de session avec token JWT dans AsyncStorage.
- **Création de lot** : formulaire adapté aux petits écrans (culture, quantité, localisation GPS automatique, notes).
- **Transfert de lot** : scan QR ou saisie UUID, sélection du destinataire, commentaire.
- **Historique** : timeline des lots enregistrés par l'acteur connecté.
- **Scanner QR** : identification rapide d'un lot existant.
- **Mode hors-ligne** : les saisies sont stockées localement (`AsyncStorage`) et synchronisées automatiquement toutes les 30 secondes dès que la connexion réseau est rétablie (`NetInfo`). L'indicateur visuel distingue les lots confirmés (hash blockchain) des lots en attente.
- **Profil** : informations de l'acteur connecté, déconnexion.

### Build

```bash
# APK de développement / prévisualisation
eas build --profile preview --platform android

# Build de production (AAB pour Play Store)
eas build --profile production --platform android
```

---

## 10. Chaincode Hyperledger Fabric

Le smart contract est situé dans `chaincode/chaincacao.go` et utilise `fabric-contract-api-go`.

### Structure d'un lot sur le ledger

```go
type Batch struct {
    ID             string  // Identifiant unique (format TC-YYYYMMDD-xxxxx)
    Culture        string  // Type de produit (ex : cacao, maïs)
    Quantite       float64 // Poids en kg
    Lieu           string  // Géolocalisation (village, région ou GPS)
    DateRecolte    string  // ISO 8601
    ProprietaireID string  // ActeurID courant
    OrgID          string  // Organisation Fabric MSP
    Statut         string  // cree | transfere | transforme | exporte
    Timestamp      string  // Horodatage Fabric
}
```

### Déploiement manuel (sans script)

```bash
# Depuis fabric-samples/test-network/
./network.sh up createChannel -c agri-chain -ca
./network.sh deployCC -c agri-chain -ccn chaincacao \
  -ccp ../../chaincode -ccl go
```

---

## 11. Tests

### Backend Go

```bash
cd tracabilite-api/
go test ./...
```

### Application mobile (Jest)

```bash
cd AppMobile/
npm test
```

Les tests unitaires couvrent :
- `__tests__/apiPayloads.test.ts` — Validation des payloads API
- `__tests__/historiqueTimeline.test.ts` — Construction de la frise chronologique
- `__tests__/lotQr.test.ts` — Génération et parsing QR code

---

## 12. Critères d'acceptation couverts

| Critère | Statut |
|---------|--------|
| Un agriculteur peut créer un lot et obtenir un UUID | ✅ |
| Le transfert est enregistré sur la blockchain | ✅ |
| Un UUID valide affiche l'historique chronologique complet | ✅ |
| L'historique provient directement du ledger (`GetHistoryForKey`) | ✅ |
| La page de vérification est accessible sans authentification | ✅ |
| L'app tourne sur Android sans erreur | ✅ |
| La saisie hors-ligne est stockée et synchronisée à la reconnexion | ✅ |
| Le scan QR code identifie correctement un lot existant | ✅ |
| Le réseau Fabric démarre avec Docker Compose en moins de 2 minutes | ✅ |
| Toutes les fonctions du chaincode sont opérationnelles | ✅ |
| Un bloc est créé et visible après chaque transaction confirmée | ✅ |

---

## 13. Équipe

Projet développé pour la **demi-finale du concours du MBH** — *Système de traçabilité agricole sur blockchain*.

- Architecture : Hyperledger Fabric · Go API · React Native
- Version du cahier des charges : 1.0 — 29 avril 2026

---

> **Note de sécurité** : Ne versionnez jamais les fichiers `.env`, `chaincacao.pem` ni les clés cryptographiques Fabric en production. Utilisez un gestionnaire de secrets (Vault, AWS Secrets Manager, etc.).
