# Frontend Next.js – ChainCacao (complété)

Application web complète pour la traçabilité cacao, réalisée avec Next.js 14 (App Router), TypeScript et Tailwind CSS.

## 📁 Structure du projet

```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # Layout racine avec AuthProvider et Sidebar
│  │  ├─ page.tsx            # Redirection automatique vers login ou dashboard
│  │  ├─ globals.css         # Styles globaux + Tailwind
│  │  ├─ login/page.tsx      # Connexion
│  │  ├─ register/page.tsx   # Création compte admin
│  │  ├─ dashboard/page.tsx  # Tableau de bord (cartes métriques)
│  │  ├─ lots/page.tsx       # Liste des lots
│  │  ├─ nouveau-lot/page.tsx# Formulaire création lot
│  │  ├─ lot-detail/page.tsx # Détail + historique d’un lot
│  │  ├─ transfer/page.tsx   # Transfert de propriété
│  │  ├─ update-weight/page.tsx # Mise à jour poids
│  │  ├─ export/page.tsx     # Marquage exporté
│  │  ├─ upload-photo/page.tsx # Upload photo (Cloudinary)
│  │  ├─ eudr-report/page.tsx # Rapport EUDR (JSON + PDF)
│  │  ├─ qrcode/page.tsx     # Génération QR code
│  │  ├─ verify/page.tsx     # Vérification publique (sans auth)
│  │  ├─ sync/page.tsx       # Synchronisation ledger
│  │  ├─ full-history/page.tsx # Historique complet
│  │  ├─ actors/page.tsx     # Liste des acteurs (GET /actors)
│  │  ├─ profile/page.tsx    # Profil utilisateur (infos JWT)
│  │  └─ about/page.tsx      # À propos de l’application
│  ├─ components/
│  │  ├─ Sidebar.tsx         # Navigation latérale
│  │  └─ Spinner.tsx         # Indicateur de chargement
│  ├─ contexts/
│  │  └─ AuthContext.tsx     # Contexte d’authentification (JWT)
│  ├─ lib/
│  │  └─ api.ts              # Client Axios avec interceptors
│  └─ types/
│     └─ index.ts            # Types TypeScript (Batch, Stats, etc.)
├─ .env.local                # Variables d’environnement (API URL)
├─ .env.local.example        # Exemple
├─ tailwind.config.ts        # Configuration Tailwind (couleurs ChainCacao)
├─ postcss.config.js
├─ next.config.js
├─ tsconfig.json
├─ .gitignore
└─ package.json
```

## 🎨 Charte graphique (via Tailwind)

- **Couleurs** : `forest (#1A3A2A)`, `cacao (#5CC97A)`, `gold (#D4A876)`, `earth (#3B2A1A)`, `blockchain (#0F2540)`
- **Typographie** : H1 22px/500, H2 18px, H3 16px, body 14px, caption 13px, label 11px uppercase.
- **Composants** : boutons (primaire, outline, blockchain), badges de statut, cartes métriques, formulaires, sidebar fixe.

## 🔌 API Backend

Le frontend communique avec le backend Go déjà existant :

- **Base URL** : `NEXT_PUBLIC_API_URL` (défaut `http://localhost:8080/api/v1`)
- **Auth** : JWT stocké dans `localStorage`, envoyé automatiquement via l’intercepteur Axios.
- **Endpoints** : conformes au README du backend.

## 🚀 Installation & lancement

### 1. Prérequis

- Node.js ≥ 18
- Backend Go en cours d’exécution sur `http://localhost:8080` (ou modifier `.env.local`)

### 2. Installer les dépendances

```bash
cd frontend
npm install
```

### 3. Configurer l’URL de l’API

```bash
cp .env.local.example .env.local
# éditer .env.local si besoin
```

### 4. Lancer en développement

```bash
npm run dev
```

L’application sera disponible sur `http://localhost:3000`.

### 5. Build & production

```bash
npm run build
npm start
```

## 📱 Pages & routing (toutes les pages sont présentes)

| Route | Description | Authentif. |
|-------|-------------|------------|
| `/login` | Connexion (PIN/email) | ❌ |
| `/register` | Création compte admin | ❌ |
| `/dashboard` | Tableau de bord (stats) | ✅ admin |
| `/lots` | Liste des lots | ✅ agriculteur/admin |
| `/nouveau-lot` | Créer un lot | ✅ agriculteur/admin |
| `/lot-detail` | Détail + historique d’un lot | ✅ public (lecture) |
| `/transfer` | Transférer propriété | ✅ coop/transfo/export/admin |
| `/update-weight` | Mettre à jour poids | ✅ (tout rôle connecté) |
| `/export` | Marquer exporté | ✅ export/admin |
| `/upload-photo` | Upload photo (Cloudinary) | ✅ |
| `/eudr-report` | Rapport EUDR (JSON + PDF) | ✅ export/admin |
| `/qrcode` | Générer QR code (PNG ou JSON) | ❌ public |
| `/verify` | Vérification publique d’un lot | ❌ public |
| `/sync` | Synchronisation ledger | ✅ agriculteur/admin |
| `/full-history` | Historique complet d’un lot | ❌ public |
| `/actors` | Liste des acteurs enregistrés | ✅ |
| `/profile` | Profil utilisateur (infos JWT) | ✅ |
| `/about` | À propos de l’application | ❌ |
| `/` | Redirection auto vers login ou dashboard | — |

## 🛡️ Authentification

- L’authentification utilise `POST /auth/login` (actor_id + pin) qui retourne un JWT.
- Le token est stocké dans `localStorage` et automatiquement ajouté aux requêtes via l’intercepteur Axios.
- Le contexte React (`AuthContext`) expose `user`, `isAuthenticated`, `login`, `logout`.
- La sidebar affiche l’utilisateur connecté et un bouton de déconnexion.
- Les pages protégées redirigent vers `/login` si nécessaire.

## 📦 Dépendances principales

- **Next.js** – Framework React (App Router)
- **React** – UI library
- **Axios** – Client HTTP
- **React Hot Toast** – Notifications
- **Tailwind CSS** – Utility-first CSS framework

## 🎯 Points d’attention

1. **CORS** : assurez-vous que le backend autorise l’origine du frontend (ex. `http://localhost:3000`) via `ALLOWED_ORIGINS`.
2. **Cloudinary** : l’upload de photo nécessite que le backend ait `CLOUDINARY_CLOUD_NAME` et `CLOUDINARY_UPLOAD_PRESET` configurés.
3. **JWT** : le token décodé côté client permet de récupérer `actor_id` et `role` pour les appels nécessitant ces champs.
4. **Rate limiting** : la page `/verify` est publique et sujette au rate limit côté backend.
5. **Pagination** : la liste des lots charge tous les lots puis pagine côté client. Pour de gros volumes, l’API pourrait supporter `?page`/`limit`.

## 🐛 Debug

- Vérifiez la console du navigateur (F12) pour les erreurs réseau.
- Assurez-vous que le backend est accessible : `curl http://localhost:8080/health`.
- Si CORS bloque, ajustez `ALLOWED_ORIGINS` dans la configuration du backend.

---

**Aucune modification du backend n’a été effectuée.** Le frontend Next.js est entièrement indépendant et respecte la charte graphique fournie.
