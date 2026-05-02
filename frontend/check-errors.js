#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname)

const errors = []

const tsconfigPath = path.join(root, 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
  if (!tsconfig.compilerOptions.paths || !tsconfig.compilerOptions.paths['@/*']) {
    errors.push('tsconfig.json: missing path alias @/*')
  }
}

const nextConfigPath = path.join(root, 'next.config.js')
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf8')
  if (!content.includes('reactStrictMode')) {
    errors.push('next.config.js: reactStrictMode not set')
  }
}

function checkFile(filePath, expectedImports) {
  const content = fs.readFileSync(filePath, 'utf8')
  expectedImports.forEach((imp) => {
    if (!content.includes(imp)) {
      errors.push(`${filePath.replace(root, '')}: missing import ${imp}`)
    }
  })
}

const filesToCheck = {
  'src/contexts/AuthContext.tsx': ['use client', 'createContext', 'useContext', 'useEffect', 'useState'],
  'src/lib/api.ts': ['axios', 'getApiBaseUrl', 'interceptors'],
  'src/components/Sidebar.tsx': ['use client', 'usePathname', 'useRouter', 'useAuth'],
  'src/components/Header.tsx': ['use client', 'useAuth'],
  'src/app/layout.tsx': ['Providers', './providers', './globals.css'],
}

Object.entries(filesToCheck).forEach(([file, imports]) => {
  checkFile(path.join(root, file), imports)
})

const tailwindConfigPath = path.join(root, 'tailwind.config.ts')
if (fs.existsSync(tailwindConfigPath)) {
  const content = fs.readFileSync(tailwindConfigPath, 'utf8')
  if (!content.includes('forest') || !content.includes('cacao')) {
    errors.push('tailwind.config.ts: ChainCacao color palette missing')
  }
}

const appDir = path.join(root, 'src/app')
function walkDir(dir) {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      walkDir(full)
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8')
      const needsClient =
        full.includes(`${path.sep}src${path.sep}app${path.sep}`) &&
        (content.includes('useState') || content.includes('useEffect')) &&
        !content.includes("'use client'")
      if (needsClient) {
        errors.push(`${full.replace(root, '')}: missing 'use client' directive for client component`)
      }
    }
  })
}
walkDir(appDir)

if (errors.length > 0) {
  console.log('❌ Erreurs trouvées :')
  errors.forEach((err) => console.log(`  - ${err}`))
  process.exit(1)
}

console.log('✅ Aucune erreur détectée dans la structure du frontend.')
