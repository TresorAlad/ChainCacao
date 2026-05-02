#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname)

console.log('🔍 Vérification de la structure frontend...\n')

// 1. Vérifier que tous les dossiers page ont un page.tsx
const appDir = path.join(root, 'src/app')
const routes = [
  'login', 'register', 'dashboard', 'lots', 'nouveau-lot',
  'lot-detail', 'transfer', 'update-weight', 'export', 'upload-photo',
  'eudr-report', 'qrcode', 'verify', 'sync', 'full-history', 'actors', 'profile', 'about'
]

const missing = []
routes.forEach(route => {
  const pagePath = path.join(appDir, route, 'page.tsx')
  if (!fs.existsSync(pagePath)) {
    missing.push(route)
  }
})

if (missing.length) {
  console.log('❌ Pages manquantes :', missing.join(', '))
} else {
  console.log('✅ Toutes les pages sont présentes')
}

// 2. Vérifier les imports des pages
const importErrors = []
function checkImports(filePath, required) {
  const content = fs.readFileSync(filePath, 'utf8')
  required.forEach(imp => {
    if (!content.includes(imp)) {
      importErrors.push(`${filePath.replace(root, '')}: missing ${imp}`)
    }
  })
}

// Vérifier les imports essentiels par fichier
checkImports(path.join(appDir, 'layout.tsx'), ["'use client'", 'AuthProvider', 'Sidebar', './globals.css'])
checkImports(path.join(appDir, 'page.tsx'), ["'use client'", 'useRouter', 'useAuth'])
checkImports(path.join(appDir, 'login/page.tsx'), ["'use client'", 'useState', 'useAuth'])
checkImports(path.join(appDir, 'lots/page.tsx'), ["'use client'", 'useEffect', 'useState', 'api'])
checkImports(path.join(appDir, 'upload-photo/page.tsx'), ["'use client'", 'FormData', 'fetch'])

// 3. Vérifier les fichiers critiques
const criticalFiles = [
  'src/lib/api.ts',
  'src/contexts/AuthContext.tsx',
  'src/components/Sidebar.tsx',
  'src/components/Spinner.tsx',
  'src/app/globals.css',
  'tailwind.config.ts',
  'next.config.js',
  'tsconfig.json',
  'package.json'
]

criticalFiles.forEach(file => {
  const full = path.join(root, file)
  if (!fs.existsSync(full)) {
    console.log(`❌ Fichier critique manquant : ${file}`)
  }
})

// 4. Compter les pages
let pageCount = 0
function countPages(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(f => {
    const full = path.join(dir, f)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      countPages(full)
    } else if (f === 'page.tsx') {
      pageCount++
    }
  })
}
countPages(appDir)

console.log(`\n📄 Nombre de pages Next.js trouvées : ${pageCount}`)
console.log('   (attendu : 19 pages principales)\n')

// 5. Vérifier package.json dependencies
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const requiredDeps = ['next', 'react', 'react-dom', 'axios', 'react-hot-toast', 'typescript', 'tailwindcss']
const missingDeps = requiredDeps.filter(d => !deps[d])
if (missingDeps.length) {
  console.log('❌ Dépendances manquantes dans package.json :', missingDeps.join(', '))
} else {
  console.log('✅ Dépendances principales présentes')
}

// 6. Vérifier que NEXT_PUBLIC_API_URL est dans .env.local
const envLocal = fs.readFileSync(path.join(root, '.env.local'), 'utf8')
if (!envLocal.includes('NEXT_PUBLIC_API_URL')) {
  console.log('❌ NEXT_PUBLIC_API_URL manquant dans .env.local')
} else {
  console.log('✅ NEXT_PUBLIC_API_URL configuré')
}

// Résumé
console.log('\n📋 Vérification terminée.')
if (importErrors.length > 0) {
  console.log('\n⚠️  Erreurs d\'import détectées :')
  importErrors.forEach(e => console.log('   -', e))
} else {
  console.log('\n✅ Aucune erreur d\'import critique détectée.')
}

console.log('\n🚀 Pour lancer : cd frontend && npm install && npm run dev')
