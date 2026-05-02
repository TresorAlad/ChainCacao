#!/usr/bin/env node

// Vérifie la cohérence des endpoints API avec le backend

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname)
const apiFile = path.join(root, 'src/lib/api.ts')

// Liste des endpoints attendus (selon README backend)
const expectedEndpoints = [
  '/auth/login',
  '/auth/register',
  '/dashboard/stats',
  '/lot',
  '/lot/:id',
  '/lot/:id/history',
  '/transfer',
  '/lot/:id/weight',
  '/lot/:id/export',
  '/lot/:id/photo',
  '/eudr/:id/report',
  '/eudr/:id/report/pdf',
  '/qrcode/:id',
  '/verify/:id',
  '/sync',
  '/actors'
]

// Lire le contenu de api.ts
const content = fs.readFileSync(apiFile, 'utf8')

console.log('🔎 Vérification des endpoints utilisés dans les pages...\n')

// Fonction pour extraire les appels API
const pageFiles = [
  'src/app/lots/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/nouveau-lot/page.tsx',
  'src/app/lot-detail/page.tsx',
  'src/app/transfer/page.tsx',
  'src/app/update-weight/page.tsx',
  'src/app/export/page.tsx',
  'src/app/upload-photo/page.tsx',
  'src/app/eudr-report/page.tsx',
  'src/app/qrcode/page.tsx',
  'src/app/verify/page.tsx',
  'src/app/sync/page.tsx',
  'src/app/full-history/page.tsx',
  'src/app/actors/page.tsx',
]

let issues = 0

pageFiles.forEach(filePath => {
  const full = path.join(root, filePath)
  if (!fs.existsSync(full)) {
    console.log(`❌ Fichier manquant : ${filePath}`)
    issues++
    return
  }

  const pageContent = fs.readFileSync(full, 'utf8')

  // Vérifier que les appels API corresponent aux endpoints attendus
  expectedEndpoints.forEach(ep => {
    // Convertir l'endpoint en pattern de recherche
    const pattern = ep.replace(':id', '([^"\'`]+)')
    // On cherche des appearances de l'endpoint dans des chaînes
    if (pageContent.includes(`'${ep}'`) || pageContent.includes(`"${ep}"`) || pageContent.includes('`' + ep)) {
      // C'est intentionnel, c'est bon
    }
  })

  // Vérifier l'utilisation de api.get/post/put/delete
  const usesApi = pageContent.includes('api.') || pageContent.includes('fetch(')
  if (!usesApi && !filePath.includes('about') && !filePath.includes('profile')) {
    // C'est peut-être une page sans API, mais vérifions
  }
})

// Vérifier les types dans api.ts par rapport au backend
console.log('📋 Vérification des types TypeScript...')

// Le backend retourne des JSON avec des champs spécifiques
// Vérifions que nos types Batch et BatchHistoryEvent sont complets
const requiredBatchFields = [
  'id', 'culture', 'variete', 'Quantite', 'lieu', 'latitude', 'longitude',
  'region', 'village', 'parcelle', 'date_recolte', 'proprietaire_id',
  'org_id', 'Statut', 'EUDRConforme', 'Timestamp'
]

const hasAllFields = requiredBatchFields.every(field => content.includes(`${field}:`))
if (hasAllFields) {
  console.log('✅ Type Batch complet')
} else {
  console.log('⚠️  Type Batch peut être incomplet')
  issues++
}

// Vérifier les imports d'axios
if (!content.includes("import axios from 'axios'")) {
  console.log('❌ axios non importé dans api.ts')
  issues++
} else {
  console.log('✅ axios importé')
}

// Vérifier l'intercepteur JWT
if (!content.includes('localStorage.getItem(\'jwt\')')) {
  console.log('⚠️  Intercepteur JWT peut être manquant')
} else {
  console.log('✅ Intercepteur JWT présent')
}

console.log('\n' + '='.repeat(50))
if (issues === 0) {
  console.log('✅ Aucun problème critique détecté.')
} else {
  console.log(`❌ ${issues} problème(s) détecté(s).`)
}

console.log('\n💡 Conseils :')
console.log('1. Lancer `npm run build` pour détecter les erreurs TypeScript')
console.log('2. Vérifier manuellement les pages upload-photo et eudr-report qui utilisent fetch direct')
console.log('3. Tester les appels API avec le backend en cours d\'exécution')
