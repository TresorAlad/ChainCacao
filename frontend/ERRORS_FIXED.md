# Corrections appliquées au frontend Next.js

## Erreurs corrigées

### 1. Metadata dans un client component
- **Fichier** : `src/app/layout.tsx`
- **Problème** : export de `metadata` avec `'use client'` → interdit par Next.js
- **Solution** :
  - Créé `src/app/providers.tsx` (client component) qui encapsule `AuthProvider` et `Sidebar`
  - `layout.tsx` devient un Server Component (sans `'use client'`) et exporte `metadata`
  - `layout.tsx` utilise `<Providers>{children}</Providers>`

### 2. Tailwind CSS: `@apply` avec variable CSS + opacité
- **Fichier** : `src/app/globals.css`
- **Problème** : `@apply hover:bg-[var(--color-cacao)]/10` et `@apply focus:ring-[var(--color-cacao)]/20` sont invalides (Tailwind ne supporte pas la syntaxe `/10` sur les variables)
- **Solution** :
  - Remplacé par CSS natif : `.btn-outline:hover { background-color: rgba(92, 201, 122, 0.1); }`
  - Pour les inputs : `box-shadow: 0 0 0 2px rgba(92, 201, 122, 0.2);`
  - Retiré `textTransform` invalide dans `tailwind.config.ts` → déplacé en `.text-label { text-transform: uppercase; }` dans `globals.css`

### 3. `useSearchParams` sans Suspense
- **Fichier** : `src/app/lot-detail/page.tsx`
- **Problème** : `useSearchParams()` déclenche une erreur "should be wrapped in a suspense boundary"
- **Solution** : restructuré la page en deux composants :
  - `LotDetailContent` (contient la logique avec hooks)
  - `LotDetailPage` (enveloppe dans `<Suspense fallback={...}>`)

### 4. `useRouter` dans page statique
- **Fichiers** : `src/app/profile/page.tsx`, `src/components/Sidebar.tsx`
- **Problème** : `location is not defined` pendant la collecte de données (prerender)
- **Solution** :
  - `profile/page.tsx` : remplacé `router.push` par `<Link href="/dashboard">`
  - `Sidebar.tsx` : remplacé les `<button>` avec `router.push` par des `<Link>` de Next.js
  - Suppression des imports inutiles de `useRouter`

### 5. Doublons d’imports dans `layout.tsx`
- **Fichier** : `src/app/layout.tsx` (avant correction)
- **Problème** : imports dupliqués après tentative précédente
- **Solution** : fichier réécrit proprement

## Structure finale validée

- 19 pages Next.js (toutes présentes)
- Build production réussi (`npm run build`)
- Taille des bundles cohérentes (première charge ~88-114 kB)
- Aucune erreur TypeScript

## Lancer le projet

```bash
cd frontend
npm install    # si ce n’est déjà fait
npm run dev    # développement sur http://localhost:3000
npm run build  # production
```

Backend requis sur `http://localhost:8080` (modifier `.env.local` si nécessaire).
