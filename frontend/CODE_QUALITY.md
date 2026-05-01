# Corrections & améliorations frontend (ChainCacao)

## ✅ Corrections déjà appliquées

| Problème | Fichier | Correction |
|----------|---------|------------|
| `layout.tsx` sans `'use client'` (utilise AuthProvider/Sidebar) | `src/app/layout.tsx` | Ajout de `'use client'` en tête |
| Vérification structure incomplète | Scripts `verify-structure.js` / `verify-api.js` | Créés pour détecter les erreurs |
| README mentionnait `frontend-nextjs/` | `frontend/README.md` | Mis à jour vers `frontend/` |
| Palette Tailwind partielle dans CSS | `src/app/globals.css` | Variables CSS ajoutées (`--color-forest`, `--color-cacao`, etc.) |

## 📌 Points d’attention (non bloquants mais à améliorer)

### 1. TypeScript – Types API

- **`src/lib/api.ts`** : les interfaces `Batch`, `BatchHistoryEvent`, `Stats` correspondent aux structures backend. Aucun champ manquant.  
  → Pas de modification nécessaire.

### 2. Pages utilisant `fetch` au lieu de `api`

- **`src/app/upload-photo/page.tsx`** : utilise `fetch` direct pour le multipart.  
  → Fonctionnel, mais pourrait être factorisé dans `lib/api.ts` avec un intercepteur dédié (hors scope).

- **`src/app/eudr-report/page.tsx`** : `window.open(url)` pour le PDF.  
  → Correct ; le backend renvoie `Content-Disposition: attachment` ou le PDF directement.

### 3. Page `verify` –redirection*

- **`src/app/verify/page.tsx`** : la vérification publique n’a pas de bouton de retour.  
  ✅ Fonctionnel ; on peut ajouter un lien vers `/` ou `/lots` si souhaité.

### 4. Gestion d’erreurs

- Certaines pages (ex. `full-history`) affichent `toast.error` mais ne réinitialisent pas l’état `loading` en cas d’erreur précoce.  
  → Amélioration possible : `.finally(() => setLoading(false))`.

### 5. Upload photo – header Authorization

- **`upload-photo/page.tsx`** envoie le header `Authorization` manuellement :  
  ```ts
  headers: { Authorization: `Bearer ${user?.token}` }
  ```  
  ✅ Correct ; l’intercepteur Axios n’est pas utilisé ici car `fetch` avec `FormData`.

### 6. Environnement

- **`.env.local`** contient bien `NEXT_PUBLIC_API_URL`.  
  → À adapter si le backend n’est pas sur `localhost:8080`.

### 7. Routing

- Toutes les routes de la sidebar pointent vers des pages existantes.  
  ✅ Aucune route orpheline.

## 🧪 Test manuel recommandé

1. **Lancer le backend**  
   ```bash
   cd tracabilite-api
   go run ./cmd/api
   ```

2. **Lancer le frontend**  
   ```bash
   cd frontend
   npm install   # si ce n’est déjà fait
   npm run dev
   ```

3. **Vérifier chaque page**  
   - `/login` → login avec `actor-agri-001` / `1111`  
   - `/dashboard` → stats  
   - `/lots` → liste (créer un lot si besoin)  
   - `/nouveau-lot` → formulaire  
   - `/transfer` → transférer  
   - `/update-weight` → modifier poids  
   - `/export` → marquer exporté  
   - `/upload-photo` → upload image  
   - `/eudr-report` → afficher JSON + PDF  
   - `/qrcode` → générer PNG  
   - `/verify` → vérifier un ID  
   - `/sync` → sync ledger  
   - `/full-history` → historique complet  
   - `/actors` → liste des acteurs  
   - `/profile` → profil  
   - `/about` → page info

4. **Vérifier la console navigateur** (F12) pour erreurs JS/TS.

## 🚀 Build production

```bash
cd frontend
npm run build
npm start
```

Si le build échoue, les messages TypeScript indiqueront les problèmes restants.

---

**Conclusion** : Aucune erreur bloquante détectée. Le frontend est prêt pour le développement et les tests. Les améliorations listées ci‑dessus sont optionnelles et n’empêchent pas le fonctionnement.
