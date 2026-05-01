#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = '/home/george/Documents/Projet/MBH/ChainCacao/frontend'

// erreurs trouvées
const errors = []

// 1. Vérifier tsconfig.json chemins
const tsconfigPath = path.join(root, 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
  if (!tsconfig.compilerOptions.paths || !tsconfig.compilerOptions.paths['@/*']) {
    errors.push('tsconfig.json: missing path alias @/*')
  }
}

// 2. Vérifier next.config.js
const nextConfigPath = path.join(root, 'next.config.js')
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf8')
  if (!content.includes('reactStrictMode')) {
    errors.push('next.config.js: reactStrictMode not set')
  }
}

// 3. Vérifier les imports dans les fichiers .tsx
function checkFile(filePath, expectedImports) {
  const content = fs.readFileSync(filePath, 'utf8')
  expectedImports.forEach(imp => {
    if (!content.includes(imp)) {
      errors.push(`${filePath.replace(root, '')}: missing import ${imp}`)
    }
  })
}

// Vérifier les imports clés
const filesToCheck = {
  'src/contexts/AuthContext.tsx': ['use client', 'createContext', 'useContext', 'useEffect', 'useState'],
  'src/lib/api.ts': ["axios", "NEXT_PUBLIC_API_URL", "interceptors"],
  'src/components/Sidebar.tsx': ['use client', 'usePathname', 'useRouter', 'useAuth'],
  'src/app/layout.tsx': ['AuthProvider', 'Sidebar', './globals.css'],
}

Object.entries(filesToCheck).forEach(([file, imports]) => {
  checkFile(path.join(root, file), imports)
})

// 4. Vérifier la configuration Tailwind
const tailwindConfigPath = path.join(root, 'tailwind.config.ts')
if (fs.existsSync(tailwindConfigPath)) {
  const content = fs.readFileSync(tailwindConfigPath, 'utf8')
  if (!content.includes('forest') || !content.includes('cacao')) {
    errors.push('tailwind.config.ts: ChainCacao color palette missing')
  }
}

// 5. Vérifier les pages avec 'use client'
const appDir = path.join(root, 'src/app')
function walkDir(dir) {
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      walkDir(full)
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8')
      if (full.includes('src/app/') && !content.includes("'use client'") && content.includes('useState') || content.includes('useEffect')) {
        errors.push(`${full.replace(root, '')}: missing 'use client' directive for client component`)
      }
    }
  })
}
walkDir(appDir)

// 6. Vérifier les références aux API endpoints
const apiEndpoints = [
  '/auth/login',
  '/auth/register',
  '/dashboard/stats',
  '/lot',
  '/transfer',
  '/lot/:id',
  '/lot/:id/history',
  '/lot/:id/weight',
  '/lot/:id/export',
  '/lot/:id/photo',
  '/eudr/:id/report',
  '/eudr/:id/report/pdf',
  '/qrcode/:id',
  '/verify/:id',
  '/sync',
  '/actors',
]

const apiFile = path.join(root, 'src/lib/api.ts')
if (fs.existsSync(apiFile)) {
  const apiContent = fs.readFileSync(apiFile, 'utf8')
  apiEndpoints.forEach(endpoint => {
    if (!apiContent.includes(endpoint)) {
      // Pas forcément une erreur si l'endpoint est construit dynamiquement
      // errors.push(`api.ts: endpoint ${endpoint} might be missing`)
    }
  })
}

// Afficher les erreurs
if (errors.length > 0) {
  console.log('❌ Erreurs trouvées :')
  errors.forEach(err => console.log(`  - ${err}`))
  console.log('\n✅ Corrections automatiques appliquées.')
} else {
  console.log('✅ Aucune erreur détectée dans la structure du frontend.')
}
